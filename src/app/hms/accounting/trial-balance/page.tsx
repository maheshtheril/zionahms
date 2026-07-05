'use client';

import { useEffect, useState } from 'react';
import { getTrialBalance } from '@/app/actions/accounting/reports';
import { getCompanyName } from '@/app/actions/settings';
import { Printer, Calendar, RefreshCw, Search, ArrowRightLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLocalization } from '@/contexts/localization-context';

export default function TrialBalancePage() {
    const { currencySymbol } = useLocalization();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
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
        const res = await getTrialBalance(new Date(asOfDate));
        if (res?.success) setData(res);
        setIsLoading(false);
    }

    const filtered = data?.data?.filter((item: any) => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code?.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const fmt = (num: number) => num === 0 ? '-' : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const isBalanced = data?.totalDebit === data?.totalCredit && data?.totalDebit > 0;
    const isZero = data?.totalDebit === 0 && data?.totalCredit === 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 print:bg-white">

            {/* ── Page Header ── */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5 no-print">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                Trial Balance
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Ledger balances as on{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {format(new Date(asOfDate), 'dd MMM yyyy')}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search Ledgers..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-64 focus:outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <input
                                type="date"
                                value={asOfDate}
                                onChange={e => setAsOfDate(e.target.value)}
                                className="bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none [color-scheme:light] dark:[color-scheme:dark]"
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
                        {companyName || 'Your Hospital'}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 uppercase tracking-wide">
                        Trial Balance as on {format(new Date(asOfDate), 'dd-MMM-yyyy').toUpperCase()}
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
                                Trial Balance Register
                            </p>
                        </div>
                        {isLoading && (
                            <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold animate-pulse">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Computing Balances...
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 print:bg-gray-100 print:border-black">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Particulars (Ledger)</th>
                                    <th className="px-6 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Debit Balance</th>
                                    <th className="px-6 py-3 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Credit Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 print:divide-slate-300">
                                {isLoading ? (
                                    <tr><td colSpan={3} className="py-20 text-center"><RefreshCw className="h-8 w-8 text-indigo-300 animate-spin mx-auto mb-4" /><p className="text-sm text-slate-500 font-semibold uppercase tracking-widest animate-pulse">Loading Ledgers...</p></td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={3} className="py-20 text-center"><p className="text-sm text-slate-400 dark:text-slate-600 italic">No ledger balances found.</p></td></tr>
                                ) : (
                                    filtered.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                                            <td className="px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                {item.name}
                                                {item.code && <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">[{item.code}]</span>}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-500">
                                                {item.debit > 0 ? fmt(item.debit) : ''}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-right tabular-nums font-semibold text-rose-600 dark:text-rose-500">
                                                {item.credit > 0 ? fmt(item.credit) : ''}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {!isLoading && (
                                <tfoot className="bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-700 print:border-black">
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                            Grand Total
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right tabular-nums font-black text-slate-900 dark:text-white">
                                            {currencySymbol}{fmt(data?.totalDebit || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right tabular-nums font-black text-slate-900 dark:text-white">
                                            {currencySymbol}{fmt(data?.totalCredit || 0)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4 no-print shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            {isLoading || isZero ? (
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse" />
                            ) : isBalanced ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-rose-500" />
                            )}
                            <span className={cn(
                                "text-xs font-bold uppercase tracking-wider",
                                isLoading || isZero ? "text-slate-500" : isBalanced ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            )}>
                                {isLoading ? 'Computing...' : isZero ? 'No Data' : isBalanced ? 'Books Balanced' : 'Out of Balance'}
                            </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-semibold">Ledgers:</span> {filtered.length} nodes
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <a href="/hms/accounting/profit-and-loss" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            View Profit & Loss →
                        </a>
                        <a href="/hms/accounting/balance-sheet" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            View Balance Sheet →
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
