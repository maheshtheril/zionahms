import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ensureHmsMenus } from "@/lib/menu-seeder"
import { Users, Clock, CalendarX, TrendingUp, Briefcase } from "lucide-react"

export default async function HRDashboardPage() {
    await ensureHmsMenus();
    const session = await auth()
    if (!session?.user?.tenantId) return <div>Unauthorized</div>

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch Analytics
    const totalStaff = await prisma.hms_staff.count({
        where: { tenant_id: session.user.tenantId }
    })

    const presentToday = await prisma.hms_staff_attendance.count({
        where: {
            tenant_id: session.user.tenantId,
            check_in: { gte: today }
        }
    })

    const onLeave = await prisma.hms_staff_leave.count({
        where: {
            tenant_id: session.user.tenantId,
            status: 'approved',
            start_date: { lte: today },
            end_date: { gte: today }
        }
    })

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                        <Briefcase className="h-5 w-5 text-indigo-500" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">HR Command Center</span>
                </div>
                <h1 className="text-4xl font-black text-foreground tracking-tight">Personnel Overview</h1>
                <p className="text-muted-foreground mt-2 text-sm">Real-time workforce intelligence and attendance metrics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Staff */}
                <div className="glass-card bg-card border border-border rounded-3xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users className="h-16 w-16 text-indigo-500" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground mb-4">Total Workforce</p>
                    <h2 className="text-5xl font-black text-foreground">{totalStaff}</h2>
                </div>

                {/* Present Today */}
                <div className="glass-card bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="h-16 w-16 text-emerald-500" />
                    </div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-4">Present Today</p>
                    <h2 className="text-5xl font-black text-foreground">{presentToday}</h2>
                    <p className="text-xs font-medium text-emerald-600/70 mt-2">{Math.round((presentToday / (totalStaff || 1)) * 100)}% attendance rate</p>
                </div>

                {/* On Leave */}
                <div className="glass-card bg-orange-500/5 border border-orange-500/20 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CalendarX className="h-16 w-16 text-orange-500" />
                    </div>
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400 mb-4">On Leave</p>
                    <h2 className="text-5xl font-black text-foreground">{onLeave}</h2>
                </div>

                {/* Late Arrivals */}
                <div className="glass-card bg-red-500/5 border border-red-500/20 rounded-3xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock className="h-16 w-16 text-red-500" />
                    </div>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-4">Late Arrivals</p>
                    <h2 className="text-5xl font-black text-foreground">0</h2>
                    <p className="text-xs font-medium text-red-600/70 mt-2">Requires roster sync to calculate</p>
                </div>
            </div>
            
            <div className="mt-12">
               <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
               <div className="glass-card p-8 rounded-3xl border border-border text-center text-muted-foreground">
                   Connect to real-time event stream for live updates...
               </div>
            </div>
        </div>
    )
}
