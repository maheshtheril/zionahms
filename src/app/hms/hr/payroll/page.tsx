import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { format, subMonths } from "date-fns"
import { PayrollDashboardClient } from "./payroll-dashboard-client"

export const metadata = {
    title: 'Payroll Processing | HR | Enterprise ERP'
}

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
    const session = await auth()
    if (!session?.user?.isAdmin) return <div>Unauthorized</div>

    const params = await searchParams
    const currentMonthYear = params?.month || format(new Date(), "yyyy-MM")

    // Generate last 6 months for the dropdown
    const availableMonths = Array.from({ length: 6 }).map((_, i) => {
        const d = subMonths(new Date(), i)
        return format(d, 'yyyy-MM')
    })

    // Fetch salaries
    const usersWithSalary = await prisma.hms_staff_salary.findMany({
        where: { tenant_id: session.user.tenantId }
    })

    // We only want to list users from app_user if they exist and are active
    const users = await prisma.app_user.findMany({
        where: { tenant_id: session.user.tenantId, is_active: true }
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    // Match up the configured staff salaries with active users
    const validStaff = usersWithSalary.filter(s => userMap.has(s.user_id)).map(s => {
        const user = userMap.get(s.user_id) as any
        return {
            id: s.user_id,
            name: user?.name || user?.email || 'Unknown',
            base_salary: Number(s.base_salary)
        }
    })

    // Fetch existing slips for this month
    const slips = await prisma.hms_payroll_slip.findMany({
        where: {
            tenant_id: session.user.tenantId,
            month_year: currentMonthYear
        }
    })
    const slipMap = new Map(slips.map(s => [s.user_id, s]))

    // Serialize data for client
    const serializedStaff = validStaff.map(s => {
        const slip = slipMap.get(s.id) as any
        return {
            ...s,
            slip: slip ? {
                id: slip.id,
                net_pay: Number(slip.net_pay),
                base_salary: Number(slip.base_salary),
                total_deduction: Number(slip.total_deduction),
                status: slip.status,
                attendance_data: slip.attendance_data as any
            } : null
        }
    })

    return (
        <PayrollDashboardClient 
            initialMonth={currentMonthYear}
            availableMonths={availableMonths}
            staffData={serializedStaff}
        />
    )
}
