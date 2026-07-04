import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { format } from "date-fns"
import { Printer } from "lucide-react"

export default async function PayslipPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const params = await searchParams
    if (!params.id) notFound()

    const slip = await prisma.hms_payroll_slip.findUnique({
        where: { id: params.id }
    })

    if (!slip || slip.tenant_id !== session.user.tenantId) notFound()

    // Users can only view their own slips, unless admin
    if (!session.user.isAdmin && slip.user_id !== session.user.id) {
        return <div>Unauthorized</div>
    }

    const user = await prisma.app_user.findUnique({
        where: { id: slip.user_id }
    })

    const tenant = await prisma.tenant.findUnique({
        where: { id: slip.tenant_id }
    })

    const attData = slip.attendance_data as any || {}
    const allowances = attData.allowances_breakdown || {}
    const deductions = attData.deductions_breakdown || {}

    return (
        <div className="min-h-screen bg-slate-200 dark:bg-zinc-950 p-8 flex justify-center font-sans">
            
            <div className="w-[800px] max-w-full">
                {/* Print Action Bar */}
                <div className="mb-4 flex justify-end print:hidden">
                    <button 
                        onClick="window.print()" 
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-indigo-700 transition"
                    >
                        <Printer className="w-4 h-4" /> Print Payslip
                    </button>
                    {/* We use a tiny script for the print button since this is a server component */}
                    <script dangerouslySetInnerHTML={{__html: `
                        document.querySelector('button').addEventListener('click', () => window.print())
                    `}} />
                </div>

                {/* The Paper Sheet */}
                <div className="bg-white p-10 shadow-2xl rounded-sm print:shadow-none print:p-0 print:m-0 text-slate-900">
                    
                    {/* Header Section */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900">{tenant?.name || 'Company Name'}</h1>
                            <p className="text-slate-500 mt-1 text-sm font-medium uppercase tracking-widest">Payslip for {format(new Date(slip.month_year + '-01'), 'MMMM yyyy')}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-slate-300 uppercase tracking-widest">Confidential</div>
                            <div className="text-sm font-bold text-slate-500 mt-1 uppercase">Doc ID: {slip.id.split('-')[0]}</div>
                        </div>
                    </div>

                    {/* Employee Info Grid */}
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8">
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold text-slate-500">Employee Name</span>
                            <span className="font-bold text-slate-900">{user?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold text-slate-500">Employee ID</span>
                            <span className="font-bold text-slate-900">{user?.id.split('-')[0].toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold text-slate-500">Designation</span>
                            <span className="font-bold text-slate-900">Staff</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="font-semibold text-slate-500">Pay Period</span>
                            <span className="font-bold text-slate-900">{format(new Date(slip.month_year + '-01'), 'MMM yyyy')}</span>
                        </div>
                    </div>

                    {/* Attendance Summary */}
                    <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-8 flex justify-around">
                        <div className="text-center">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required Days</div>
                            <div className="text-xl font-black text-slate-900 mt-1">{attData.calculation_basis === 'working_days' ? attData.working_days_in_month : attData.days_in_month}</div>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div className="text-center">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Present</div>
                            <div className="text-xl font-black text-emerald-600 mt-1">{attData.days_present || 0}</div>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div className="text-center">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid Leave</div>
                            <div className="text-xl font-black text-blue-600 mt-1">{attData.approved_leaves || 0}</div>
                        </div>
                        <div className="w-px bg-slate-200"></div>
                        <div className="text-center">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">LWP (Unpaid)</div>
                            <div className="text-xl font-black text-red-600 mt-1">{attData.lwp_days || 0}</div>
                        </div>
                    </div>

                    {/* Salary Structure Columns */}
                    <div className="grid grid-cols-2 border border-slate-900 mb-8 rounded-sm overflow-hidden">
                        
                        {/* Earnings Column */}
                        <div className="border-r border-slate-900">
                            <div className="bg-slate-100 p-3 font-bold text-slate-900 border-b border-slate-900 text-center uppercase tracking-wider text-sm">
                                Earnings
                            </div>
                            <div className="p-4 space-y-3 min-h-[200px]">
                                <div className="flex justify-between">
                                    <span className="font-medium text-slate-700">Basic Salary</span>
                                    <span className="font-bold">{"$"}{Number(slip.base_salary).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                                </div>
                                {Object.entries(allowances).map(([name, amount]) => (
                                    <div key={name} className="flex justify-between">
                                        <span className="font-medium text-slate-700">{name}</span>
                                        <span className="font-bold">{"$"}{Number(amount).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-slate-50 p-3 font-black flex justify-between border-t border-slate-900 text-lg">
                                <span>Gross Earnings</span>
                                <span>{"$"}{Number(attData.gross_salary || slip.base_salary).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                            </div>
                        </div>

                        {/* Deductions Column */}
                        <div>
                            <div className="bg-slate-100 p-3 font-bold text-slate-900 border-b border-slate-900 text-center uppercase tracking-wider text-sm">
                                Deductions
                            </div>
                            <div className="p-4 space-y-3 min-h-[200px]">
                                {Object.entries(deductions).map(([name, amount]) => (
                                    <div key={name} className="flex justify-between">
                                        <span className="font-medium text-slate-700">{name}</span>
                                        <span className="font-bold text-red-600">{"$"}{Number(amount).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                                    </div>
                                ))}
                                {attData.lwp_deduction > 0 && (
                                    <div className="flex justify-between">
                                        <span className="font-medium text-slate-700">LWP Deduction ({attData.lwp_days} days)</span>
                                        <span className="font-bold text-red-600">{"$"}{Number(attData.lwp_deduction).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                                    </div>
                                )}
                            </div>
                            <div className="bg-slate-50 p-3 font-black flex justify-between border-t border-slate-900 text-lg">
                                <span>Total Deductions</span>
                                <span className="text-red-600">{"$"}{Number(slip.total_deduction).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                            </div>
                        </div>
                    </div>

                    {/* Net Pay Banner */}
                    <div className="bg-slate-900 text-white rounded-sm p-6 flex justify-between items-center mb-12">
                        <div>
                            <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Net Pay</div>
                            {/* Wait, adding to words is complex, just show amount */}
                            <div className="text-xs font-medium text-slate-300 mt-1 italic">Transfer to bank account</div>
                        </div>
                        <div className="text-4xl font-black tracking-tight">
                            ${"$"}{Number(slip.net_pay).toLocaleString('en-IN', {minimumFractionDigits:2})}
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="flex justify-between items-end pt-12 border-t border-slate-200">
                        <div className="text-center">
                            <div className="w-48 border-b-2 border-slate-900 mb-2"></div>
                            <div className="font-bold text-sm text-slate-600 uppercase">Employer Signature</div>
                        </div>
                        <div className="text-center">
                            <div className="w-48 border-b-2 border-slate-900 mb-2"></div>
                            <div className="font-bold text-sm text-slate-600 uppercase">Employee Signature</div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-slate-400 mt-12 font-medium uppercase tracking-widest">
                        This is a computer generated document. No physical signature is required.
                    </div>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body { background: white !important; }
                }
            `}} />
        </div>
    )
}
