'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, RotateCcw, AlertCircle, Package, ArrowLeftRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPurchaseReturn } from '@/app/actions/returns';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from "@/contexts/localization-context";

type ReturnItem = {
    receiptLineId: string;
    productId: string;
    productName: string;
    availableQty: number;
    returnQty: number;
    unitPrice: number;
    batchNo?: string;
    batchId?: string;
};

interface PurchaseReturnDialogProps {
    isOpen: boolean;
    onClose: () => void;
    receiptId: string;
    supplierId: string;
    supplierName: string;
    initialItems: ReturnItem[];
    onSuccess?: () => void;
}

export function PurchaseReturnDialog({
    isOpen,
    onClose,
    receiptId,
    supplierId,
    supplierName,
    initialItems,
    onSuccess
}: PurchaseReturnDialogProps) {
    const { currencySymbol } = useLocalization();

    const [items, setItems] = useState<ReturnItem[]>([]);
    const [reason, setReason] = useState('Damaged / Defective');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setItems(initialItems.map(i => ({ ...i, returnQty: 0 })));
        }
    }, [isOpen, initialItems]);

    const totalReturnAmount = items.reduce((sum, item) => sum + (item.returnQty * item.unitPrice), 0);

    const handleSubmit = async () => {
        const itemsToReturn = items.filter(i => i.returnQty > 0);
        if (itemsToReturn.length === 0) {
            toast.error("No items", { description: "Please enter return quantity for at least one item." });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await createPurchaseReturn({
                receiptId,
                supplierId,
                reason,
                items: itemsToReturn.map(i => ({
                    receiptLineId: i.receiptLineId,
                    productId: i.productId,
                    qtyToReturn: i.returnQty,
                    unitPrice: i.unitPrice,
                    batchId: i.batchId,
                    batchNo: i.batchNo
                }))
            });

            if (res.error) {
                toast.error("Error", { description: res.error });
            } else {
                toast.success("Return Recorded", { description: `Debit Note generated successfully.` });
                onSuccess?.();
                onClose();
            }
        } catch (err) {
            toast.error("Error", { description: "Failed to process return." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-2xl rounded-2xl">
                <DialogHeader className="px-8 py-6 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                            <ArrowLeftRight className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">Return to Vendor (Debit Note)</DialogTitle>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-black mt-1">
                                Supplier: <span className="text-foreground">{supplierName}</span>
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-8 flex-1 overflow-hidden flex flex-col">
                    <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Reason for Return</Label>
                        <Input
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="e.g., Short expiry, damaged goods, incorrect item..."
                            className="h-12 bg-background border-border text-foreground font-medium rounded-xl focus:ring-red-500/20 focus:border-red-500/50"
                        />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 bg-muted/20 border border-border rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <div className="col-span-6">Product Details</div>
                            <div className="col-span-2 text-right">Stocked</div>
                            <div className="col-span-2 text-center">Return Qty</div>
                            <div className="col-span-2 text-right">Value</div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="divide-y divide-border/50">
                                {items.map((item, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={item.receiptLineId}
                                        className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-muted/30 transition-colors group"
                                    >
                                        <div className="col-span-6 flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                                                <Package className="h-5 w-5 text-muted-foreground group-hover:text-red-400 transition-colors" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-foreground truncate">{item.productName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {item.batchNo && (
                                                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                                                            BATCH: {item.batchNo}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground">{currencySymbol}{item.unitPrice.toFixed(2)} / unit</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-2 text-right">
                                            <p className="text-sm font-bold text-foreground">{item.availableQty}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Received</p>
                                        </div>

                                        <div className="col-span-2 flex justify-center px-2">
                                            <div className="relative group/input w-24">
                                                <Input
                                                    type="number"
                                                    value={item.returnQty || ''}
                                                    onChange={e => {
                                                        const val = Math.min(item.availableQty, Math.max(0, parseFloat(e.target.value) || 0));
                                                        const n = [...items];
                                                        n[idx].returnQty = val;
                                                        setItems(n);
                                                    }}
                                                    className="h-10 text-center font-bold bg-background border-border group-hover/input:border-red-500/50 transition-all rounded-lg"
                                                />
                                                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-500 scale-x-0 group-hover/input:scale-x-100 transition-transform duration-300 rounded-full" />
                                            </div>
                                        </div>

                                        <div className="col-span-2 text-right">
                                            <p className="text-sm font-bold text-foreground">{currencySymbol}{(item.returnQty * item.unitPrice).toFixed(2)}</p>
                                            <p className="text-[10px] text-red-500/70 font-black uppercase tracking-tighter">Debit Amt</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Summary Footer */}
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-500/10 p-2 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                            </div>
                            <p className="text-sm font-medium text-red-700/80 max-w-sm">
                                Recording this return will deduct stock from inventory and generate a Debit Note for the supplier.
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">Total Return Value</p>
                            <p className="text-2xl font-black text-red-600">{currencySymbol}{totalReturnAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-8 py-6 border-t border-border bg-muted/30 gap-3">
                    <Button variant="ghost" onClick={onClose} className="h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-background">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || totalReturnAmount === 0}
                        className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-500/20 bg-red-600 hover:bg-red-700 text-white flex gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Record Return & Post Debit Note
                                <ArrowLeftRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
