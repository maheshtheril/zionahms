import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileAuth, mobileResponse } from '@/lib/mobile-auth'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
    const auth = await verifyMobileAuth(req)
    if (!auth.authenticated || auth.payload?.role !== 'DOCTOR') {
        return auth.errorResponse || NextResponse.json({ error: 'Unauthorized: Doctor role required' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const {
            appointmentId,
            patientId,
            complaints,
            diagnosis,
            plan,
            medications = [],
            labTests = []
        } = body

        if (!patientId) {
            return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
        }

        const tenantId = auth.payload.tenantId
        const doctorUserId = auth.payload.sub
        const clinicianId = auth.payload.clinicianId

        // 1. Create Doctor Clinical Note
        let noteRecord = null
        if (diagnosis || complaints || plan) {
            const content = `Chief Complaints: ${Array.isArray(complaints) ? complaints.join(', ') : complaints || 'None'}\nDiagnosis: ${diagnosis || 'Clinical evaluation'}\nPlan: ${plan || 'Routine follow-up'}`
            noteRecord = await prisma.doctor_note.create({
                data: {
                    id: randomUUID(),
                    doctor_id: doctorUserId,
                    patient_id: patientId,
                    appointment_id: appointmentId || null,
                    title: `Consultation: ${diagnosis || 'General OPD'}`,
                    content
                }
            })
        }

        // 2. Create Prescription if medications provided
        let prescriptionRecord = null
        if (Array.isArray(medications) && medications.length > 0) {
            prescriptionRecord = await prisma.prescription.create({
                data: {
                    id: randomUUID(),
                    tenant_id: tenantId,
                    patient_id: patientId,
                    doctor_id: clinicianId || null,
                    appointment_id: appointmentId || null,
                    diagnosis: diagnosis || 'Clinical Encounter',
                    complaint: Array.isArray(complaints) ? complaints.join(', ') : complaints || null,
                    plan: plan || null
                }
            })

            // Fetch or resolve medicine product IDs
            for (const med of medications) {
                // Find or match product
                let product = await prisma.hms_product.findFirst({
                    where: {
                        tenant_id: tenantId,
                        name: { contains: med.name, mode: 'insensitive' }
                    },
                    select: { id: true }
                })

                // If not found, use first medicine product or create fallback
                if (!product) {
                    product = await prisma.hms_product.findFirst({
                        where: { tenant_id: tenantId, is_stockable: true, is_active: true },
                        select: { id: true }
                    })
                }

                if (product) {
                    const days = parseInt(med.duration) || 5
                    await prisma.prescription_items.create({
                        data: {
                            id: randomUUID(),
                            prescription_id: prescriptionRecord.id,
                            medicine_id: product.id,
                            morning: med.frequency?.includes('1-') ? 1 : 1,
                            afternoon: med.frequency?.includes('-1-') ? 1 : 0,
                            evening: 0,
                            night: med.frequency?.endsWith('-1') ? 1 : 1,
                            days: days
                        }
                    })
                }
            }
        }

        // 3. Mark Appointment as Completed
        if (appointmentId) {
            await prisma.hms_appointments.update({
                where: { id: appointmentId },
                data: { status: 'completed' }
            }).catch(() => null)
        }

        return mobileResponse({
            encounterCompleted: true,
            noteId: noteRecord?.id,
            prescriptionId: prescriptionRecord?.id,
            completedAt: new Date().toISOString()
        }, 201, 'ConsultationFinalized')

    } catch (err: any) {
        console.error('[DOCTOR-CONSULTATION] Error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

