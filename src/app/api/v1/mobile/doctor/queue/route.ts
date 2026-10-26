import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileAuth, mobileResponse } from '@/lib/mobile-auth'

export async function GET(req: NextRequest) {
    const auth = await verifyMobileAuth(req)
    if (!auth.authenticated || auth.payload?.role !== 'DOCTOR') {
        return auth.errorResponse || NextResponse.json({ error: 'Unauthorized: Doctor role required' }, { status: 403 })
    }

    try {
        const tenantId = auth.payload.tenantId
        const clinicianId = auth.payload.clinicianId

        // If doctor has clinicianId, filter by clinician; otherwise fetch today's branch/tenant appointments
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)

        const whereClause: any = {
            tenant_id: tenantId,
            starts_at: { gte: todayStart, lte: todayEnd }
        }
        if (clinicianId) {
            whereClause.clinician_id = clinicianId
        }

        const appointments = await prisma.hms_appointments.findMany({
            where: whereClause,
            include: {
                hms_patient: {
                    select: {
                        id: true,
                        patient_number: true,
                        first_name: true,
                        last_name: true,
                        full_name: true,
                        gender: true,
                        dob: true,
                        blood_group: true,
                        hms_vitals: {
                            orderBy: { recorded_at: 'desc' },
                            take: 1
                        }
                    }
                }
            },
            orderBy: { starts_at: 'asc' }
        })

        const queue = appointments.map(apt => {
            const p = apt.hms_patient
            const latestVital = p?.hms_vitals?.[0]
            return {
                appointmentId: apt.id,
                tokenNumber: apt.token_number ? `#${apt.token_number}` : 'Queue',
                startsAt: apt.starts_at,
                status: apt.status || 'scheduled',
                reason: apt.notes || 'Consultation',
                patient: {
                    id: p?.id,
                    mrn: p?.patient_number,
                    name: p?.full_name || `${p?.first_name || ''} ${p?.last_name || ''}`.trim(),
                    gender: p?.gender,
                    bloodGroup: p?.blood_group,
                    latestVitals: latestVital ? {
                        bp: latestVital.systolic && latestVital.diastolic ? `${latestVital.systolic}/${latestVital.diastolic}` : null,
                        pulse: latestVital.pulse,
                        temp: latestVital.temperature ? Number(latestVital.temperature) : null,
                        spo2: latestVital.spo2
                    } : null
                }
            }
        })

        return mobileResponse({
            date: todayStart.toISOString().split('T')[0],
            totalPatients: queue.length,
            waitingCount: queue.filter(q => q.status === 'scheduled').length,
            inConsultationCount: queue.filter(q => q.status === 'in-consultation').length,
            completedCount: queue.filter(q => q.status === 'completed').length,
            queue
        }, 200, 'DoctorDailyQueueBundle')

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await verifyMobileAuth(req)
    if (!auth.authenticated || auth.payload?.role !== 'DOCTOR') {
        return auth.errorResponse || NextResponse.json({ error: 'Unauthorized: Doctor role required' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { appointmentId, status } = body

        if (!appointmentId || !status) {
            return NextResponse.json({ error: 'Appointment ID and status are required' }, { status: 400 })
        }

        const validStatuses = ['scheduled', 'in-consultation', 'completed', 'cancelled', 'no-show']
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: `Invalid status. Valid values: ${validStatuses.join(', ')}` }, { status: 400 })
        }

        const updated = await prisma.hms_appointments.update({
            where: { id: appointmentId },
            data: { status }
        })

        return mobileResponse({
            id: updated.id,
            status: updated.status,
            updatedAt: new Date().toISOString()
        }, 200, 'QueueStatusUpdated')

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

