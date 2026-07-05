'use client'

import { useState, useEffect } from 'react'
import { Printer, Search, Calendar, Filter, AlertTriangle, TrendingDown } from 'lucide-react'
import { getAgeingReport } from "@/app/actions/accounting/reports"
import { format } from 'date-fns'
import { useLocalization } from '@/contexts/localization-context'
import { cn } from '@/lib/utils'

export default function AgeingReportPage() {
    const { currencySymbol } = useLocalization()
    const [loading, setLoading] = useState(true)
    const [type, setType] = useState<'receivables' | 'payables'>('receivables')
    const [data, setData] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        loadData()
    }, [type])

    async function loadData() {
        setLoading(true)
        const res = await getAgeingReport(type)
        if (res.success) {
            setData(res.data || [])
        }
        setLoading(false)
    }

    const filtered = data.filter(d => 
        d.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.number.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totals = filtered.reduce((acc, curr) => ({
        outstanding: acc.outstanding + curr.outstanding,
        '0-30': acc['0-30'] + curr.slots['0-30'],
        '30-60': acc['30-60'] + curr.slots['30-60'],
        '60-90': acc['60-90'] + curr.slots['60-90'],
        '90+': acc['90+'] + curr.slots['90+'],
    }), { outstanding: 0, '0-30': 0, '30-60': 0, '60-90': 0, '90+': 0 })

    const fmt = (num: number) => num === 0 ? '-' : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 print:bg-white">
            {/* ── Page Header ── */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5 no-print">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="h-5 w-5 text-indigo-600" />
                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                Ageing Analysis
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Track outstanding <span className="font-semibold text-slate-700 dark:text-slate-300">{type}</span> over time
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Type Switcher */}
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setType('receivables')}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-semibold rounded-lg transition-all",
                                    type === 'receivables' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                Receivables
                            </button>
                            <button
                                onClick={() => setType('payables')}
                                className={cn(
                                    "px-4 py-1.5 text-sm font-semibold rounded-lg transition-all",
                                    type === 'payables' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                Payables
                            </button>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search party or bill..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-56 focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-sm shadow-indigo-200">
                            <Printer className="h-4 w-4" />
                            Print
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

                {/* Print Header */}
                <div className="hidden print:block text-center mb-6 border-b border-slate-300 pb-4">
                    <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">
                        {type === 'receivables' ? 'Receivables Ageing Report' : 'Payables Ageing Report'}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 uppercase tracking-wide">
                        As on {format(new Date(), 'dd-MMM-yyyy').toUpperCase()}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:shadow-none print:border-black">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-4 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Bill No.</th>
                                    <th className="px-4 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Party Name</th>
                                    <th className="px-4 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Outstanding</th>
                                    <th className="px-4 py-3 text-xs font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest text-right bg-emerald-50/50 dark:bg-emerald-900/10">0-30 Days</th>
                                    <th className="px-4 py-3 text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest text-right bg-amber-50/50 dark:bg-amber-900/10">30-60 Days</th>
                                    <th className="px-4 py-3 text-xs font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest text-right bg-orange-50/50 dark:bg-orange-900/10">60-90 Days</th>
                                    <th className="px-4 py-3 text-xs font-black text-rose-600 dark:text-rose-500 uppercase tracking-widest text-right bg-rose-50/50 dark:bg-rose-900/10">&gt; 90 Days</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 print:divide-slate-300">
                                {loading ? (
                                    <tr><td colSpan={8} className="py-20 text-center"><p className="text-sm text-slate-500 font-semibold uppercase tracking-widest animate-pulse">Calculating Ageing...</p></td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={8} className="py-20 text-center"><p className="text-sm text-slate-400 dark:text-slate-600 italic">No outstanding bills found.</p></td></tr>
                                ) : (
                                    filtered.map((row: any) => (
                                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{format(new Date(row.date), 'dd MMM yyyy')}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300">{row.number}</td>
                                            <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-white uppercase">{row.party}</td>
                                            <td className="px-4 py-3 text-sm text-right font-black text-slate-900 dark:text-white">{fmt(row.outstanding)}</td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/5">{fmt(row.slots['0-30'])}</td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-900/5">{fmt(row.slots['30-60'])}</td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-orange-600 dark:text-orange-400 bg-orange-50/30 dark:bg-orange-900/5">{fmt(row.slots['60-90'])}</td>
                                            <td className="px-4 py-3 text-sm text-right font-bold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-900/5">{fmt(row.slots['90+'])}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {!loading && (
                                <tfoot className="bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-700 print:border-black">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest text-right">
                                            Total Overdue
                                        </td>
                                        <td className="px-4 py-4 text-sm text-right font-black text-slate-900 dark:text-white">{currencySymbol}{fmt(totals.outstanding)}</td>
                                        <td className="px-4 py-4 text-sm text-right font-black text-emerald-600 dark:text-emerald-500 bg-emerald-100/50 dark:bg-emerald-900/20">{fmt(totals['0-30'])}</td>
                                        <td className="px-4 py-4 text-sm text-right font-black text-amber-600 dark:text-amber-500 bg-amber-100/50 dark:bg-amber-900/20">{fmt(totals['30-60'])}</td>
                                        <td className="px-4 py-4 text-sm text-right font-black text-orange-600 dark:text-orange-500 bg-orange-100/50 dark:bg-orange-900/20">{fmt(totals['60-90'])}</td>
                                        <td className="px-4 py-4 text-sm text-right font-black text-rose-600 dark:text-rose-500 bg-rose-100/50 dark:bg-rose-900/20">{fmt(totals['90+'])}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
