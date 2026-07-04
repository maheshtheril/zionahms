import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ensureHmsMenus } from "@/lib/menu-seeder"
import { format } from "date-fns"
import { Calendar, CheckCircle2, XCircle, Clock } from "lucide-react"
import { LeaveActionButtons } from "./leave-actions" // Client component for approve/reject

export default async function LeaveManagementPage() {
    await ensureHmsMenus()
    const session = await auth()
    if (!session?.user?.isAdmin) return <div>Unauthorized</div>

    const leaves = await prisma.hms_staff_leave.findMany({
        where: { tenant_id: session.user.tenantId },
        orderBy: { created_at: 'desc' }
    })

    // Manual population of staff names since no relation exists in schema yet
    const userIds = [...new Set(leaves.map(l => l.user_id))]
    const staff = await prisma.hms_staff.findMany({
        where: { id: { in: userIds } }
    })
    const staffMap = staff.reduce((acc, s) => ({ ...acc, [s.id]: s.name }), {} as any)

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-foreground tracking-tight">Leave Requests</h1>
                <p className="text-muted-foreground mt-2 text-sm">Approve or reject staff time-off requests.</p>
            </div>

            <div className="glass-card border border-border rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="p-4 font-bold text-muted-foreground text-sm">Staff Member</th>
                            <th className="p-4 font-bold text-muted-foreground text-sm">Leave Type</th>
                            <th className="p-4 font-bold text-muted-foreground text-sm">Date Range</th>
                            <th className="p-4 font-bold text-muted-foreground text-sm">Status</th>
                            <th className="p-4 font-bold text-muted-foreground text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {leaves.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No leave requests found.</td></tr>
                        ) : leaves.map(leave => (
                            <tr key={leave.id} className="hover:bg-muted/20 transition-colors">
                                <td className="p-4 font-semibold">{staffMap[leave.user_id] || 'Unknown User'}</td>
                                <td className="p-4 capitalize">{leave.leave_type}</td>
                                <td className="p-4">
                                    {format(new Date(leave.start_date), "MMM d, yyyy")} - {format(new Date(leave.end_date), "MMM d, yyyy")}
                                </td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 w-max
                                        ${leave.status === 'pending' ? 'bg-orange-500/10 text-orange-600' : ''}
                                        ${leave.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : ''}
                                        ${leave.status === 'rejected' ? 'bg-red-500/10 text-red-600' : ''}
                                    `}>
                                        {leave.status === 'pending' && <Clock className="w-3 h-3"/>}
                                        {leave.status === 'approved' && <CheckCircle2 className="w-3 h-3"/>}
                                        {leave.status === 'rejected' && <XCircle className="w-3 h-3"/>}
                                        {leave.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    {leave.status === 'pending' && (
                                        <LeaveActionButtons leaveId={leave.id} />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
