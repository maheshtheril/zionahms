'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Save, Loader2, Search, X, Check, ArrowLeft,
    Calendar, Building2, User, Receipt, CreditCard,
    Plus, Trash2, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import { useLocalization } from "@/contexts/localization-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TallyPaymentFormProps {
    type: 'payment' | 'receipt';
    initialData?: any;
    onSave: (data: any) => Promise<any>;
    onCancel: () => void;
    suppliersSearch?: (query: string) => Promise<any[]>;
    patientsSearch?: (query: string) => Promise<any[]>;
    accountsSearch?: (query: string) => Promise<any[]>;
    journalsSearch?: (query: string) => Promise<any[]>;
    getBills?: (partnerId: string, includeIds?: string[]) => Promise<any>;
    currency?: string;
}

/**
 * Modern searchable select component matching SaaS ERP theme
 */
function TallySelect({ 
    id, 
    value, 
    label, 
    placeholder, 
    onSearch, 
    onChange,
    autoFocus = false 
}: { 
    id: string; 
    value: string | null; 
    label: string; 
    placeholder: string; 
    onSearch: (q: string) => Promise<any[]>;
    onChange: (id: string, label: string) => void;
    autoFocus?: boolean;
}) {
    const [query, setQuery] = useState(label || '');
    const [results, setResults] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setQuery(label || '');
    }, [label]);

    const performSearch = async (q: string) => {
        setLoading(true);
        try {
            const res = await onSearch(q);
            const mapped = (res || []).map((item: any) => ({
                ...item,
                label: item.label || item.name || 'Unnamed Account',
                subLabel: item.subLabel || item.code || (item.type ? `(${item.type})` : '')
            }));
            setResults(mapped);
            setOpen(true);
            setActiveIndex(0);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: any) => {
        onChange(item.id, item.label);
        setQuery(item.label);
        setOpen(false);
    };

    const handleBlur = () => {
        if (!value) {
            setQuery('');
        } else {
            setQuery(label || '');
        }
        setOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative">
                <input
                    id={id}
                    ref={inputRef}
                    type="text"
                    autoComplete="off"
                    autoFocus={autoFocus}
                    value={(open ? query : label) || ''}
                    onChange={(e) => {
                        const val = e.target.value || '';
                        setQuery(val);
                        performSearch(val);
                    }}
                    onFocus={() => {
                        performSearch(query);
                    }}
                    onBlur={() => {
                        setTimeout(handleBlur, 200);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setActiveIndex(prev => Math.min(prev + 1, results.length - 1));
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setActiveIndex(prev => Math.max(prev - 1, 0));
                        } else if (e.key === 'Enter' && open && results[activeIndex]) {
                            e.preventDefault();
                            handleSelect(results[activeIndex]);
                        } else if (e.key === 'Escape') {
                            setOpen(false);
                        }
                    }}
                    placeholder={placeholder}
                    className="w-full h-10 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            {open && (
                <div className="absolute z-[200] w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-60 overflow-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                        <div className="p-3 text-xs text-slate-400 italic flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" /> Searching accounts...
                        </div>
                    ) : results.length > 0 ? (
                        <ul className="py-1">
                            {results.map((item, idx) => (
                                <li
                                    key={item.id}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelect(item);
                                    }}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                    className={`px-3 py-2 cursor-pointer flex flex-col transition-colors ${
                                        idx === activeIndex
                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                                    }`}
                                >
                                    <span className="text-xs font-bold">{item.label}</span>
                                    {item.subLabel && (
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                                            {item.subLabel}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-3 text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-0.5">
                            <span className="font-bold text-slate-700 dark:text-slate-300">No matching ledgers found</span>
                            <span className="text-[10px] text-slate-400">Please verify or create this ledger in the Chart of Accounts.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function TallyPaymentForm({
    type,
    initialData,
    onSave,
    onCancel,
    suppliersSearch,
    patientsSearch,
    accountsSearch,
    journalsSearch,
    getBills,
    currency
}: TallyPaymentFormProps) {
    const { currencySymbol } = useLocalization();
    const effectiveCurrency = currency || currencySymbol;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [voucherType, setVoucherType] = useState<'bill' | 'direct'>(type === 'payment' ? 'bill' : 'direct');
    const [showAcceptPrompt, setShowAcceptPrompt] = useState(false);
    const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

    // Headers
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [journalId, setJournalId] = useState<string | null>(null);
    const [journalName, setJournalName] = useState('');
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [partnerName, setPartnerName] = useState('');

    // Grids
    const [bills, setBills] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<Record<string, number>>({});
    const [directLines, setDirectLines] = useState<any[]>([
        { id: Math.random().toString(), accountId: '', accountName: '', amount: '' }
    ]);
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');

    const [isLoaded, setIsLoaded] = useState(false);

    // Initial Data Hydration
    useEffect(() => {
        if (initialData && !isLoaded) {
            setDate(initialData.date || new Date().toISOString().split('T')[0]);
            setJournalId(initialData.journalId || null);
            setJournalName(initialData.journalName || '');
            setPartnerId(initialData.partner_id || null);
            setPartnerName(initialData.partnerName || '');
            setAmount(initialData.amount || '');
            setMemo(initialData.memo || '');
            
            if (initialData.lines) setDirectLines(initialData.lines);
            if (initialData.allocations) {
                const map: Record<string, number> = {};
                initialData.allocations.forEach((a: any) => map[a.invoiceId] = Number(a.amount));
                setAllocations(map);
            }
            
            if (initialData.partner_id) setVoucherType('bill');
            else if (initialData.lines && initialData.lines.length > 0) setVoucherType('direct');

            setIsLoaded(true);
        }
    }, [initialData, isLoaded]);

    // Fetch Bills on Partner Selection
    useEffect(() => {
        if (partnerId && voucherType === 'bill' && getBills) {
            const fetch = async () => {
                const res = await getBills(partnerId);
                if (res.success) setBills(res.data || []);
            };
            fetch();
        }
    }, [partnerId, voucherType, getBills]);

    const [localVoucherNo, setLocalVoucherNo] = useState(1);

    const resetForm = () => {
        setPartnerId(null);
        setPartnerName('');
        setBills([]);
        setAllocations({});
        setDirectLines([{ id: Math.random().toString(), accountId: '', accountName: '', amount: '' }]);
        setAmount('');
        setMemo('');
        setIsSavedSuccessfully(false);
    };

    // Keyboard Listeners (Ctrl+A, Esc, Y/N)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isCtrlA = e.ctrlKey && e.key.toLowerCase() === 'a';
            if (isCtrlA) {
                e.preventDefault();
                if (!showAcceptPrompt && !isSavedSuccessfully && Number(amount || 0) > 0) {
                    setShowAcceptPrompt(true);
                }
            }
            if (e.key === 'Escape') {
                if (showAcceptPrompt) setShowAcceptPrompt(false);
                else if (!isSavedSuccessfully) onCancel();
            }
            if (showAcceptPrompt && (e.key.toLowerCase() === 'y' || (e.key === 'Enter' && !isSubmitting))) {
                e.preventDefault();
                handleSave();
            }
            if (showAcceptPrompt && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                setShowAcceptPrompt(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAcceptPrompt, isSavedSuccessfully, amount, isSubmitting, onCancel]);

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const payload: any = {
                date: new Date(date),
                amount: Number(amount),
                journalId,
                partner_id: partnerId,
                memo,
                type: type === 'payment' ? 'outbound' : 'inbound'
            };

            if (voucherType === 'bill') {
                payload.allocations = Object.entries(allocations)
                    .filter(([_, amt]) => Number(amt) > 0)
                    .map(([id, amt]) => ({ invoiceId: id, amount: Number(amt) }));
            } else {
                payload.lines = directLines
                    .filter(l => l.accountId && Number(l.amount) > 0)
                    .map(l => ({ accountId: l.accountId, amount: Number(l.amount) }));
            }

            await onSave(payload);
            setIsSavedSuccessfully(true);
            
            setTimeout(() => {
                resetForm();
                setLocalVoucherNo(prev => prev + 1);
            }, 1000);
        } finally {
            setIsSubmitting(false);
            setShowAcceptPrompt(false);
        }
    };

    const isReceipt = type === 'receipt';
    const accentColor = isReceipt ? 'emerald' : 'indigo';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
            
            {/* Top Navigation Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCancel}
                        className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                {isReceipt ? 'Receipt Voucher Entry' : 'Payment Voucher Entry'}
                            </h1>
                            <Badge className={isReceipt ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold" : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold"}>
                                Voucher #{localVoucherNo}
                            </Badge>
                        </div>
                        <p className="text-xs text-slate-400">
                            {isReceipt ? 'Inbound cash/bank collection & invoice settlement' : 'Outbound payment & expense settlement'}
                        </p>
                    </div>
                </div>

                {/* Mode Selector & Quick Actions */}
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setVoucherType('bill')}
                            className={cn(
                                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                voucherType === 'bill'
                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            Against Bill
                        </button>
                        <button
                            type="button"
                            onClick={() => setVoucherType('direct')}
                            className={cn(
                                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                                voucherType === 'direct'
                                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            Direct Ledger
                        </button>
                    </div>

                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="h-10 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold"
                    >
                        Cancel (Esc)
                    </Button>
                    <Button
                        onClick={() => setShowAcceptPrompt(true)}
                        disabled={isSubmitting || Number(amount || 0) <= 0}
                        className={cn(
                            "h-10 px-6 rounded-xl text-white text-xs font-bold shadow-lg active:scale-95 transition-all",
                            isReceipt ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                        )}
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Voucher
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono font-normal">Ctrl+A</span>
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6 overflow-y-auto">
                
                {/* 1. Header Details Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        Voucher Particulars
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Date Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Transaction Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full h-10 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Money Account (Bank / Cash) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                {isReceipt ? 'Deposit Into (Cash/Bank)' : 'Paid From (Cash/Bank)'}
                            </label>
                            <TallySelect
                                id="money-account"
                                value={journalId}
                                label={journalName}
                                placeholder="Select Cash / Bank Account..."
                                onSearch={journalsSearch || (async () => [])}
                                onChange={(id, lbl) => {
                                    setJournalId(id);
                                    setJournalName(lbl);
                                }}
                                autoFocus
                            />
                        </div>

                        {/* Partner / Party (If bill mode) */}
                        {voucherType === 'bill' ? (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {isReceipt ? 'Received From (Patient / Customer)' : 'Paid To (Supplier / Vendor)'}
                                </label>
                                <TallySelect
                                    id="partner-account"
                                    value={partnerId}
                                    label={partnerName}
                                    placeholder={isReceipt ? 'Search Patient / Customer...' : 'Search Supplier / Vendor...'}
                                    onSearch={(isReceipt ? patientsSearch : suppliersSearch) || (async () => [])}
                                    onChange={(id, lbl) => {
                                        setPartnerId(id);
                                        setPartnerName(lbl);
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Entry Mode</label>
                                <div className="h-10 flex items-center px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                                    Direct General Ledger Posting
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Transaction Allocation Grid Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {voucherType === 'bill' ? 'Invoice Allocations' : 'Ledger Line Items'}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {voucherType === 'bill'
                                    ? 'Allocate payment amounts against unpaid bills or invoices'
                                    : 'Enter expense or revenue accounts and corresponding amounts'}
                            </p>
                        </div>
                        {voucherType === 'direct' && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDirectLines([...directLines, { id: Math.random().toString(), accountId: '', accountName: '', amount: '' }])}
                                className="h-8 rounded-lg border-slate-200 dark:border-slate-700 text-xs font-bold"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" /> Add Line
                            </Button>
                        )}
                    </div>

                    {voucherType === 'bill' ? (
                        <div className="overflow-x-auto">
                            {bills.length > 0 ? (
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                                            <th className="px-6 py-3 w-16">#</th>
                                            <th className="px-6 py-3">Invoice Number</th>
                                            <th className="px-6 py-3 text-right">Outstanding Balance</th>
                                            <th className="px-6 py-3 text-right w-64">Allocated Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {bills.map((bill, idx) => (
                                            <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                                <td className="px-6 py-3.5 font-mono text-slate-400">{idx + 1}</td>
                                                <td className="px-6 py-3.5 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                                    {bill.number}
                                                </td>
                                                <td className="px-6 py-3.5 text-right font-mono text-slate-600 dark:text-slate-300">
                                                    {effectiveCurrency}{Number(bill.outstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-3.5 text-right">
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={allocations[bill.id] || ''}
                                                        onChange={e => {
                                                            const newMap = { ...allocations, [bill.id]: Number(e.target.value) };
                                                            setAllocations(newMap);
                                                            const total = (Object.values(newMap) as number[]).reduce((acc, val) => acc + (val || 0), 0);
                                                            setAmount(total.toString());
                                                        }}
                                                        className="w-48 h-9 px-3 text-right font-mono font-bold text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center text-slate-400 space-y-2">
                                    <AlertCircle className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                        {partnerId ? 'No outstanding invoices for this party' : 'Select a party above to view pending invoices'}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                                        <th className="px-6 py-3 w-16">#</th>
                                        <th className="px-6 py-3">Ledger Account</th>
                                        <th className="px-6 py-3 text-right w-64">Amount</th>
                                        <th className="px-6 py-3 text-center w-20">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {directLines.map((line, idx) => (
                                        <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="px-6 py-3.5 font-mono text-slate-400">{idx + 1}</td>
                                            <td className="px-6 py-3.5">
                                                <TallySelect
                                                    id={`direct-acc-${idx}`}
                                                    value={line.accountId}
                                                    label={line.accountName}
                                                    placeholder="Select Particulars Ledger..."
                                                    onSearch={accountsSearch || (async () => [])}
                                                    onChange={(id, lbl) => {
                                                        const lines = [...directLines];
                                                        lines[idx] = { ...lines[idx], accountId: id, accountName: lbl };
                                                        setDirectLines(lines);
                                                    }}
                                                />
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={line.amount}
                                                    onChange={e => {
                                                        const lines = [...directLines];
                                                        lines[idx] = { ...lines[idx], amount: e.target.value };
                                                        setDirectLines(lines);
                                                        const total = lines.reduce((acc: number, ln: any) => acc + Number(ln.amount || 0), 0);
                                                        setAmount(total.toString());
                                                        if (e.target.value && idx === lines.length - 1) {
                                                            setDirectLines([...lines, { id: Math.random().toString(), accountId: '', accountName: '', amount: '' }]);
                                                        }
                                                    }}
                                                    className="w-48 h-9 px-3 text-right font-mono font-bold text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                />
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                {directLines.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const filtered = directLines.filter((_, i) => i !== idx);
                                                            setDirectLines(filtered);
                                                            const total = filtered.reduce((acc: number, ln: any) => acc + Number(ln.amount || 0), 0);
                                                            setAmount(total.toString());
                                                        }}
                                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 3. Summary & Narration Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Narration / Memo</label>
                        <textarea
                            rows={3}
                            value={memo}
                            onChange={e => setMemo(e.target.value)}
                            placeholder="Add reference notes or narration for ledger posting..."
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Voucher Amount</span>
                            <Badge variant="outline" className="font-mono text-[10px]">
                                Reconciled
                            </Badge>
                        </div>
                        <div className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                            {effectiveCurrency} {Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-[11px] text-slate-400">
                            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Ctrl+A</kbd> to quickly save and post to general ledger.
                        </p>
                    </div>
                </div>
            </div>

            {/* Accept Confirmation Prompt Modal */}
            {showAcceptPrompt && (
                <div className="fixed inset-0 z-[250] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", isReceipt ? "bg-emerald-500/10 text-emerald-600" : "bg-indigo-500/10 text-indigo-600")}>
                                <Check className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">Post Voucher?</h4>
                                <p className="text-xs text-slate-500">Amount: {effectiveCurrency}{Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                            Are you sure you want to serialize and post this voucher to the general ledger?
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAcceptPrompt(false)}
                                className="rounded-xl text-xs font-bold"
                            >
                                No (Esc)
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className={cn(
                                    "rounded-xl text-white text-xs font-bold",
                                    isReceipt ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                                )}
                            >
                                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                                Yes (Enter)
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Overlay Modal */}
            {isSavedSuccessfully && (
                <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95">
                        <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Voucher Saved</h3>
                            <p className="text-xs text-slate-500 mt-1">Transaction successfully posted to double-entry ledger.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
