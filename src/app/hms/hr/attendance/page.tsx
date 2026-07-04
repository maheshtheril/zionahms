import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ensureHmsMenus } from "@/lib/menu-seeder"
import { format, differenceInMinutes } from "date-fns"
import { History, MapPin, AlertCircle, CheckCircle2 } from "lucide-react"

export default async function HRAttendancePage() {
    await ensureHmsMenus()
    const session = await auth()
    if (!session?.user?.isAdmin) return <div>Unauthorized</div>

    const attendanceLogs = await prisma.hms_staff_attendance.findMany({
        where: { tenant_id: session.user.tenantId },
        orderBy: { check_in: 'desc' },
        take: 100 // Limit to recent 100 for now
    })

    const userIds = [...new Set(attendanceLogs.map(l => l.user_id))]
    const staff = await prisma.hms_staff.findMany({
        where: { id: { in: userIds } }
    })
    const staffMap = staff.reduce((acc, s) => ({ ...acc, [s.id]: s }), {} as Record<string, any>)

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-foreground tracking-tight">Attendance Logs</h1>
                <p className="text-muted-foreground mt-2 text-sm">Monitor staff punch records and anomalies across the facility.</p>
            </div>

            <div className="glass-card border border-border rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
                    <h2 className="font-bold flex items-center gap-2"><History className="w-5 h-5 text-indigo-500" /> Recent Punch Logs</h2>
                    <span className="text-xs bg-muted px-3 py-1 rounded-full uppercase tracking-widest text-muted-foreground font-bold">Last 100 Records</span>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/30 border-b border-border">
                        <tr>
                            <th className="p-4 font-bold text-muted-foreground text-sm">Staff Member</th>
                            <th className="p-4 font-bold text-muted-foreground text-sm">Date</th>
                            <th className="p-4 font-bold text-muted-foreground text-sm">Check In</th>
                            <th className="p-4 font-bold text-muted-foreground text-sm">Check Out</th>
                            <th className="p-4 font-bold text-muted-foreground text-sm">Duration</th>
                            <th className="p-4 font-bold text-muted-foreground text-sm">Status / Flags</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {attendanceLogs.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No records found.</td></tr>
                        ) : attendanceLogs.map((log: any) => {
                            const user = staffMap[log.user_id]
                            const checkInTime = new Date(log.check_in)
                            const checkOutTime = log.check_out ? new Date(log.check_out) : null
                            
                            let durationStr = '-'
                            if (checkOutTime) {
                                const diffMins = differenceInMinutes(checkOutTime, checkInTime)
                                const hrs = Math.floor(diffMins / 60)
                                const mins = diffMins % 60
                                durationStr = `${hrs}h ${mins}m`
                            }

                            // Basic Anomaly detection
                            const isMissingCheckout = !checkOutTime && differenceInMinutes(new Date(), checkInTime) > 14 * 60; // 14 hours

                            return (
                                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="p-4">
                                        <div className="font-semibold">{user?.name || 'Unknown User'}</div>
                                        <div className="text-[10px] text-muted-foreground tracking-widest">{user?.role || 'Staff'}</div>
                                    </td>
                                    <td className="p-4 font-medium">{format(checkInTime, "MMM d, yyyy")}</td>
                                    <td className="p-4 text-emerald-600 font-medium">
                                        <div className="flex items-center gap-2">
                                            {format(checkInTime, "HH:mm")}
                                            {log.location_in && <MapPin className="w-3 h-3 text-muted-foreground" title="Location Tracked" />}
                                        </div>
                                    </td>
                                    <td className="p-4 text-orange-600 font-medium">
                                        {checkOutTime ? format(checkOutTime, "HH:mm") : <span className="text-muted-foreground text-xs italic">Active</span>}
                                    </td>
                                    <td className="p-4 font-mono text-sm">{durationStr}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full w-max flex items-center gap-1 ${log.status === 'late' ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                                {log.status === 'late' ? <AlertCircle className="w-3 h-3"/> : <CheckCircle2 className="w-3 h-3"/>}
                                                {log.status}
                                            </span>
                                            {isMissingCheckout && (
                                                <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Missing Checkout
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
