'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { format, startOfMonth, endOfMonth, differenceInDays, getDaysInMonth, eachDayOfInterval, isWeekend } from "date-fns"
import { Prisma } from "@prisma/client"

export async function getStaffSalaries() {
    const session = await auth()
    if (!session?.user?.id || !session.user.tenantId) return []

    try {
        // Include user details for the UI
        const salaries = await prisma.hms_staff_salary.findMany({
            where: { tenant_id: session.user.tenantId }
        })
        return salaries
    } catch (error) {
        console.error("Failed to fetch salaries:", error)
        return []
    }
}

export async function calculateMonthlyPayroll(
    userId: string, 
    monthYear: string, 
    calculationBasis: 'total_days' | 'working_days' = 'total_days'
) {
    const session = await auth()
    if (!session?.user?.id || !session.user.tenantId) return { error: "Unauthorized" }

    try {
        // 1. Fetch Salary Structure
        const salaryInfo = await prisma.hms_staff_salary.findUnique({
            where: { user_id: userId }
        })
        
        if (!salaryInfo) {
            return { error: "No salary structure configured for this employee." }
        }

        // Parse JSON Allowances & Deductions
        const allowances = (salaryInfo.allowances as any) || {}
        const deductions = (salaryInfo.deductions as any) || {}
        
        let totalAllowance = 0
        let totalFixedDeduction = 0
        
        Object.values(allowances).forEach((val: any) => totalAllowance += Number(val) || 0)
        Object.values(deductions).forEach((val: any) => totalFixedDeduction += Number(val) || 0)

        const baseSalary = Number(salaryInfo.base_salary) || 0
        const grossSalary = baseSalary + totalAllowance

        // 2. Calculate Date Ranges
        const [year, month] = monthYear.split('-').map(Number)
        const startDate = new Date(year, month - 1, 1)
        const endDate = endOfMonth(startDate)

        const totalDaysInMonth = getDaysInMonth(startDate)
        
        // Calculate total working days (excluding weekends) if selected
        let totalWorkingDays = 0
        if (calculationBasis === 'working_days') {
            const allDays = eachDayOfInterval({ start: startDate, end: endDate })
            totalWorkingDays = allDays.filter(day => !isWeekend(day)).length
        }

        const denominatorDays = calculationBasis === 'working_days' ? totalWorkingDays : totalDaysInMonth
        const perDaySalary = denominatorDays > 0 ? (grossSalary / denominatorDays) : 0

        // 3. Fetch Attendance
        const attendanceRecords = await prisma.hms_staff_attendance.findMany({
            where: {
                tenant_id: session.user.tenantId,
                user_id: userId,
                check_in: { gte: startDate, lte: endDate }
            }
        })

        // Simplify present days (ideally this cross-references shifts and weekends)
        const daysPresent = new Set(attendanceRecords.map(r => r.check_in.toISOString().split('T')[0])).size

        // 4. Fetch Leaves
        const leaveRecords = await prisma.hms_staff_leave.findMany({
            where: {
                tenant_id: session.user.tenantId,
                user_id: userId,
                status: 'approved',
                start_date: { lte: endDate },
                end_date: { gte: startDate }
            }
        })

        let approvedPaidLeaves = 0
        leaveRecords.forEach(leave => {
            // Calculate overlap with current month
            const leaveStart = leave.start_date < startDate ? startDate : leave.start_date
            const leaveEnd = leave.end_date > endDate ? endDate : leave.end_date
            approvedPaidLeaves += (differenceInDays(leaveEnd, leaveStart) + 1)
        })

        // Calculate LWP (Leave Without Pay)
        // If they were absent on a working day and didn't have approved leave, it's LWP.
        // Simplified heuristic: Total Required Days - Days Present - Approved Paid Leaves
        const totalRequiredDays = calculationBasis === 'working_days' ? totalWorkingDays : totalDaysInMonth
        
        // Ensure LWP doesn't go below 0 (e.g. if they worked on weekends)
        const presumedAbsences = Math.max(0, totalRequiredDays - daysPresent)
        const lwpDays = Math.max(0, presumedAbsences - approvedPaidLeaves)
        
        const lwpDeduction = lwpDays * perDaySalary

        // 5. Final Net Pay Calculation
        const totalDeductions = totalFixedDeduction + lwpDeduction
        const netPay = grossSalary - totalDeductions

        // Format data for JSON storage
        const attendanceData = {
            days_in_month: totalDaysInMonth,
            working_days_in_month: totalWorkingDays,
            calculation_basis: calculationBasis,
            days_present: daysPresent,
            approved_leaves: approvedPaidLeaves,
            lwp_days: lwpDays,
            lwp_deduction: Number(lwpDeduction.toFixed(2)),
            allowances_breakdown: allowances,
            deductions_breakdown: deductions,
            gross_salary: grossSalary,
            per_day_salary: Number(perDaySalary.toFixed(2))
        }

        // 6. Save Payslip
        const slip = await prisma.hms_payroll_slip.upsert({
            where: {
                user_id_month_year: {
                    user_id: userId,
                    month_year: monthYear
                }
            },
            update: {
                base_salary: new Prisma.Decimal(baseSalary),
                total_allowance: new Prisma.Decimal(totalAllowance),
                total_deduction: new Prisma.Decimal(totalDeductions),
                net_pay: new Prisma.Decimal(netPay),
                attendance_data: attendanceData as any
            },
            create: {
                tenant_id: session.user.tenantId,
                user_id: userId,
                month_year: monthYear,
                base_salary: new Prisma.Decimal(baseSalary),
                total_allowance: new Prisma.Decimal(totalAllowance),
                total_deduction: new Prisma.Decimal(totalDeductions),
                net_pay: new Prisma.Decimal(netPay),
                attendance_data: attendanceData as any,
                status: 'draft'
            }
        })

        revalidatePath('/hms/hr/payroll')
        return { success: true, slip }

    } catch (error: any) {
        console.error("Failed to calculate payroll:", error)
        return { error: error.message }
    }
}

