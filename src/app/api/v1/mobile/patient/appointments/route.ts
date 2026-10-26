import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileAuth, mobileResponse } from '@/lib/mobile-auth'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
    const auth = await verifyMobileAuth(req)
    if (!auth.authenticated || !auth.payload?.patientId) {
        return auth.errorResponse || NextResponse.json({ error: 'Unauthorized patient context' }, { status: 401 })
    }

    try {
        const patientId = auth.payload.patientId
        const tenantId = auth.payload.tenantId

        const appointments = await prisma.hms_appointments.findMany({
            where: {
                tenant_id: tenantId,
                patient_id: patientId
            },
            include: {
                hms_clinician: {
                    select: {
                        id: true,
                        salutation: true,
                        first_name: true,
                        last_name: true,
                        hms_specializations: { select: { name: true } },
                        profile_image_url: true
                    }
                }
            },
            orderBy: { starts_at: 'desc' },
            take: 30
        })

        // Map into clean 2050 Mobile schema
        const mapped = appointments.map(apt => {
            const doc = apt.hms_clinician
            const docName = doc ? `${doc.salutation || 'Dr.'} ${doc.first_name} ${doc.last_name}` : 'Attending Clinician'
            return {
                id: apt.id,
                tokenNumber: apt.token_number ? `#${apt.token_number}` : 'Queue',
                startsAt: apt.starts_at,
                endsAt: apt.ends_at,
                status: apt.status || 'scheduled',
                type: apt.type || 'in-person',
                reason: apt.notes || 'Consultation',
                doctor: {
                    id: doc?.id,
                    name: docName,
                    specialization: doc?.hms_specializations?.name || 'General Medicine',
                    avatar: doc?.profile_image_url
                }
            }
        })

        return mobileResponse(mapped, 200, 'PatientAppointmentBundle')
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const auth = await verifyMobileAuth(req)
    if (!auth.authenticated || !auth.payload?.patientId) {
        return auth.errorResponse || NextResponse.json({ error: 'Unauthorized patient context' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { clinicianId, startsAt, reason } = body

        if (!clinicianId || !startsAt) {
            return NextResponse.json({ error: 'Clinician and appointment time are required' }, { status: 400 })
        }

        const patientId = auth.payload.patientId
        const tenantId = auth.payload.tenantId
        const startTime = new Date(startsAt)
        const endTime = new Date(startTime.getTime() + 15 * 60000) // 15-min slot

        // Generate Day Token Number
        const todayStart = new Date(startTime)
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(startTime)
        todayEnd.setHours(23, 59, 59, 999)

        const todaysCount = await prisma.hms_appointments.count({
            where: {
                tenant_id: tenantId,
                clinician_id: clinicianId,
                starts_at: { gte: todayStart, lte: todayEnd }
            }
        })

        const tokenNumber = todaysCount + 1

        const appointment = await prisma.hms_appointments.create({
            data: {
                id: randomUUID(),
                tenant_id: tenantId,
                patient_id: patientId,
                clinician_id: clinicianId,
                starts_at: startTime,
                ends_at: endTime,
                status: 'scheduled',
                token_number: tokenNumber, notes: reason || 'Mobile App Booking'
            }
        })

        return mobileResponse({
            id: appointment.id,
            tokenNumber,
            startsAt: appointment.starts_at,
            status: appointment.status,
            message: `Appointment booked. Your Token Number is #${tokenNumber}`
        }, 201, 'AppointmentConfirmation')
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

