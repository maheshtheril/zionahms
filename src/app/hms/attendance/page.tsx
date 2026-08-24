import { auth } from "@/auth"
import { getAttendanceHistory } from "@/app/actions/attendance"
import PunchWidget from "@/components/attendance/punch-widget"
import { format } from "date-fns"
import { ensureHmsMenus } from "@/lib/menu-seeder"
import { DownloadGuidePDF } from "@/components/attendance/guide-download"
import { BroadcastAlert } from "@/components/attendance/broadcast-alert"
import { FaceCheckinModal } from "@/components/hms/staff/face-checkin-modal"

import {
    Calendar,
    ChevronRight,
    Clock,
    ArrowRightCircle,
    ArrowLeftCircle,
    UserCircle,
    History
} from "lucide-react"

export default async function AttendancePage() {
    await ensureHmsMenus();
    const session = await auth()
    const history = await getAttendanceHistory(20)

    return (
        <div className="min-h-screen bg-background p-8">
            {/* Header Area */}
            <div className="flex justify-between items-end mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                            <Clock className="h-5 w-5 text-indigo-500" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Personnel Operations</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Staff Attendance</h1>
                    <p className="text-muted-foreground mt-2 text-sm">Real-time shift management and tactical roster synchronization.</p>
                <div className="flex items-center gap-4">

                    <FaceCheckinModal />
                    <DownloadGuidePDF />
                    <div className="hidden md:flex items-center gap-4 bg-muted/50 border border-border rounded-2xl p-4 backdrop-blur-xl">

                        <UserCircle className="h-10 w-10 text-muted-foreground" />
                        <div>
                            <p className="text-foreground font-bold text-sm leading-tight">{session?.user?.name || 'Authorized Staff'}</p>
                            <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest">{session?.user?.id?.slice(0, 8)} • SECURE</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: The Futuristic Punch Widget */}
                <div className="xl:col-span-4">
                    <PunchWidget />

                    {/* Dynamic Insight Card */}
                    <div className="mt-8 p-6 glass-card bg-indigo-500/5 border border-indigo-500/20 rounded-[2rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Calendar className="h-20 w-20 text-indigo-500" />
                        </div>
                        <h3 className="text-indigo-600 dark:text-indigo-300 font-bold mb-2 flex items-center gap-2">
                            System Insight
                        </h3>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                            A shift duration of 8.5 hours is recommended for optimal productivity. Auto-checkout will trigger after 14 hours of continuous duty.
                        </p>
                    </div>
                </div>

                {/* Right Column: Historical Logs */}
                <div className="xl:col-span-8">
                    <div className="glass-card bg-card border border-border rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-sm">
                        <div className="p-8 border-b border-border flex justify-between items-center bg-muted/20">
                            <h2 className="text-foreground font-black tracking-tight flex items-center gap-3">
                                <History className="h-5 w-5 text-indigo-500" />
                                Operational History
                            </h2>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">Last 20 Sessions</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left bg-muted/30">
                                        <th className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Entry Signal</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Exit Signal</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Duration</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Terminal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground font-medium italic">
                                                No mission data found in central archive.
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map((entry: any) => (
                                            <tr key={entry.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                                        <span className="text-foreground font-bold text-sm tracking-tight">{format(new Date(entry.check_in), 'MMM dd, yyyy')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                                                        <ArrowRightCircle className="h-3 w-3" />
                                                        {format(new Date(entry.check_in), 'HH:mm')}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {entry.check_out ? (
                                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-mono text-xs">
                                                            <ArrowLeftCircle className="h-3 w-3" />
                                                            {format(new Date(entry.check_out), 'HH:mm')}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">IN PROGRESS</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-muted-foreground font-mono text-xs">
                                                        {entry.check_out ? "8h 12m" : "Active"}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-[10px] text-muted-foreground font-bold font-mono">
                                                        {(entry.location_in as any)?.city || 'HUB-HQ'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <BroadcastAlert />
        </div>
    )
}
