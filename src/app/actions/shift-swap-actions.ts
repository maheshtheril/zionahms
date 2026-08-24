'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function requestShiftSwap(input: {
    targetRosterId: string;
    requestedShiftId: string;
    reason: string;
}) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.tenantId) {
        return { error: "Unauthorized" };
    }

    try {
        const { targetRosterId, requestedShiftId, reason } = input;
        const tenantId = session.user.tenantId;
        const companyId = session.user.companyId || tenantId;

        // Verify target roster exists
        const roster = await prisma.hms_staff_roster.findUnique({
            where: { id: targetRosterId },
            include: { hms_staff_shift: true }
        });

        if (!roster) return { error: "Roster entry not found" };

        // Save shift swap request in roster metadata
        const currentMeta = (roster.metadata as any) || {};
        const swapRequest = {
            id: `swap-${Date.now()}`,
            requesterId: session.user.id,
            requestedShiftId,
            reason,
            status: 'pending',
            requestedAt: new Date().toISOString()
        };

        await prisma.hms_staff_roster.update({
            where: { id: targetRosterId },
            data: {
                metadata: {
                    ...currentMeta,
                    swap_requests: [...(currentMeta.swap_requests || []), swapRequest]
                }
            }
        });

        revalidatePath('/hms/attendance');
        revalidatePath('/hms/hr');
        return { success: true, message: "Shift swap request submitted for supervisor approval." };

    } catch (err: any) {
        return { error: err.message || "Failed to submit shift swap request" };
    }
}

export async function recordBreakLog(type: 'tea' | 'lunch' | 'personal', action: 'start' | 'end') {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.tenantId) {
        return { error: "Unauthorized" };
    }

    try {
        const userId = session.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeAttendance = await prisma.hms_staff_attendance.findFirst({
            where: { user_id: userId, check_in: { gte: today }, check_out: null }
        });

        if (!activeAttendance) {
            return { error: "You must be punched in to log a break." };
        }

        const meta = (activeAttendance.metadata as any) || {};
        const breaks = meta.break_logs || [];

        if (action === 'start') {
            breaks.push({
                id: `break-${Date.now()}`,
                type,
                startTime: new Date().toISOString(),
                endTime: null
            });
        } else {
            // End active break
            const lastBreak = breaks.find((b: any) => !b.endTime);
            if (lastBreak) {
                lastBreak.endTime = new Date().toISOString();
            }
        }

        await prisma.hms_staff_attendance.update({
            where: { id: activeAttendance.id },
            data: {
                metadata: {
                    ...meta,
                    break_logs: breaks
                }
            }
        });

        revalidatePath('/hms/attendance');
        return { success: true, message: `Break (${type.toUpperCase()}) ${action === 'start' ? 'started' : 'ended'}.` };

    } catch (e: any) {
        return { error: e.message || "Failed to log break" };
    }
}