export async function generateBulkPayroll(monthYear: string, calculationBasis: 'total_days' | 'working_days' = 'total_days') {
    const session = await auth()
    if (!session?.user?.id || !session.user.tenantId) return { error: "Unauthorized" }

    try {
        // Fetch all active employees who have a salary structure
        const employees = await prisma.hms_staff_salary.findMany({
            where: { tenant_id: session.user.tenantId }
        })

        let successCount = 0
        let errorCount = 0

        for (const emp of employees) {
            const res = await calculateMonthlyPayroll(emp.user_id, monthYear, calculationBasis)
            if (res.success) successCount++
            else errorCount++
        }

        return { success: true, message: `Generated ${successCount} payslips. Failed: ${errorCount}` }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function approvePayrollSlip(slipId: string) {
    const session = await auth()
    if (!session?.user?.isAdmin) return { error: "Unauthorized" }

    try {
        await prisma.hms_payroll_slip.update({
            where: { id: slipId },
            data: { status: 'paid' }
        })
        revalidatePath('/hms/hr/payroll')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function setStaffSalary(userId: string, data: { baseSalary: number, allowances: any, deductions: any }) {
    const session = await auth()
    if (!session?.user?.tenantId || !session.user.isAdmin) return { error: "Unauthorized" }

    try {
        await prisma.hms_staff_salary.upsert({
            where: { user_id: userId },
            update: {
                base_salary: new Prisma.Decimal(data.baseSalary),
                allowances: data.allowances,
                deductions: data.deductions
            },
            create: {
                tenant_id: session.user.tenantId,
                user_id: userId,
                base_salary: new Prisma.Decimal(data.baseSalary),
                allowances: data.allowances,
                deductions: data.deductions
            }
        })
        revalidatePath('/hms/hr/payroll/structure')
        return { success: true }
    } catch (error: any) {
        console.error("Failed to update salary:", error)
        return { error: error.message }
    }
}

export async function getPayrollSlips(monthYear?: string) {
    const session = await auth()
    if (!session?.user?.tenantId) return []

    try {
        const slips = await prisma.hms_payroll_slip.findMany({
            where: {
                tenant_id: session.user.tenantId,
                ...(monthYear ? { month_year: monthYear } : {})
            },
            orderBy: { created_at: 'desc' }
        })
        return slips
    } catch (error) {
        console.error("Failed to fetch payroll slips:", error)
        return []
    }
}
