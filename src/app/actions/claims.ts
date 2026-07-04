'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function getClaims(status?: string) {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, data: [] };

    try {
        const claims = await prisma.hms_insurance_claim.findMany({
            where: {
                tenant_id: session.user.tenantId,
                ...(status ? { status } : {})
            },
            include: {
                invoice: {
                    select: { invoice_no: true }
                },
                provider: {
                    select: { name: true }
                },
                patient_insurance: {
                    include: {
                        patient: {
                            select: { first_name: true, last_name: true, patient_number: true }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        return { success: true, data: claims };
    } catch (error) {
        console.error("Failed to fetch claims:", error);
        return { success: false, data: [] };
    }
}

export async function updateClaimStatus(claimIds: string[], newStatus: string, notes?: string) {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: "Unauthorized" };

    try {
        await prisma.$transaction(async (tx) => {
            // Update main claim status
            await tx.hms_insurance_claim.updateMany({
                where: {
                    id: { in: claimIds },
                    tenant_id: session.user.tenantId
                },
                data: {
                    status: newStatus,
                    ...(newStatus === 'submitted' ? { submitted_at: new Date() } : {}),
                    ...(notes ? { denial_reason: notes } : {})
                }
            });

            // Sync claim lines
            let lineStatus = 'pending';
            if (newStatus === 'paid') lineStatus = 'paid';
            if (newStatus === 'denied') lineStatus = 'denied';

            if (lineStatus !== 'pending') {
                await tx.hms_insurance_claim_line.updateMany({
                    where: {
                        claim_id: { in: claimIds },
                        tenant_id: session.user.tenantId
                    },
                    data: { status: lineStatus }
                });
            }
        });

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update claims:", error);
        return { success: false, error: error.message };
    }
}
