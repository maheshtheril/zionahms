import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { BulkSalaryGrid } from "@/components/hr/bulk-salary-grid"
import { redirect } from "next/navigation"

export const metadata = {
    title: 'Salary Structures | HR | Enterprise ERP'
}

export default async function SalaryStructurePage() {
    const session = await auth()
    if (!session?.user?.id || !session.user.tenantId) {
        redirect("/login")
    }

    // 1. Fetch all active users in tenant
    const users = await prisma.app_user.findMany({
        where: { tenant_id: session.user.tenantId, is_active: true },
        select: { id: true, name: true, email: true, role: true }
    })

    // 2. Fetch all salary structures
    const salaries = await prisma.hms_staff_salary.findMany({
        where: { tenant_id: session.user.tenantId }
    })

    // Map salary to user
    const salaryMap: Record<string, any> = {}
    salaries.forEach(s => {
        salaryMap[s.user_id] = {
            userId: s.user_id,
            baseSalary: Number(s.base_salary),
            hourlyRate: Number(s.hourly_rate),
            allowances: s.allowances || {},
            deductions: s.deductions || {}
        }
    })

    // Format users for client
    const staffUsers = users.map(u => ({
        id: u.id,
        name: u.name || 'Unknown',
        email: u.email || 'No email',
        role: u.role || 'Staff'
    }))

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Enterprise Salary Master</h1>
                <p className="text-slate-500 mt-2">Manage base pay, allowances, and deductions for all employees in a bulk grid.</p>
            </div>

            <BulkSalaryGrid 
                users={staffUsers} 
                initialSalaries={salaryMap} 
            />
        </div>
    )
}
