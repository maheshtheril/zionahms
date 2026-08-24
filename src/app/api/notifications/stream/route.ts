import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { notificationBus, RealtimeNotification } from '@/lib/events/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.tenantId) {
        return new Response('Unauthorized', { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userRole = (session.user as any)?.role?.toLowerCase() || '';

    const channelKey = `tenant:${tenantId}:company:${companyId}`;

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            // Send initial connection ACK
            const ack = `data: ${JSON.stringify({ type: 'CONNECTED', message: 'Real-time alert stream active' })}\n\n`;
            controller.enqueue(encoder.encode(ack));

            // Listener function for events
            const onNotification = (notif: RealtimeNotification) => {
                // Filter by role or target user if specified
                if (notif.targetUserId && notif.targetUserId !== userId) return;
                if (notif.targetRole && userRole && !notif.targetRole.toLowerCase().includes(userRole) && !userRole.includes(notif.targetRole.toLowerCase())) {
                    // Allow if user is admin or superuser
                    if (!userRole.includes('admin') && !userRole.includes('super')) return;
                }

                try {
                    const data = `data: ${JSON.stringify(notif)}\n\n`;
                    controller.enqueue(encoder.encode(data));
                } catch (err) {
                    console.error('[SSE Stream Error]', err);
                }
            };

            notificationBus.on(channelKey, onNotification);

            // Send heartbeat every 15s to keep SSE connection open through proxies/Vercel
            const heartbeatInterval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': heartbeat\n\n'));
                } catch (e) {
                    clearInterval(heartbeatInterval);
                }
            }, 15000);

            // Cleanup on client disconnect
            req.signal.addEventListener('abort', () => {
                clearInterval(heartbeatInterval);
                notificationBus.off(channelKey, onNotification);
                try {
                    controller.close();
                } catch (e) {
                    // Stream already closed
                }
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Prevent Nginx buffering
        }
    });
}
