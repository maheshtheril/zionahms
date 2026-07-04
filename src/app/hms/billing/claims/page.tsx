import { getClaims } from "@/app/actions/claims"
import { ClaimsClient } from "./claims-client"
import { ShieldPlus, FileText, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react"

export default async function ClaimsDashboardPage({
    searchParams
}: {
    searchParams: Promise<{ status?: string }>
}) {
    const { status } = await searchParams;
    const claimsRes = await getClaims(status);
    const claims = claimsRes.data || [];

    // Quick Stats
    const totalPending = claims.filter(c => c.status === 'draft' || c.status === 'submitted').reduce((sum, c) => sum + Number(c.amount_billed), 0);
    const totalPaid = claims.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount_billed), 0);
    const deniedCount = claims.filter(c => c.status === 'denied').length;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <ShieldPlus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        Back-Office Claims Dashboard
                    </h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Adjudicate and Submit Insurance Claims
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pending Processing</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">${totalPending.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Paid</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">${totalPaid.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 shrink-0">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Denied Claims</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{deniedCount} Claims</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Claims Table UI Component */}
            <ClaimsClient initialClaims={claims} />
        </div>
    )
}
