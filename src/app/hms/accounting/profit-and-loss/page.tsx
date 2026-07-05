'use client';

import { useEffect, useState } from 'react';
import { getProfitAndLossStatement } from '@/app/actions/accounting/reports';
import { getCompanyName } from '@/app/actions/settings';
import { Printer, TrendingUp, TrendingDown, DollarSign, BarChart3, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLocalization } from '@/contexts/localization-context';

export default function ProfitAndLossPage() {
    const { currencySymbol } = useLocalization();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [companyName, setCompanyName] = useState('');
    const [startDate, setStartDate] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadData();
    }, [startDate, endDate]);

    useEffect(() => {
        getCompanyName().then(res => {
            if (res?.success && res.name) setCompanyName(res.name);
        });
    }, []);

    async function loadData() {
        setIsLoading(true);
        const res = await getProfitAndLossStatement(new Date(startDate), new Date(endDate));
        if (res?.success) setData(res.data);
        setIsLoading(false);
    }

    const fmt = (num: number) =>
        Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const netProfit = data?.netProfit || 0;
    const totalRevenue = data?.totalRevenue || 0;
    const totalExpenses = (data?.totalExpenses || 0) + (data?.totalCOGS || 0);
    const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';
    const isProfit = netProfit >= 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 print:bg-white">

            {/* ── Page Header ── */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5 no-print">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="h-5 w-5 text-indigo-600" />
                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                Profit & Loss Account
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Financial performance for{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {format(new Date(startDate), 'dd MMM yyyy')} – {format(new Date(endDate), 'dd MMM yyyy')}
                            </span>
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Date Range */}
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none [color-scheme:light] dark:[color-scheme:dark]"
                            />
                            <span className="text-slate-400 text-xs">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none [color-scheme:light] dark:[color-scheme:dark]"
                            />
                        </div>

                        <button
                            onClick={loadData}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all border border-slate-200 dark:border-slate-700"
                        >
                            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                            Refresh
                        </button>

                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-sm shadow-indigo-200"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
                    {/* Total Revenue */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-3 right-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Revenue</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {currencySymbol}{isLoading ? '...' : fmt(totalRevenue)}
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                            <span className="text-xs text-emerald-600 font-semibold">Income</span>
                        </div>
                    </div>

                    {/* Total Expenses */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-3 right-3 p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                            <TrendingDown className="h-5 w-5 text-rose-600" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Expenses</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {currencySymbol}{isLoading ? '...' : fmt(totalExpenses)}
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                            <ArrowDownRight className="h-3 w-3 text-rose-600" />
                            <span className="text-xs text-rose-600 font-semibold">Outflow</span>
                        </div>
                    </div>

                    {/* Net Profit / Loss */}
                    <div className={cn(
                        'bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm relative overflow-hidden',
                        isProfit ? 'border-emerald-200 dark:border-emerald-800' : 'border-rose-200 dark:border-rose-800'
                    )}>
                        <div className={cn(
                            'absolute top-3 right-3 p-2 rounded-xl',
                            isProfit ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'
                        )}>
                            <DollarSign className={cn('h-5 w-5', isProfit ? 'text-emerald-600' : 'text-rose-600')} />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            {isProfit ? 'Net Profit' : 'Net Loss'}
                        </p>
                        <p className={cn(
                            'text-2xl font-black tracking-tight',
                            isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        )}>
                            {isLoading ? '...' : `${currencySymbol}${fmt(Math.abs(netProfit))}`}
                        </p>
                        <div className="mt-2">
                            <span className={cn(
                                'text-xs font-semibold px-2 py-0.5 rounded-full',
                                isProfit ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'
                            )}>
                                {isProfit ? '▲ Surplus' : '▼ Deficit'}
                            </span>
                        </div>
                    </div>

                    {/* Net Margin */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-3 right-3 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                            <BarChart3 className="h-5 w-5 text-indigo-600" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Net Margin</p>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                            {isLoading ? '...' : `${margin}%`}
                        </p>
                        <div className="mt-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Profit ÷ Revenue</span>
                        </div>
                    </div>
                </div>

                {/* ── Print Header (only on print) ── */}
                <div className="hidden print:block text-center mb-6 border-b border-slate-300 pb-4">
                    <h2 className="text-xl font-black uppercase tracking-widest text-slate-900">
                        {companyName || 'Your Hospital'}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 uppercase tracking-wide">
                        Profit & Loss Account for the period{' '}
                        {format(new Date(startDate), 'dd-MMM-yyyy').toUpperCase()} to{' '}
                        {format(new Date(endDate), 'dd-MMM-yyyy').toUpperCase()}
                    </p>
                </div>

                {/* ── Main Two-Column Statement ── */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:shadow-none print:border-black">

                    {/* Report Header */}
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 no-print">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">
                                    {companyName || 'Your Hospital'}
                                </h2>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                                    Profit & Loss Statement · {format(new Date(startDate), 'dd MMM yyyy')} – {format(new Date(endDate), 'dd MMM yyyy')}
                                </p>
                            </div>
                            {isLoading && (
                                <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold animate-pulse">
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    Computing...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Two-Column Table */}
                    <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 print:divide-black">

                        {/* LEFT — EXPENSES */}
                        <div>
                            {/* Column Header */}
                            <div className="bg-rose-50 dark:bg-rose-900/10 px-5 py-3 flex justify-between border-b border-slate-200 dark:border-slate-800 print:bg-gray-100">
                                <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest">
                                    Particulars (Expenses)
                                </span>
                                <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest">
                                    Amount ({currencySymbol})
                                </span>
                            </div>

                            <div className="px-5 py-4 space-y-4 min-h-[320px]">
                                {/* COGS */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Trading / COGS</span>
                                    </div>
                                    {isLoading ? (
                                        <div className="space-y-2">
                                            {[1,2,3].map(i => <div key={i} className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />)}
                                        </div>
                                    ) : (
                                        <>
                                            {(data?.cogs || []).map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between py-1.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{item.name}</span>
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{fmt(item.amount)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 mt-1">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">Total COGS</span>
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 tabular-nums">{fmt(data?.totalCOGS || 0)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Operating Expenses */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Operating Expenses</span>
                                    </div>
                                    {isLoading ? (
                                        <div className="space-y-2">
                                            {[1,2,3,4].map(i => <div key={i} className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />)}
                                        </div>
                                    ) : (
                                        <>
                                            {(data?.expenses || []).map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between py-1.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{item.name}</span>
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{fmt(item.amount)}</span>
                                                </div>
                                            ))}
                                            {(!data?.expenses?.length && !data?.cogs?.length) && (
                                                <p className="text-sm text-slate-400 dark:text-slate-600 text-center py-8 italic">No expenses recorded</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Left Footer — Net Loss if applicable */}
                            {!isLoading && !isProfit && (
                                <div className="px-5 py-3 border-t-2 border-slate-300 dark:border-slate-700 bg-rose-50 dark:bg-rose-900/10 flex justify-between">
                                    <span className="text-sm font-black text-rose-700 dark:text-rose-400 uppercase">Net Loss (Deficit)</span>
                                    <span className="text-sm font-black text-rose-700 dark:text-rose-400 tabular-nums">{fmt(Math.abs(netProfit))}</span>
                                </div>
                            )}

                            {/* Left Grand Total */}
                            <div className="px-5 py-3 border-t-2 border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 flex justify-between print:border-black">
                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">Grand Total</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                    {fmt(totalExpenses + (isProfit ? 0 : 0))}
                                </span>
                            </div>
                        </div>

                        {/* RIGHT — INCOME */}
                        <div>
                            {/* Column Header */}
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 px-5 py-3 flex justify-between border-b border-slate-200 dark:border-slate-800 print:bg-gray-100">
                                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                    Particulars (Income)
                                </span>
                                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                    Amount ({currencySymbol})
                                </span>
                            </div>

                            <div className="px-5 py-4 space-y-4 min-h-[320px]">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Revenue from Operations</span>
                                    </div>
                                    {isLoading ? (
                                        <div className="space-y-2">
                                            {[1,2,3,4].map(i => <div key={i} className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />)}
                                        </div>
                                    ) : (
                                        <>
                                            {(data?.revenue || []).map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between py-1.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                                                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{item.name}</span>
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{fmt(item.amount)}</span>
                                                </div>
                                            ))}
                                            {!data?.revenue?.length && (
                                                <p className="text-sm text-slate-400 dark:text-slate-600 text-center py-8 italic">No revenue recorded</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right Footer — Net Profit if applicable */}
                            {!isLoading && isProfit && (
                                <div className="px-5 py-3 border-t-2 border-slate-300 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-900/10 flex justify-between">
                                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase">Net Profit (Surplus)</span>
                                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{fmt(netProfit)}</span>
                                </div>
                            )}

                            {/* Right Grand Total */}
                            <div className="px-5 py-3 border-t-2 border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 flex justify-between print:border-black">
                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">Grand Total</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                    {fmt(Math.max(totalRevenue, totalExpenses + (isProfit ? netProfit : 0)))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Footer Status Bar ── */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4 no-print shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className={cn('w-2.5 h-2.5 rounded-full', isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500')} />
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {isLoading ? 'Computing...' : 'Audited'}
                            </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Net Margin:</span> {margin}%
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Period:</span>{' '}
                            {format(new Date(startDate), 'dd MMM')} – {format(new Date(endDate), 'dd MMM yyyy')}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="/hms/accounting/balance-sheet" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            View Balance Sheet →
                        </a>
                        <a href="/hms/accounting/trial-balance" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            View Trial Balance →
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
