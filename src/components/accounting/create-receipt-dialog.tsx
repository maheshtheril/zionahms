'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { upsertPayment } from '@/app/actions/accounting/payments';
import { searchPatients, getOutstandingInvoices } from '@/app/actions/accounting/helpers';
import {
    Save, Loader2, Calendar, CreditCard, User,
    Receipt, FileText, CheckCircle2, AlertCircle, X, ArrowRight
} from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLocalization } from "@/contexts/localization-context";

interface CreateReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateReceiptDialog({ open, onOpenChange, onSuccess }: CreateReceiptDialogProps) {
    const { currencySymbol } = useLocalization();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [reference, setReference] = useState('');
    const [memo, setMemo] = useState('');

    // Allocation State
    const [invoices, setInvoices] = useState<any[]>([]);
    const [allocations, setAllocations] = useState<Record<string, number>>({});
    const [isFetchingInvoices, setIsFetchingInvoices] = useState(false);

    // Fetch invoices when partner changes
    const handlePartnerChange = async (id: string | null) => {
        setPartnerId(id);
        if (id) {
            setIsFetchingInvoices(true);
            const res = await getOutstandingInvoices(id);
            if (res.success) {
                setInvoices(res.data || []);
                // Reset allocations
                setAllocations({});
            }
            setIsFetchingInvoices(false);
        } else {
            setInvoices([]);
            setAllocations({});
        }
    };

