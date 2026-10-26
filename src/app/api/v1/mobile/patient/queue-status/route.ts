import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileAuth, mobileResponse } from '@/lib/mobile-auth'

export async function GET(req: NextRequest) {
    const auth = await verifyMobileAuth(req)
    if (!auth.authenticated || !auth.payload?.patientId) {
        return auth.errorResponse || NextResponse.json({ error: 'Unauthorized patient context' }, { status: 401 })
    }

    try {
        const patientId = auth.payload.patientId
        const tenantId = auth.payload.tenantId

        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        // Find today's active appointment for this patient
        const myAppointment = await prisma.hms_appointments.findFirst({
            where: {
                tenant_id: tenantId,
                patient_id: patientId,
                starts_at: { gte: todayStart, lte: todayEnd },
                status: { notIn: ['cancelled', 'completed'] }
            },
            include: {
                hms_clinician: {
                    select: {
                        id: true,
                        salutation: true,
                        first_name: true,
                        last_name: true,
                        hms_specializations: { select: { name: true } }
                    }
                }
            },
            orderBy: { starts_at: 'asc' }
        })

        if (!myAppointment) {
            return mobileResponse({
                hasActiveQueue: false,
                message: 'No active appointments scheduled for today.'
            }, 200, 'QueueStatus')
        }

        const myTokenNumber = Number(myAppointment.token_number || 1)
        const clinicianId = myAppointment.clinician_id

        // Find which appointment is currently 'in-consultation' with this doctor
        const activeConsultation = await prisma.hms_appointments.findFirst({
            where: {
                tenant_id: tenantId,
                clinician_id: clinicianId,
                starts_at: { gte: todayStart, lte: todayEnd },
                status: 'in-consultation'
            },
            orderBy: { starts_at: 'asc' }
        })

        const currentCallingToken = activeConsultation
            ? Number(activeConsultation.token_number || 1)
            : Math.max(1, myTokenNumber - 2) // fallback simulation if doctor hasn't tapped button yet

        const patientsAhead = Math.max(0, myTokenNumber - currentCallingToken)
        const estimatedWaitMinutes = patientsAhead * 10

        const doc = myAppointment.hms_clinician
        const doctorName = doc ? `${doc.salutation || 'Dr.'} ${doc.first_name} ${doc.last_name}` : 'Consultant'

        return mobileResponse({
            hasActiveQueue: true,
            appointmentId: myAppointment.id,
            myTokenNumber,
            currentCallingToken,
            patientsAhead,
            estimatedWaitMinutes,
            status: myAppointment.status,
            doctorName,
            specialization: doc?.hms_specializations?.name || 'OPD',
            scheduledTime: myAppointment.starts_at
        }, 200, 'QueueStatus')

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

