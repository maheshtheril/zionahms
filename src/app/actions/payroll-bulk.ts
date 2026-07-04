'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type BulkSalaryInput = {
    userId: string
    baseSalary: number
    hourlyRate: number
    allowances: Record<string, number>
    deductions: Record<string, number>
}

export async function bulkUpsertSalary(records: BulkSalaryInput[]) {
    const session = await auth()
    if (!session?.user?.id || !session.user.tenantId) {
        return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId

    try {
        await prisma.$transaction(
            records.map(r => 
                prisma.hms_staff_salary.upsert({
                    where: { user_id: r.userId },
                    create: {
                        tenant_id: tenantId,
                        user_id: r.userId,
                        base_salary: r.baseSalary,
                        hourly_rate: r.hourlyRate,
                        allowances: r.allowances,
                        deductions: r.deductions
                    },
                    update: {
                        base_salary: r.baseSalary,
                        hourly_rate: r.hourlyRate,
                        allowances: r.allowances,
                        deductions: r.deductions,
                        updated_at: new Date()
                    }
                })
            )
        )

        revalidatePath('/hms/hr/payroll/structure')
        return { success: true }
    } catch (e: any) {
        console.error("Failed to bulk save salaries:", e)
        return { success: false, error: e.message }
    }
}
