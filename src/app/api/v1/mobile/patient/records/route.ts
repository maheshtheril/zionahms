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

        // 1. Prescriptions
        const prescriptions = await prisma.prescription.findMany({
            where: { tenant_id: tenantId, patient_id: patientId },
            include: {
                prescription_items: {
                    include: { hms_product: { select: { name: true, sku: true } } }
                }
            },
            orderBy: { created_at: 'desc' },
            take: 20
        })

        // 2. Lab Orders & Results
        const labOrders = await prisma.hms_lab_order.findMany({
            where: { tenant_id: tenantId, patient_id: patientId },
            include: {
                hms_lab_order_line: {
                    include: {
                        hms_lab_test: true
                    }
                }
            },
            orderBy: { created_at: 'desc' },
            take: 20
        })

        // 3. Vitals Timeline
        const vitals = await prisma.hms_vitals.findMany({
            where: { tenant_id: tenantId, patient_id: patientId },
            orderBy: { recorded_at: 'desc' },
            take: 15
        })

        // Format into 2050 unified health record
        const formattedPrescriptions = prescriptions.map(p => ({
            id: p.id,
            date: p.created_at,
            doctorNotes: p.diagnosis || p.plan || p.complaint || 'Prescription',
            medications: p.prescription_items.map(item => ({
                name: item.hms_product?.name || 'Medication',
                dosage: item.uom || 'Unit',
                frequency: `${item.morning}-${item.afternoon}-${item.evening}-${item.night}`,
                duration: `${item.days || 1} days`,
                instructions: item.uom || ''
            }))
        }))

        const formattedLabs = labOrders.map(order => ({
            id: order.id,
            orderDate: order.ordered_at || order.created_at,
            status: order.status,
            tests: (order.hms_lab_order_line || []).map((line: any) => ({
                testName: line.hms_lab_test?.name || 'Lab Test',
                status: line.status,
                results: []
            }))
        }))

        const formattedVitals = vitals.map(v => ({
            id: v.id,
            recordedAt: v.recorded_at,
            temperature: v.temperature ? Number(v.temperature) : null,
            pulse: v.pulse ? Number(v.pulse) : null,
            bloodPressure: v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic} mmHg` : null,
            spo2: v.spo2 ? Number(v.spo2) : null,
            weightKg: v.weight ? Number(v.weight) : null
        }))

        return mobileResponse({
            summary: {
                totalPrescriptions: prescriptions.length,
                totalLabOrders: labOrders.length,
                totalVitalLogs: vitals.length
            },
            prescriptions: formattedPrescriptions,
            labOrders: formattedLabs,
            vitalsTimeline: formattedVitals
        }, 200, 'UnifiedPatientHealthRecord')

    } catch (error: any) {
        console.error('[MOBILE-PATIENT-RECORDS] Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to fetch medical records' }, { status: 500 })
    }
}
