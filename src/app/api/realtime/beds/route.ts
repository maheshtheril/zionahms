import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { verifyMobileAuth } from '@/lib/mobile-auth'
import { prisma } from '@/lib/prisma'
import { eventBus } from '@/lib/realtime/event-bus'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    // 1. Resolve Tenant ID
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
            const unsubscribe = eventBus.subscribe(resolvedTenantId, 'beds', controller)

            // Send initial bed turnover snapshot
            try {
                const wards = await prisma.hms_ward.findMany({
                    where: { tenant_id: resolvedTenantId },
                    include: {
                        hms_bed: true
                    }
                })

                const bedList = wards.flatMap(w => 
                    w.hms_bed.map(b => ({
                        bedId: b.id,
                        bedNo: b.bed_no,
                        wardId: w.id,
                        wardName: w.name,
                        status: b.status,
                        timestamp: new Date().toISOString()
                    }))
                )

                const snapshotMessage = eventBus.formatSSE('BED_SNAPSHOT', {
                    beds: bedList,
                    totalBeds: bedList.length
                })
                controller.enqueue(encoder.encode(snapshotMessage))
            } catch (err: any) {
                console.error('[REALTIME-BEDS] Snapshot error:', err?.message || err)
            }

            // Keep-alive ping interval
            const pingInterval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': keep-alive ping\n\n'))
                } catch {
                    clearInterval(pingInterval)
                    unsubscribe()
                }
            }, 25000)

            // Cleanup on client disconnect
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
            'X-Accel-Buffering': 'no'
        }
    })
}
