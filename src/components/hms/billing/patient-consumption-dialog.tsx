'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { recordPatientConsumption } from '@/app/actions/billing';
import { SearchableSelect, Option } from "@/components/ui/searchable-select";
import { getBillableItems } from '@/app/actions/billing';
import { useLocalization } from "@/contexts/localization-context";

interface PatientConsumptionDialogProps {
    patientId: string;
    patientName: string;
}

export function PatientConsumptionDialog({ patientId, patientName }: PatientConsumptionDialogProps) {
    const { currencySymbol } = useLocalization();

    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    interface AddedItem {
        id: string;
        label: string;
        price: number;
        quantity: number;
    }

    interface BillableOption extends Option {
        price: number;
    }

    // State for multiple items
    const [addedItems, setAddedItems] = useState<AddedItem[]>([]);

    // Simple state for one item at a time (MVP)
    const [selectedItem, setSelectedItem] = useState<BillableOption | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState('');

    // Fetch items function for SearchableSelect
    const fetchItems = async (query: string): Promise<BillableOption[]> => {
        const res = await getBillableItems();
        if (res.success && res.data) {
            return res.data
                .filter((i: any) => i.label.toLowerCase().includes(query.toLowerCase()))
                .map((i: any) => ({
                    id: i.id,
                    label: i.label,
                    subLabel: i.description ? `${currencySymbol}${i.price} • ${i.description}` : `${currencySymbol}${i.price}`,
                    price: i.price, // Ensure this exists
                    original: i
                }));
        }
        return [];
    };

    const handleSubmit = async () => {
        // If items are in the list, use them. If not, check if one is selected in dropdown.
        let finalItemsToSubmit: { productId: string, name: string, price: number, quantity: number }[] = [];

        if (addedItems.length > 0) {
            finalItemsToSubmit = addedItems.map(i => ({
                productId: i.id,
                name: i.label,
                price: i.price,
                quantity: i.quantity
            }));
        } else if (selectedItem) {
            finalItemsToSubmit = [{
                productId: selectedItem.id,
                name: selectedItem.label,
                price: selectedItem.price,
                quantity: quantity
            }];
        }

        if (finalItemsToSubmit.length === 0) {
            toast.error("No Items", { description: "Please add items to the list." });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await recordPatientConsumption(patientId, finalItemsToSubmit, notes);

            if (res.error) {
                toast.error("Error", { description: res.error });
            } else {
                toast.success("Added to Bill", { description: `Successfully added ${finalItemsToSubmit.length} items to running bill.` });
                setIsOpen(false);
                setSelectedItem(null);
                setAddedItems([]);
                setQuantity(1);
                setNotes('');
            }
        } catch (err) {
            toast.error("Error", { description: "Failed to record consumption" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed border-gray-400 text-gray-700 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Usage
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        Record Consumption
                    </DialogTitle>
                    <p className="text-sm text-gray-500">Add medicines or services to {patientName}'s running bill.</p>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 dark:bg-zinc-800/50 dark:border-zinc-700">
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label>Search Item</Label>
                                <SearchableSelect
                                    onSearch={fetchItems}
                                    onChange={(val, opt) => setSelectedItem(opt as BillableOption || null)}
                                    value={selectedItem?.id}
                                    valueLabel={selectedItem?.label}
                                    placeholder="Search medicine, service..."
                                    className="w-full"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Quantity</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        onChange={e => setQuantity(Number(e.target.value))}
                                        className="font-bold h-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>&nbsp;</Label>
                                    <Button
                                        onClick={() => {
                                            if (selectedItem) {
                                                setAddedItems([...addedItems, { id: selectedItem.id, label: selectedItem.label, price: selectedItem.price, quantity }]);
                                                setSelectedItem(null);
                                                setQuantity(1);
                                            }
                                        }}
                                        disabled={!selectedItem || quantity < 1}
                                        className="w-full bg-slate-900 text-white hover:bg-slate-800"
                                        type="button"
                                    >
                                        Add to List
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {addedItems.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase">
                                    <tr>
                                        <th className="px-3 py-2">Item</th>
                                        <th className="px-3 py-2 w-16">Qty</th>
                                        <th className="px-3 py-2 w-16 text-right">Price</th>
                                        <th className="px-3 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {addedItems.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-gray-50">
                                            <td className="px-3 py-2">{item.label}</td>
                                            <td className="px-3 py-2 font-medium">{item.quantity}</td>
                                            <td className="px-3 py-2 text-right">{currencySymbol}{item.price * item.quantity}</td>
                                            <td className="px-3 py-2 text-right">
                                                <button
                                                    onClick={() => setAddedItems(addedItems.filter((_, i) => i !== idx))}
                                                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    &times;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-blue-50/50 font-bold border-t-2 border-blue-100">
                                        <td className="px-3 py-2 text-blue-900">Total</td>
                                        <td className="px-3 py-2 text-blue-900">{addedItems.reduce((s, i) => s + i.quantity, 0)}</td>
                                        <td className="px-3 py-2 text-right text-blue-900">
                                            {currencySymbol}{addedItems.reduce((s, i) => s + (i.price * i.quantity), 0)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Input
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="e.g. Bedside administration"
                            className="h-10"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Bill"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
