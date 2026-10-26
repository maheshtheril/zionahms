'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { logPhiAccess, PhiAuditAction } from "@/lib/hipaa-audit"

export async function getPatientHistory(patientId: string) {
    const session = await auth()
    if (!session?.user?.tenantId) return { success: false, error: "Unauthorized" }

    try {
        const history = await prisma.hms_patient_history.findMany({
            where: { 
                patient_id: patientId,
                tenant_id: session.user.tenantId
            },
            orderBy: { changed_at: 'desc' },
            take: 100
        })

        // Fetch user profiles for changed_by IDs to display clinician names
        const userIds = Array.from(new Set(history.map(h => h.changed_by).filter(Boolean))) as string[]
        const users = userIds.length > 0 
            ? await prisma.app_user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true, role: true, email: true }
            })
            : []
        
        const userMap = new Map(users.map(u => [u.id, u]))

        const enrichedHistory = history.map(item => {
            const user = item.changed_by ? userMap.get(item.changed_by) : null
            const metadata = (item.new_data as any) || {}
            return {
                ...item,
                userName: user?.name || metadata.actorName || 'Staff Clinician',
                userRole: user?.role || metadata.actorRole || 'Care Provider',
                userEmail: user?.email || null
            }
        })

        // Serialize BigInt and Date objects cleanly
        return { 
            success: true, 
            data: JSON.parse(JSON.stringify(enrichedHistory, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            ))
        }
    } catch (err: any) {
        console.error("[HIPAA-AUDIT] Query Error:", err)
        return { success: false, error: err.message }
    }
}

/**
 * Server action to record patient chart access (HIPAA § 164.312(b))
 */
export async function recordPatientAccess(
    patientId: string, 
    action: PhiAuditAction = 'VIEW', 
    reason: string = 'Clinical Chart Review'
) {
    const session = await auth()
    if (!session?.user?.tenantId) return { success: false }

    try {
        await logPhiAccess({
            patientId,
            tenantId: session.user.tenantId,
            actorId: session.user.id || null,
            actorName: session.user.name || 'Attending Clinician',
            actorRole: (session.user as any)?.role || 'Staff',
            action,
            reason
        })
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}
