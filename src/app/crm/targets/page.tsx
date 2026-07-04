
import Link from 'next/link'
import { getMyTargets } from '@/app/actions/crm/targets'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
    Plus,
    Target,
    TrendingUp,
    Zap,
    Trophy,
    BarChart3,
    Rocket,
    ArrowUpRight,
    Star,
    Crown,
    Pencil
} from 'lucide-react'
import { Metadata } from 'next'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { useLocalization } from "@/contexts/localization-context";

export const metadata: Metadata = {
    title: 'Targets Intelligence | SAAS ERP',
    description: 'Track your performance goals with high-fidelity analytics',
}

export const dynamic = 'force-dynamic'


export default async function TargetsPage() {
    const { currencySymbol } = useLocalization();
    const session = await auth()
    if (!session?.user?.id) redirect('/auth/login');

    const userId = session.user.id;

    // AUTO-SYNC PERFORMANCE DATA on load (Full Fledged)
    const { updateTargetProgress } = await import('@/app/actions/crm/target-compliance');
    // @ts-ignore
    await updateTargetProgress(userId);

    const targets = await getMyTargets() as any[]

    // Permission Check
    const userRole = await prisma.app_user.findUnique({ where: { id: userId }, select: { role: true } })
    const role = userRole?.role || ''
    const isManager = session.user.isAdmin || role.toLowerCase().includes('admin') || role.toLowerCase().includes('manager')

    // ... stats ...
    const totalAchieved = targets.reduce((sum, t) => sum + Number(t.achieved_value || 0), 0)
    const totalGoal = targets.reduce((sum, t) => sum + Number(t.target_value || 0), 0)
    const overallProgress = totalGoal > 0 ? Math.min((totalAchieved / totalGoal) * 100, 100) : 0
    const totalIncentive = targets.reduce((sum, t) => sum + Number(t.incentive_amount || 0), 0)

    return (
        <div className="min-h-screen bg-futuristic pb-24">
            {/* Animated Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
            </div>

            <div className="relative container mx-auto py-8 space-y-8 max-w-7xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-indigo-600 shadow-2xl shadow-indigo-500/40">
                                <Rocket className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Objective Grid</h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] ml-1">Performance Intelligence Module</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {isManager && (
                            <Link href="/crm/targets/management">
                                <Button variant="outline" className="h-14 px-6 rounded-2xl border-indigo-500/30 font-black uppercase tracking-widest text-[10px] hover:bg-indigo-50">
                                    <Target className="w-5 h-5 mr-3 text-indigo-600" />
                                    Strategic Dashboard
                                </Button>
                            </Link>
                        )}
                        {isManager && (
                            <Link href="/crm/targets/new">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 border-none px-6 h-14 rounded-2xl group transition-all">
                                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                                    <span className="font-bold uppercase tracking-widest text-[10px]">Initialize Target</span>
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Intelligence Overview Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                    {/* Overall Progress Card */}
                    <div className="glass shadow-2xl rounded-3xl p-6 border border-white/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Zap className="w-24 h-24 text-indigo-500" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4">Meta Progression</h4>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-4xl font-black text-slate-900 dark:text-white">{overallProgress.toFixed(1)}%</span>
                            <Badge className="bg-indigo-500/10 text-indigo-600 border-none font-bold text-[10px] py-1">Operational</Badge>
                        </div>
                        <Progress value={overallProgress} className="h-3 bg-slate-100 dark:bg-slate-800" />
                        <p className="text-[10px] text-slate-500 mt-4 font-medium italic">Tracking {overallProgress > 75 ? 'above' : 'within'} nominal performance parameters.</p>
                    </div>

                    {/* Reward Pool Card */}
                    <div className="glass shadow-2xl rounded-3xl p-6 border border-white/20 relative overflow-hidden group bg-gradient-to-br from-emerald-500/5 to-transparent">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Trophy className="w-24 h-24 text-emerald-500" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-4">Incentive Reservoir</h4>
                        <div className="flex items-center gap-2 mb-1">
                            <Crown className="w-6 h-6 text-emerald-500" />
                            <span className="text-4xl font-black text-slate-900 dark:text-white">{currencySymbol}{totalIncentive.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 font-medium">Projected conversion bonus for active targets.</p>
                        <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
                            <TrendingUp className="w-3 h-3" />
                            High Yield Potential
                        </div>
                    </div>

                    {/* Active Assets Card */}
                    <div className="glass shadow-2xl rounded-3xl p-6 border border-white/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BarChart3 className="w-24 h-24 text-purple-500" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500 mb-4">Strategic Assets</h4>
                        <div className="flex items-end justify-between">
                            <div>
                                <span className="text-4xl font-black text-slate-900 dark:text-white">{targets.length}</span>
                                <span className="text-sm font-bold text-slate-500 ml-2">Active Goals</span>
                            </div>
                            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600">
                                <Target className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-5 font-medium">Distributed across {new Set(targets.map(t => t.target_type)).size} categorization vectors.</p>
                    </div>
                </div>

                {/* Targets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4 pb-12">
                    {targets.map((target) => {
                        const { currencySymbol } = useLocalization();
                        const achieved = Number(target.achieved_value || 0)
                        const goal = Number(target.target_value)
                        const percent = Math.min((achieved / goal) * 100, 100)
                        const isRevenue = target.target_type === 'revenue'
                        const isCloseToDate = new Date(target.period_end).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000

                        return (
                            <div key={target.id} className="glass group hover:scale-[1.02] transition-all duration-500 rounded-[2.5rem] p-8 border border-white/20 shadow-xl relative overflow-hidden">
                                {percent >= 100 && (
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                                )}

                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-2xl ${isRevenue ? 'bg-indigo-500/20 text-indigo-600' : 'bg-purple-500/20 text-purple-600'}`}>
                                        {isRevenue ? <TrendingUp className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {isManager && (
                                            <Link href={`/crm/targets/${target.id}/edit`}>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-500">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        )}
                                        <Badge variant="outline" className="border-slate-200/50 dark:border-white/10 text-[9px] font-black uppercase tracking-tighter">
                                            {target.period_type}
                                        </Badge>
                                        {isCloseToDate && (
                                            <Badge variant="destructive" className="animate-pulse bg-rose-500 text-white text-[8px] font-black border-none uppercase">
                                                Expiring Soon
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">
                                        {isRevenue ? 'Capital Yield' : 'Operation Speed'}
                                    </h3>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                            {isRevenue ? 'Revenue Objective' : 'Activity Quota'}
                                        </p>
                                        {target.assignee_name && (
                                            <div className="flex items-center gap-2 mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg w-fit">
                                                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] font-bold text-white">
                                                    {target.assignee_name.charAt(0)}
                                                </div>
                                                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                                                    {target.assignee_name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronization level</span>
                                            <span className={`text-xl font-black ${percent >= 100 ? 'text-indigo-600' : 'text-slate-900 dark:text-white'}`}>
                                                {percent.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out rounded-full ${percent >= 100 ? 'bg-gradient-to-r from-indigo-500 to-purple-600' :
                                                    percent > 50 ? 'bg-indigo-400' : 'bg-slate-400'
                                                    }`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                            <span>Achieved: {isRevenue ? currencySymbol : ''}{achieved.toLocaleString()}</span>
                                            <span>Threshold: {isRevenue ? currencySymbol : ''}{goal.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Milestones Gating Visualization */}
                                    {target.milestones && target.milestones.length > 0 && (
                                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Progression Gates</p>
                                            <div className="space-y-2">
                                                {target.milestones.map((milestone: any) => {
                                                    const { currencySymbol } = useLocalization();
                                                    const mAchieved = Number(milestone.achieved_value || 0)
                                                    const mTarget = Number(milestone.target_value || 0)
                                                    const mPercent = mTarget > 0 ? Math.min((mAchieved / mTarget) * 100, 100) : 0
                                                    const isPassed = milestone.status === 'passed'
                                                    const isFailed = milestone.status === 'failed'

                                                    return (
                                                        <div key={milestone.id} className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${isPassed ? 'bg-emerald-500' : isFailed ? 'bg-rose-500' : 'bg-slate-300'}`} />
                                                            <div className="flex-1">
                                                                <div className="flex justify-between text-[9px] font-medium mb-1">
                                                                    <span className={isFailed ? 'text-rose-600' : 'text-slate-600 dark:text-slate-300'}>{milestone.name}</span>
                                                                    <span className="text-slate-400">{format(new Date(milestone.deadline), 'MMM d')}</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-500 ${isPassed ? 'bg-emerald-500' : isFailed ? 'bg-rose-500' : 'bg-indigo-400'}`}
                                                                        style={{ width: `${mPercent}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/10">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Terminal Date</p>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{format(new Date(target.period_end), 'MMM d, yyyy')}</p>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-white/10">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Incentive</p>
                                            <p className="text-xs font-black text-emerald-600">{currencySymbol}{Number(target.incentive_amount || 0).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {percent >= 100 && (
                                        <div className="pt-4 flex items-center gap-2 justify-center text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] border-t border-indigo-500/10">
                                            <ArrowUpRight className="w-4 h-4" />
                                            Target Synchronized
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    {targets.length === 0 && (
                        <div className="col-span-full py-24 glass rounded-[3rem] border-2 border-dashed border-indigo-500/10 flex flex-col items-center justify-center text-center px-6">
                            <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                                <Target className="w-12 h-12 text-indigo-500/40" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">No active objectives</h3>
                            <p className="text-slate-500 font-medium max-w-sm">Your performance grid is currently offline. Synchronize with your manager to establishing new achievement benchmarks.</p>
                            {isManager && (
                                <Link href="/crm/targets/new" className="mt-8">
                                    <Button className="bg-indigo-600 text-white px-8 h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px]">Initialize Calibration</Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
