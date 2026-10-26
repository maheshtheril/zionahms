import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { verifyMobileAuth } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { eventBus } from '@/lib/realtime/event-bus'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    // 1. Resolve Tenant ID (Web Session or Bearer Token)
    let tenantId: string | null = null

    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const tokenResult = await verifyMobileAuth(req)
        if (tokenResult.authenticated && tokenResult.payload?.tenantId) {
            tenantId = tokenResult.payload.tenantId
        }
    }

    if (!tenantId) {
        const session = await auth()
        tenantId = session?.user?.tenantId || null
    }

    if (!tenantId) {
        return NextResponse.json({ error: 'Unauthorized: Missing tenant boundary' }, { status: 401 })
    }

    const resolvedTenantId = tenantId
    const encoder = new TextEncoder()

    // 2. Setup Server-Sent Events Stream
    const stream = new ReadableStream({
        async start(controller) {
            // Subscribe controller to the tenant queue channel
            const unsubscribe = eventBus.subscribe(resolvedTenantId, 'queue', controller)

            // Send initial queue snapshot
            try {
                const todayStart = new Date()
                todayStart.setHours(0, 0, 0, 0)
                const todayEnd = new Date()
                todayEnd.setHours(23, 59, 59, 999)

                const activeAppointments = await prisma.hms_appointments.findMany({
                    where: {
                        tenant_id: resolvedTenantId,
                        starts_at: { gte: todayStart, lte: todayEnd },
                        status: { notIn: ['cancelled', 'completed'] }
                    },
                    include: {
                        hms_patient: { select: { id: true, full_name: true, first_name: true, last_name: true, patient_number: true } },
                        hms_clinician: { select: { id: true, first_name: true, last_name: true, salutation: true } }
                    },
                    orderBy: { starts_at: 'asc' },
                    take: 50
                })

                const snapshotData = activeAppointments.map(apt => {
                    const p = apt.hms_patient
                    const d = apt.hms_clinician
                    return {
                        appointmentId: apt.id,
                        tokenNumber: apt.token_number || 1,
                        patientName: p?.full_name || `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || 'Patient',
                        patientMrn: p?.patient_number || undefined,
                        doctorName: d ? `${d.salutation || 'Dr.'} ${d.first_name} ${d.last_name}` : 'Consultant',
                        status: apt.status,
                        roomNumber: apt.room_id || 'Room 1',
                        timestamp: new Date().toISOString()
                    }
                })

                const snapshotMessage = eventBus.formatSSE('QUEUE_SNAPSHOT', {
                    tokens: snapshotData,
                    totalPending: snapshotData.length
                })
                controller.enqueue(encoder.encode(snapshotMessage))
            } catch (err: any) {
                console.error('[REALTIME-QUEUE] Snapshot error:', err?.message || err)
            }

            // Keep-alive ping interval (every 25 seconds to prevent cloud proxy disconnects)
            const pingInterval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': keep-alive ping\n\n'))
                } catch {
                    clearInterval(pingInterval)
                    unsubscribe()
                }
            }, 25000)

            // Handle client disconnect
            req.signal.addEventListener('abort', () => {
                clearInterval(pingInterval)
                unsubscribe()
                try {
                    controller.close()
                } catch {}
            })
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Disables Nginx response buffering for zero-lag streaming
        }
    })
}
