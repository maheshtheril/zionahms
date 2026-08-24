'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Box, RefreshCw, AlertCircle, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect, type Option } from "@/components/ui/searchable-select";
import { getProductsPremium, getProduct } from '@/app/actions/inventory';
import { createStockAdjustment } from '@/app/actions/returns';
import { motion, AnimatePresence } from 'framer-motion';

type AdjustmentItem = {
    productId: string;
    productName: string;
    locationId: string;
    locationName: string;
    batchId?: string;
    batchNo?: string;
    currentQty: number;
    newQty: number;
    unitCost: number;
};

export function StockAdjustmentDialog({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess?: () => void }) {

    const [items, setItems] = useState<AdjustmentItem[]>([]);
    const [reason, setReason] = useState('');
    const [reasonCode, setReasonCode] = useState('audit'); // audit, breakage, expiry, wastage
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addItem = () => {
        setItems([...items, {
            productId: '',
            productName: '',
            locationId: 'WH-MAIN', // Default or fetch
            locationName: 'Main Warehouse',
            currentQty: 0,
            newQty: 0,
            unitCost: 0
        }]);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const handleProductSelect = async (idx: number, id: string | null, opt: Option | null | undefined) => {
        if (!id) return;
        const p = await getProduct(id);
        const newItems = [...items];
        newItems[idx] = {
            ...newItems[idx],
            productId: id,
            productName: opt?.label || '',
            currentQty: Number(p?.stock_levels?.[0]?.quantity || 0),
            newQty: Number(p?.stock_levels?.[0]?.quantity || 0),
            unitCost: Number(p?.default_cost || 0),
            locationId: p?.stock_levels?.[0]?.location_id || 'WH-MAIN'
        };
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!reason) {
            toast.error("Reason Required", { description: "Please explain why you are adjusting stock." });
            return;
        }
        if (items.length === 0) {
            toast.error("No items", { description: "Add at least one product to adjust." });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await createStockAdjustment({
                reason,
                reasonCode,
                items: items.map(i => ({
                    productId: i.productId,
                    locationId: i.locationId,
                    batchId: i.batchId,
                    currentQty: i.currentQty,
                    newQty: i.newQty,
                    unitCost: i.unitCost
                }))
            });

            if (res.error) {
                toast.error("Error", { description: res.error });
            } else {
                toast.success("Stock Adjusted", { description: "Inventory and Ledger updated." });
                onSuccess?.();
                onClose();
            }
        } catch (err) {
            toast.error("Error", { description: "Failed to process adjustment." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-2xl rounded-2xl">
                <DialogHeader className="px-8 py-6 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                            <RefreshCw className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">Stock Adjustment Center</DialogTitle>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-black mt-1">Audit, Wastage, or Expiry Corrective Actions</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-8 flex-1 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adjustment Type</Label>
                            <div className="flex bg-muted/50 p-1 rounded-xl border border-border gap-1">
                                {['audit', 'breakage', 'expiry', 'wastage'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setReasonCode(type)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${reasonCode === type ? 'bg-purple-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Audit Remarks / Notes</Label>
                            <Input
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="e.g., Physical stock count mismatch, Damaged in transit..."
                                className="h-12 bg-background border-border rounded-xl focus:ring-purple-500/20"
                            />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 bg-muted/20 border border-border rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <div className="col-span-5">Select Product</div>
                            <div className="col-span-2 text-right">Current Stock</div>
                            <div className="col-span-2 text-center">New Count</div>
                            <div className="col-span-2 text-right">Difference</div>
                            <div className="col-span-1"></div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="divide-y divide-border/50">
                                <AnimatePresence initial={false}>
                                    {items.map((item, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-muted/30 transition-colors group"
                                        >
                                            <div className="col-span-5">
                                                <SearchableSelect
                                                    value={item.productId}
                                                    onChange={(id, opt) => handleProductSelect(idx, id, opt)}
                                                    onSearch={async (q) => {
                                                        const res = await getProductsPremium(q) as any;
                                                        return res?.data?.map((p: any) => ({ id: p.id, label: p.name, subLabel: p.sku }));
                                                    }}
                                                    placeholder="Search item..."
                                                    className="bg-background border-border font-bold text-sm"
                                                    variant="ghost"
                                                />
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-widest">{item.currentQty}</span>
                                            </div>
                                            <div className="col-span-2 px-2">
                                                <Input
                                                    type="number"
                                                    value={item.newQty}
                                                    onChange={e => {
                                                        const n = [...items];
                                                        n[idx].newQty = parseFloat(e.target.value) || 0;
                                                        setItems(n);
                                                    }}
                                                    className="h-10 text-center font-black bg-background border-border focus:border-purple-500/50 rounded-lg shadow-sm"
                                                />
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <span className={`text-sm font-black transition-colors ${item.newQty - item.currentQty > 0 ? 'text-emerald-500' : item.newQty - item.currentQty < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                    {item.newQty - item.currentQty > 0 ? `+${item.newQty - item.currentQty}` : item.newQty - item.currentQty}
                                                </span>
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div className="p-4 flex justify-center">
                                    <Button variant="ghost" onClick={addItem} className="text-xs font-bold uppercase tracking-widest text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex gap-2 rounded-xl h-10 px-6">
                                        <Plus className="h-4 w-4" /> Add Line Item
                                    </Button>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-500/10 p-2 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-purple-600" />
                            </div>
                            <p className="text-sm font-medium text-purple-900/70 max-w-lg">
                                Adjustments are irreversible and logged in the Stock Ledger. Financial journals will be posted to the inventory asset and adjustments expense accounts.
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-1">Impact Analysis</p>
                            <p className="text-lg font-black text-purple-800">
                                {items.filter(i => i.newQty !== i.currentQty).length} Changes Identified
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-8 py-6 border-t border-border bg-muted/30 gap-3">
                    <Button variant="ghost" onClick={onClose} className="h-12 px-8 rounded-xl font-bold uppercase tracking-widest text-xs">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || items.length === 0}
                        className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-purple-500/20 bg-purple-600 hover:bg-purple-700 text-white flex gap-2"
                    >
                        {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <>Synchronize Stock & Post Journals</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
