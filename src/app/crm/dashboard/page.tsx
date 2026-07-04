
import CRMCalendar from '@/components/crm/scheduler/calendar'

import Link from 'next/link'
import { getDashboardData } from '@/app/actions/crm/dashboard'
import { Sparkles, DollarSign, Activity, Target, TrendingUp, Zap, Banknote, Euro, PoundSterling, Plus, Calendar } from "lucide-react"
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
    const data = await getDashboardData()
    const { kpis, currencySymbol, currencyCode } = data

    const getCurrencyIcon = () => {
        // ... (keep logic)
        switch (currencyCode) {
            case 'INR': return <Banknote className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            case 'EUR': return <Euro className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            case 'GBP': return <PoundSterling className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            default: return <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        }
    }

    return (
        <div className="min-h-screen bg-futuristic">
            {/* ... (background effects remain) */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-5 animate-blob" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-5 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-5 animate-blob animation-delay-4000" />
            </div>

            <div className="relative container mx-auto py-8 space-y-8 max-w-[1600px]">
                {/* Header & Quick Actions */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/20">
                            <Zap className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                CRM Dashboard
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
                                Intelligence Overview
                            </p>
                        </div>
                    </div>
                    {/* ... (keep quick actions) */}
                    <div className="flex flex-wrap gap-3">
                        <Link href="/crm/leads/new">
                            <Button className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 border-none transition-transform active:scale-95">
                                <Plus className="w-5 h-5 mr-2" />
                                New Lead
                            </Button>
                        </Link>
                        <Link href="/crm/deals/new">
                            <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
                                <DollarSign className="w-5 h-5 mr-2" />
                                New Deal
                            </Button>
                        </Link>
                        <Link href="/crm/activities/new">
                            <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">
                                <Calendar className="w-5 h-5 mr-2" />
                                Schedule
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* KPI GRID (Preserved) */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* ... (Use existing KPI code block logic here, simplified for replacement) */}
                    <Link href="/crm/reports" className="group">
                        <div className="h-full bg-white/60 dark:bg-slate-900/60 p-6 rounded-3xl shadow-lg border border-white/20 dark:border-white/5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/80 dark:hover:bg-slate-900/80 hover:shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-purple-500/20" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue</p>
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        {getCurrencyIcon()}
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                                    {currencySymbol}{kpis.totalRevenue.toLocaleString()}
                                </div>
                                <div className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20 px-2 py-1 rounded w-fit">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    <span>+12.5% MTD</span>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/crm/deals" className="group">
                        <div className="h-full bg-white/60 dark:bg-slate-900/60 p-6 rounded-3xl shadow-lg border border-white/20 dark:border-white/5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/80 dark:hover:bg-slate-900/80 hover:shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-cyan-500/20" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pipeline</p>
                                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                                        <Target className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                                    {currencySymbol}{kpis.pipelineValue.toLocaleString()}
                                </div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">{kpis.activeDealsCount}</span> active deals
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/crm/leads" className="group">
                        <div className="h-full bg-white/60 dark:bg-slate-900/60 p-6 rounded-3xl shadow-lg border border-white/20 dark:border-white/5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/80 dark:hover:bg-slate-900/80 hover:shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-pink-500/20" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lead Quality</p>
                                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                        <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                                    {kpis.avgLeadScore}
                                </div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    Average AI Score
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/crm/activities" className="group">
                        <div className="h-full bg-white/60 dark:bg-slate-900/60 p-6 rounded-3xl shadow-lg border border-white/20 dark:border-white/5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/80 dark:hover:bg-slate-900/80 hover:shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:bg-orange-500/20" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Velocity</p>
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                        <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                </div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                                    {12}
                                </div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    Pending Actions
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* MAIN CALENDAR DASHBOARD */}
                <div className="w-full">
                    <div className="glass-card bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-white/20 dark:border-white/5 backdrop-blur-md overflow-hidden relative">
                        {/* Header Badge */}
                        <div className="absolute top-4 left-6 z-10 bg-indigo-600/10 backdrop-blur-sm px-3 py-1 rounded-full border border-indigo-600/20">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">
                                Active Timeline
                            </span>
                        </div>
                        {/* Calendar Component */}
                        <div className="pt-2">
                            <CRMCalendar />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
