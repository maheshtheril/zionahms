'use client';

import { useEffect, useState } from 'react';
import { getBalanceSheetStatement } from '@/app/actions/accounting/reports';
import { getCompanyName } from '@/app/actions/settings';
import { Printer, Calendar, RefreshCw, Scale, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLocalization } from '@/contexts/localization-context';

export default function BalanceSheetPage() {
    const { currencySymbol } = useLocalization();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [companyName, setCompanyName] = useState('');
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadData();
    }, [asOfDate]);

    useEffect(() => {
        getCompanyName().then(res => {
            if (res?.success && res.name) setCompanyName(res.name);
        });
    }, []);

    async function loadData() {
        setIsLoading(true);
        const res = await getBalanceSheetStatement(new Date(asOfDate));
        if (res?.success) setData(res.data);
        setIsLoading(false);
    }

    const fmt = (num: number) => Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const totalLiabilities = data?.totalLiabilities || 0;
    const totalEquity = data?.totalEquity || 0;
    const totalAssets = data?.totalAssets || 0;
    const sourcesTotal = totalLiabilities + totalEquity;
    
    const isBalanced = Math.abs(sourcesTotal - totalAssets) < 0.01;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 print:bg-white">

            {/* ── Page Header ── */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5 no-print">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Scale className="h-5 w-5 text-indigo-600" />
                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                Balance Sheet
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Financial position as on{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {format(new Date(asOfDate), 'dd MMM yyyy')}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <input
                                type="date"
                                value={asOfDate}
                                onChange={e => setAsOfDate(e.target.value)}
                                className="bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none [color-scheme:light] dark:[color-scheme:dark]"
                            />
                        </div>

                        <button onClick={loadData} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all border border-slate-200 dark:border-slate-700">
                            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                            Refresh
                        </button>

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
                        {companyName || 'Your Hospital'}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 uppercase tracking-wide">
                        Balance Sheet as on {format(new Date(asOfDate), 'dd-MMM-yyyy').toUpperCase()}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:shadow-none print:border-black">
                    
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 no-print flex justify-between items-center">
                         <div>
                            <h2 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">
                                {companyName || 'Your Hospital'}
                            </h2>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">
                                Consolidated Statement
                            </p>
                        </div>
                        {isLoading && (
                            <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold animate-pulse">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Computing Position...
                            </div>
                        )}
                    </div>

                    {/* Two-Column Layout */}
                    <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 print:divide-black">

                        {/* LEFT: Liabilities & Equity */}
                        <div>
                            <div className="bg-amber-50 dark:bg-amber-900/10 px-5 py-3 flex justify-between border-b border-slate-200 dark:border-slate-800 print:bg-gray-100">
                                <span className="text-xs font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest">Liabilities & Sources of Funds</span>
                                <span className="text-xs font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest">Amount ({currencySymbol})</span>
                            </div>

                            <div className="px-5 py-4 space-y-5 min-h-[400px]">
                                {/* Equity */}
                                <div>
                                    <div className="mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Equity & Reserves</span>
                                    </div>
                                    {isLoading ? (
                                        <div className="space-y-2"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-full" /></div>
                                    ) : (
                                        <>
                                            {(data?.equity || []).map((item: any, i: number) => (
                                                <div key={i} className="flex justify-between py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded transition-colors">
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{fmt(item.amount)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between py-2 px-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                                                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Profit & Loss A/c (Retained)</span>
                                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{fmt(data?.retainedEarnings || 0)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Liabilities */}
                                <div>
                                    <div className="mb-2 border-b border-slate-100 dark:border-slate-800 pb-1 mt-4">
                                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Current & Non-Current Liabilities</span>
                                    </div>
                                    {isLoading ? (
                                        <div className="space-y-2"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-full" /></div>
                                    ) : (
                                        (data?.liabilities || []).map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded transition-colors">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{fmt(item.amount)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="px-5 py-4 border-t-2 border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 flex justify-between print:border-black">
                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">Total Liabilities & Equity</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{isLoading ? '...' : fmt(sourcesTotal)}</span>
                            </div>
                        </div>

                        {/* RIGHT: Assets */}
                        <div>
                            <div className="bg-blue-50 dark:bg-blue-900/10 px-5 py-3 flex justify-between border-b border-slate-200 dark:border-slate-800 print:bg-gray-100">
                                <span className="text-xs font-black text-blue-700 dark:text-blue-500 uppercase tracking-widest">Assets & Application of Funds</span>
                                <span className="text-xs font-black text-blue-700 dark:text-blue-500 uppercase tracking-widest">Amount ({currencySymbol})</span>
                            </div>

                            <div className="px-5 py-4 space-y-5 min-h-[400px]">
                                <div>
                                    <div className="mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                                        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Fixed & Current Assets</span>
                                    </div>
                                    {isLoading ? (
                                        <div className="space-y-2"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-full" /></div>
                                    ) : (
                                        (data?.assets || []).map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded transition-colors">
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{fmt(item.amount)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="px-5 py-4 border-t-2 border-slate-900 dark:border-slate-400 bg-slate-100 dark:bg-slate-800 flex justify-between print:border-black">
                                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">Total Assets</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{isLoading ? '...' : fmt(totalAssets)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {!isLoading && !isBalanced && (
                        <div className="bg-rose-50 dark:bg-rose-900/30 p-3 text-center border-t border-rose-200 dark:border-rose-800">
                            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                                ⚠️ Difference in Opening Balances: {currencySymbol}{fmt(Math.abs(sourcesTotal - totalAssets))}
                            </span>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4 no-print shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                             <div className={cn('w-2.5 h-2.5 rounded-full', isLoading ? 'bg-slate-300 dark:bg-slate-700 animate-pulse' : isBalanced ? 'bg-emerald-500' : 'bg-rose-500')} />
                             <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {isLoading ? 'Computing...' : isBalanced ? 'Position Balanced' : 'Position Unbalanced'}
                             </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <a href="/hms/accounting/profit-and-loss" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            View Profit & Loss →
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
