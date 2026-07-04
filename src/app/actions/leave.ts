'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getLeaveRequests() {
    const session = await auth()
    if (!session?.user?.id) return []

    try {
        const leaves = await prisma.hms_staff_leave.findMany({
            where: { tenant_id: session.user.tenantId },
            orderBy: { created_at: 'desc' }
        })
        return leaves
    } catch (error) {
        console.error("Failed to fetch leaves:", error)
        return []
    }
}

export async function requestLeave(data: { type: string, startDate: string, endDate: string, reason: string }) {
    const session = await auth()
    if (!session?.user?.id || !session.user.tenantId) return { error: "Unauthorized" }

    try {
        await prisma.hms_staff_leave.create({
            data: {
                tenant_id: session.user.tenantId,
                user_id: session.user.id,
                leave_type: data.type,
                start_date: new Date(data.startDate),
                end_date: new Date(data.endDate),
                reason: data.reason,
                status: 'pending'
            }
        })
        revalidatePath('/hms/hr/leave')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updateLeaveStatus(leaveId: string, status: string) {
    const session = await auth()
    if (!session?.user?.isAdmin) return { error: "Unauthorized" }

    try {
        await prisma.hms_staff_leave.update({
            where: { id: leaveId },
            data: { status }
        })
        revalidatePath('/hms/hr/leave')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
