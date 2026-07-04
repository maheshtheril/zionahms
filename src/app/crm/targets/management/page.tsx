
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getManagementOverview, syncAllTeamTargets } from "@/app/actions/crm/targets"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    Users, AlertTriangle, TrendingUp, Target,
    RefreshCw, ArrowRight, ShieldAlert, Zap,
    Activity, BarChart3, ChevronRight
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function ManagementDashboard() {
    const session = await auth()
    if (!session?.user) redirect('/auth/login')

    // Access Check
    const userRole = await prisma.app_user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });
    const role = userRole?.role || '';
    const isManager = session.user.isAdmin || role.toLowerCase().includes('admin') || role.toLowerCase().includes('manager');

    if (!isManager) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Access Denied</h2>
                    <p className="text-slate-500">Only command leadership can access the strategic overview.</p>
                </div>
            </div>
        )
    }

    const data = await getManagementOverview()
    if (!data) return null

    const { targets, stats } = data

    return (
        <div className="min-h-screen bg-futuristic py-12 px-6">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header with Global Sync */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/30">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Team Intelligence</h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] ml-1">Command-Level Performance Audit</p>
                    </div>

                    <form action={syncAllTeamTargets}>
                        <Button className="h-14 px-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-50 transition-all group shadow-xl shadow-indigo-500/5">
                            <RefreshCw className="w-4 h-4 mr-3 text-indigo-600 group-hover:rotate-180 transition-transform duration-700" />
                            <span className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-[10px]">Synchronize Team Data</span>
                        </Button>
                    </form>
                </div>

                {/* KPI Metrics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass p-8 rounded-[2.5rem] border border-white/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Users className="w-16 h-16 text-indigo-500" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Total Workforce</p>
                        <h3 className="text-5xl font-black text-slate-900 dark:text-white tabular-nums">{stats.totalAgents}</h3>
                        <p className="text-[10px] text-indigo-600 font-bold mt-2 uppercase">Active Performance Vectors</p>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] border border-white/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <AlertTriangle className={`w-16 h-16 ${stats.atRiskCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Risk Exposure</p>
                        <h3 className={`text-5xl font-black tabular-nums ${stats.atRiskCount > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                            {stats.atRiskCount}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase">Critical Gate Failures</p>
                    </div>

                    <div className="md:col-span-2 glass p-8 rounded-[2.5rem] border border-white/20 relative overflow-hidden bg-gradient-to-br from-indigo-500/5 to-transparent">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2">Revenue Synthesis</p>
                                <h3 className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                                    ${"$"}{stats.totalRevenueAchieved.toLocaleString()}
                                    <span className="text-lg text-slate-400 ml-2 font-bold font-sans tracking-tight">/ ${"$"}{stats.totalRevenueGoal.toLocaleString()}</span>
                                </h3>
                            </div>
                            <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                <TrendingUp className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                        <Progress value={(stats.totalRevenueAchieved / stats.totalRevenueGoal) * 100} className="h-4 bg-slate-100 dark:bg-slate-800" />
                        <div className="mt-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Global Yield: {((stats.totalRevenueAchieved / (stats.totalRevenueGoal || 1)) * 100).toFixed(1)}%</span>
                            <span className="text-indigo-600">Strategic Target Alignment</span>
                        </div>
                    </div>
                </div>

                {/* Team Roster Grid */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                            <Target className="w-5 h-5 text-indigo-500" />
                            Agent Performance Grid
                        </h3>
                        <Link href="/crm/targets/new">
                            <Button variant="link" className="text-indigo-600 font-bold text-xs uppercase tracking-widest">
                                Expand Infrastructure <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {targets.map((t: any) => {
                            const isAtRisk = t.milestones?.some((m: any) => m.status === 'failed' && m.is_blocking);
                            const progress = (Number(t.achieved_value) / Number(t.target_value)) * 100;

                            return (
                                <div key={t.id} className={`group glass rounded-[2rem] p-6 border ${isAtRisk ? 'border-rose-500/30 bg-rose-500/5' : 'border-white/20'} transition-all hover:scale-[1.01] hover:shadow-2xl`}>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                                        {/* Agent Identity */}
                                        <div className="md:col-span-3">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${isAtRisk ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}>
                                                    {t.assignee_name?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-900 dark:text-white truncate uppercase tracking-tight">{t.assignee_name}</h4>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {t.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Target Logic */}
                                        <div className="md:col-span-2">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Objective Vector</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {t.target_type === 'revenue' ? <BarChart3 className="w-4 h-4 text-indigo-500" /> : <Activity className="w-4 h-4 text-purple-500" />}
                                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">{t.target_type}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Command */}
                                        <div className="md:col-span-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                    <span>Sync Threshold</span>
                                                    <span className={isAtRisk ? 'text-rose-500' : 'text-indigo-600'}>{progress.toFixed(0)}%</span>
                                                </div>
                                                <Progress value={progress} className={`h-2 ${isAtRisk ? 'bg-rose-100' : 'bg-slate-100'}`} />
                                            </div>
                                        </div>

                                        {/* Compliance Status */}
                                        <div className="md:col-span-2">
                                            {isAtRisk ? (
                                                <Badge variant="destructive" className="w-full justify-center h-10 rounded-xl bg-rose-500 text-white border-none font-black uppercase text-[9px] tracking-widest pulse">
                                                    Compliance Failure
                                                </Badge>
                                            ) : (
                                                <Badge className="w-full justify-center h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 border-none font-black uppercase text-[9px] tracking-widest">
                                                    Operational
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Action */}
                                        <div className="md:col-span-1 flex justify-end">
                                            <Link href={`/crm/targets/${t.id}/edit`}>
                                                <Button size="icon" variant="ghost" className="rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800">
                                                    <ArrowRight className="w-5 h-5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
