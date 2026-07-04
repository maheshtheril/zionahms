"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { generateBulkPayroll, approvePayrollSlip } from "@/app/actions/payroll"
import { Loader2, FileText, CheckCircle2, Play, Settings2 } from "lucide-react"

export function PayrollDashboardClient({ initialMonth, availableMonths, staffData }: any) {
    const router = useRouter()
    const [month, setMonth] = useState(initialMonth)
    const [basis, setBasis] = useState<'total_days' | 'working_days'>('total_days')
    const [isGenerating, setIsGenerating] = useState(false)
    const [approvingId, setApprovingId] = useState<string | null>(null)

    const handleGenerate = async () => {
        setIsGenerating(true)
        try {
            const res = await generateBulkPayroll(month, basis)
            if (res.success) {
                alert(res.message)
                router.refresh()
            } else {
                alert("Error: " + res.error)
            }
        } catch (e: any) {
            alert(e.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleApprove = async (slipId: string) => {
        setApprovingId(slipId)
        try {
            const res = await approvePayrollSlip(slipId)
            if (res.success) {
                router.refresh()
            } else {
                alert("Error: " + res.error)
            }
        } catch (e: any) {
            alert(e.message)
        } finally {
            setApprovingId(null)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Payroll Engine</h1>
                        <p className="text-slate-500 mt-1">Automated salary computation for {month}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Billing Period</label>
                            <select 
                                className="block w-full bg-slate-100 dark:bg-zinc-800 border-transparent rounded-lg px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                value={month}
                                onChange={(e) => {
                                    setMonth(e.target.value)
                                    router.push(`/hms/hr/payroll?month=${e.target.value}`)
                                }}
                            >
                                {availableMonths.map((m: string) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Calculation Basis</label>
                            <select 
                                className="block w-full bg-slate-100 dark:bg-zinc-800 border-transparent rounded-lg px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                value={basis}
                                onChange={(e: any) => setBasis(e.target.value)}
                            >
                                <option value="total_days">Total Days in Month</option>
                                <option value="working_days">Total Working Days</option>
                            </select>
                        </div>

                        <div className="pt-5 flex gap-2">
                            <Button 
                                variant="outline"
                                onClick={() => router.push('/hms/hr/payroll/structure')}
                                className="h-10 px-4 rounded-xl shadow-sm border-slate-200 dark:border-zinc-700 font-semibold"
                            >
                                <Settings2 className="h-4 w-4 mr-2 text-slate-500" />
                                Manage Structures
                            </Button>
                            
                            <Button 
                                onClick={handleGenerate} 
                                disabled={isGenerating}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none"
                            >
                                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                                Run Payroll Engine
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Pay</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance/LWP</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Net Pay</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                {staffData.map((staff: any) => (
                                    <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-900 dark:text-white">{staff.name}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">Base: ₹{staff.base_salary.toLocaleString('en-IN')}</div>
                                        </td>
                                        
                                        {!staff.slip ? (
                                            <td colSpan={5} className="p-4 text-center text-slate-400 text-sm italic">
                                                Payroll not generated for {month}
                                            </td>
                                        ) : (
                                            <>
                                                <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                                                    ₹{staff.slip.attendance_data?.gross_salary?.toLocaleString('en-IN') || staff.slip.base_salary.toLocaleString('en-IN')}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {staff.slip.attendance_data?.days_present || 0} / {staff.slip.attendance_data?.calculation_basis === 'working_days' ? staff.slip.attendance_data.working_days_in_month : staff.slip.attendance_data?.days_in_month || 30} Days
                                                    </div>
                                                    <div className="text-xs text-red-500 font-semibold mt-0.5">
                                                        -{staff.slip.attendance_data?.lwp_days || 0} LWP (₹{staff.slip.attendance_data?.lwp_deduction?.toLocaleString('en-IN') || 0})
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                                        ₹{staff.slip.net_pay.toLocaleString('en-IN')}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {staff.slip.status === 'paid' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                                            <FileText className="w-3.5 h-3.5" /> Draft
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => window.open(`/hms/hr/payroll/payslip?id=${staff.slip.id}`, '_blank')}
                                                        >
                                                            View PDF
                                                        </Button>
                                                        {staff.slip.status !== 'paid' && (
                                                            <Button 
                                                                size="sm" 
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                disabled={approvingId === staff.slip.id}
                                                                onClick={() => handleApprove(staff.slip.id)}
                                                            >
                                                                {approvingId === staff.slip.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {staffData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-500">
                                            No employees found with a configured salary structure.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    )
}