    const handleAllocationChange = (invoiceId: string, val: string) => {
        const num = Number(val);
        const newAllocations = { ...allocations, [invoiceId]: num };
        setAllocations(newAllocations);

        // Update total amount based on allocations
        const total = Object.values(newAllocations).reduce((sum, a) => sum + a, 0);
        if (total > 0) setAmount(total.toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partnerId) {
            toast.error("Missing Payer", { description: "Please select who the receipt is from." });
            return;
        }
        if (!amount || Number(amount) <= 0) {
            toast.error("Invalid Amount", { description: "Please enter a positive amount." });
            return;
        }

        setIsSubmitting(true);
        const res = await upsertPayment({
            type: 'inbound',
            partner_id: partnerId,
            amount: Number(amount),
            method,
            reference,
            date: new Date(date),
            memo,
            posted: true,
            allocations: Object.entries(allocations)
                .filter(([_, amt]) => amt > 0)
                .map(([id, amt]) => ({ invoiceId: id, amount: amt }))
        });

        if (res.error) {
            toast.error("Failed to Save", { description: res.error });
            setIsSubmitting(false);
        } else {
            toast.success("Receipt Saved", { description: `Successfully recorded receipt for ${amount}` });
            setIsSubmitting(false);
            onOpenChange(false);
            onSuccess?.();
            router.refresh();
            // Reset form (optional, but good UX if they open it again)
            setAmount('');
            setPartnerId(null);
            setReference('');
            setMemo('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 bg-neutral-950 border-white/10 text-neutral-200 shadow-2xl rounded-2xl border-0 ring-0">
                {/* Decorative Backgrounds - Moved inside a wrapper that clips ONLY background, not content */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px]" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px]" />
                </div>


                <div className="flex flex-col md:flex-row h-full relative z-20 isolate">

                    {/* LEFT PANEL: PRIMARY INPUTS - High Z-Index to keep dropdowns above other content */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex-1 p-8 space-y-8 relative z-50"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-900/20 border border-emerald-500/20">
                                <Receipt className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-white tracking-tight">New Receipt</DialogTitle>
                                <DialogDescription className="text-neutral-500 text-xs font-medium">Record inbound payment with precision</DialogDescription>
                            </div>
                        </div>

                        <form id="receipt-form" onSubmit={handleSubmit} className="space-y-10">
                            {/* Payer Selection */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.4 }}
                                className="space-y-4 relative z-10"
                            >
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <User className="h-3 w-3 text-indigo-500" /> Received From
                                </label>
                                <SearchableSelect
                                    value={partnerId}
                                    onChange={handlePartnerChange}
                                    onSearch={async (q) => searchPatients(q)}
                                    placeholder="Search Patient..."
                                    className="w-full bg-white/5 border-white/5 rounded-xl text-base hover:border-white/10 focus-within:border-emerald-500/50 transition-all shadow-2xl"
                                    isDark
                                />
                            </motion.div>

                            {/* Outstanding Invoices Section */}
                            <AnimatePresence>
                                {partnerId && (invoices.length > 0 || isFetchingInvoices) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <FileText className="h-3 w-3 text-amber-500" /> Outstanding Bills
                                            </label>
                                            {invoices.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const firstId = invoices[0].id;
                                                        const remaining = Number(amount) || 0;
                                                        if (remaining > 0) handleAllocationChange(firstId, remaining.toString());
                                                    }}
                                                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                                                >
                                                    Auto-Allocate (FIFO)
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                            {isFetchingInvoices ? (
                                                <div className="py-8 flex flex-col items-center justify-center gap-2 text-neutral-600">
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    <span className="text-[10px] uppercase font-bold tracking-widest">Scanning Ledgers...</span>
                                                </div>
                                            ) : (
                                                invoices.map((inv) => (
                                                    <div key={inv.id} className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl p-4 transition-all flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-white tracking-tight">{inv.number}</span>
                                                            <span className="text-[10px] text-neutral-500 font-medium">Outstanding: {currencySymbol}{inv.outstanding.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-500/50">{currencySymbol}</span>
                                                                <input
                                                                    type="number"
                                                                    value={allocations[inv.id] || ''}
                                                                    placeholder="0"
                                                                    onChange={(e) => handleAllocationChange(inv.id, e.target.value)}
                                                                    className="w-28 pl-7 pr-3 py-2 bg-black/40 border border-white/5 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all text-right font-mono"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAllocationChange(inv.id, inv.outstanding.toString())}
                                                                className="h-9 w-9 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                                                                title="Pay Full"
                                                            >
                                                                <ArrowRight className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Amount - HERO */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 100 }}
                                className="space-y-4 relative z-10"
                            >
                                <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    Total Amount
                                </label>
                                <div className="relative group/amount">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 font-bold text-4xl select-none">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-16 pr-8 py-8 bg-white/[0.03] border border-white/5 rounded-[2rem] text-5xl font-black text-white placeholder:text-white/5 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.07] transition-all font-mono tracking-tighter shadow-3xl"
                                        autoFocus
                                    />
                                    {/* Subtle Dynamic Glow */}
                                    <div className="absolute -inset-0.5 rounded-[2rem] bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 opacity-0 group-focus-within/amount:opacity-100 blur transition-opacity -z-10" />
                                </div>
                            </motion.div>
                        </form>
                    </motion.div>

                    {/* RIGHT PANEL: DETAILS (Glassmorphism Restored) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-full md:w-[380px] bg-white/[0.02] border-l border-white/5 p-8 flex flex-col justify-between backdrop-blur-3xl relative z-0"
                    >
                        <div className="space-y-8">
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                                <span className="h-px w-4 bg-white/20" />
                                Transaction Intel
                            </h3>

                            {/* Date */}
                            <div className="space-y-3">
                                <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Transaction Date</label>
                                <div className="relative group/field">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 group-focus-within/field:text-emerald-500 transition-colors" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-neutral-300 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            {/* Method */}
                            <div className="space-y-4">
                                <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Payout Vector</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['cash', 'upi', 'card', 'bank'].map((m, idx) => (
                                        <motion.button
                                            key={m}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={() => setMethod(m)}
                                            className={cn(
                                                "px-4 py-3 rounded-xl text-[11px] font-bold border transition-all capitalize flex items-center justify-center gap-2 shadow-sm",
                                                method === m
                                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 ring-1 ring-emerald-500/20"
                                                    : "bg-white/5 border-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300"
                                            )}
                                        >
                                            {method === m && <motion.span layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
                                            {m}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Reference */}
                            <div className="space-y-3">
                                <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Reference Token</label>
                                <div className="relative group/field">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 group-focus-within/field:text-indigo-400 transition-colors" />
                                    <input
                                        type="text"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        placeholder="TXN ID / REF..."
                                        className="w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-neutral-300 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all placeholder:text-neutral-700 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Memo */}
                            <div className="space-y-3">
                                <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Internal Notes</label>
                                <textarea
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    placeholder="Add context to this transaction..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-neutral-300 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all placeholder:text-neutral-700 resize-none leading-relaxed"
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-10 pt-8 border-t border-white/5 flex gap-4">
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                                className="flex-1 py-4 px-4 rounded-2xl border border-white/5 text-neutral-500 hover:bg-white/5 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                            >
                                Reject
                            </button>
                            <button
                                type="submit"
                                form="receipt-form"
                                disabled={isSubmitting}
                                className={cn(
                                    "flex-[2.5] py-4 px-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.15em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]",
                                    isSubmitting
                                        ? "bg-neutral-800 cursor-not-allowed text-neutral-500"
                                        : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20 hover:shadow-emerald-500/40 border border-emerald-400/20"
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Confirm Receipt</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </DialogContent>
        </Dialog>

    );
}
