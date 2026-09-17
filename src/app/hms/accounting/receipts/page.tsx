'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPayments } from '@/app/actions/accounting/payments';
import {
    Plus, Search, CheckCircle2, Clock,
    FileText, ArrowDownLeft, TrendingUp, Receipt,
    RefreshCw, Filter, Download, ArrowUpRight,
    Wallet, Building2, User
} from 'lucide-react';
import { format } from 'date-fns';
import { CreateReceiptDialog } from '@/components/accounting/create-receipt-dialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from "@/contexts/localization-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ReceiptsPage() {
    const { currencySymbol } = useLocalization();
    const router = useRouter();
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        const res = await getPayments('inbound');
        if (res?.success) {
            setPayments(res.data || []);
        }
        setIsLoading(false);
    }

    // Keyboard shortcut F6 to create receipt
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F6') {
                e.preventDefault();
                setIsCreateOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filtered = payments.filter(p =>
        p.payment_number?.toLowerCase().includes(search.toLowerCase()) ||
        p.partner_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.reference?.toLowerCase().includes(search.toLowerCase()) ||
        p.method?.toLowerCase().includes(search.toLowerCase())
    );

    const totalReceipts = filtered.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const countDraft = filtered.filter(p => !p.posted).length;
    const countPosted = filtered.filter(p => p.posted).length;

    const safeFormat = (date: any, fmt: string) => {
        try {
            if (!date) return 'N/A';
            const d = new Date(date);
            if (isNaN(d.getTime())) return 'N/A';
            return format(d, fmt);
        } catch (e) {
            return 'N/A';
        }
    };

    const getMethodBadge = (method: string) => {
        const m = (method || '').toLowerCase();
        if (m.includes('cash')) {
            return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">CASH</Badge>;
        }
        if (m.includes('bank') || m.includes('transfer')) {
            return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-bold">BANK</Badge>;
        }
        if (m.includes('upi') || m.includes('online')) {
            return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10px] font-bold">UPI</Badge>;
        }
        return <Badge variant="outline" className="text-[10px] font-bold uppercase">{method || 'DIRECT'}</Badge>;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 p-6 lg:p-8 space-y-6">
            
            {/* Top Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Receipt className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Receipt Register</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Inbound collections, patient bill settlements & customer receipts
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadData}
                        disabled={isLoading}
                        className="h-10 px-4 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Receipt
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-700/50 text-[10px] font-mono font-normal">F6</span>
                    </Button>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Collections</span>
                        <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                        {currencySymbol}{totalReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Total inbound revenue in this register
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Posted Receipts</span>
                        <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                        {countPosted}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Synchronized with general ledger accounts
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Vouchers</span>
                        <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <FileText className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                        {filtered.length}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {countDraft > 0 ? `${countDraft} pending settlement` : 'All entries reconciled'}
                    </p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search by voucher #, patient, partner, or method..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-xs font-medium focus-visible:ring-emerald-500"
                    />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Showing:</span> {filtered.length} of {payments.length} receipts
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                <th className="px-6 py-3.5">Date</th>
                                <th className="px-6 py-3.5">Voucher #</th>
                                <th className="px-6 py-3.5">Received From (Particulars)</th>
                                <th className="px-6 py-3.5">Payment Method</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Amount</th>
                                <th className="px-6 py-3.5 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
                                            <span className="text-xs font-semibold uppercase tracking-wider">Loading receipts register...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <Receipt className="h-6 w-6" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No receipts found</p>
                                            <p className="text-xs text-slate-500">Record an inbound receipt or adjust your search term.</p>
                                            <Button
                                                size="sm"
                                                onClick={() => setIsCreateOpen(true)}
                                                className="mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                            >
                                                <Plus className="h-3.5 w-3.5 mr-1" /> Create Receipt
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((p) => (
                                    <tr
                                        key={p.id}
                                        onClick={() => router.push(`/hms/accounting/receipts/${p.id}/edit`)}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4 font-mono font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            {safeFormat(p.date, 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                            {p.payment_number || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                        {p.partner_name || 'Direct / Anonymous'}
                                                    </div>
                                                    {p.reference && (
                                                        <div className="text-[10px] text-slate-400 font-mono">
                                                            Ref: {p.reference}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getMethodBadge(p.method)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {p.posted ? (
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Posted
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold">
                                                    <Clock className="h-3 w-3 mr-1" /> Draft
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-black text-slate-900 dark:text-white text-sm whitespace-nowrap">
                                            {currencySymbol}{Number(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline inline-flex items-center gap-1">
                                                Edit <ArrowUpRight className="h-3 w-3" />
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Receipt Modal Dialog */}
            <CreateReceiptDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={loadData}
            />
        </div>
    );
}

