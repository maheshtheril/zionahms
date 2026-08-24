'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { scanInvoiceAction } from '@/app/actions/scan-invoice';
import { createPurchaseOrder, searchSuppliers, createSupplierQuick, searchProducts, getCompanyDefaults } from '@/app/actions/purchase';
import { Loader2, Sparkles, Plus, Trash2, Calendar, Save, ArrowLeft, ArrowUpRight, Search, CheckCircle2 } from 'lucide-react';
import { SearchableSelect, type Option } from '@/components/ui/searchable-select';
import { toast } from "sonner";
import { Toaster } from '@/components/ui/toaster';
import { useLocalization } from "@/contexts/localization-context";

export default function NewPurchaseOrderPage() {
    const { currencySymbol } = useLocalization();
    const router = useRouter();
    const { toast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [supplierId, setSupplierId] = useState<string | null>(null);
    const [supplierName, setSupplierName] = useState('');
    const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedDate, setExpectedDate] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [items, setItems] = useState<any[]>([]);
    const [notes, setNotes] = useState('');
    const [reference, setReference] = useState('');

    useEffect(() => {
        getCompanyDefaults().then(defaults => {
            if (defaults.currency) setCurrency(defaults.currency);
        });
        setItems([{ productId: '', productName: '', qty: 1, uom: 'PCS', unitPrice: 0, taxRate: 0 }]);
    }, []);

    const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await scanInvoiceAction(formData);
            if (result.error) {
                toast.error("Scan Failed", { description: result.error });
            } else if (result.success && result.data) {
                const { data } = result;
                if (data.supplierId) {
                    setSupplierId(data.supplierId);
                    setSupplierName(data.supplierName || '');
                } else if (data.supplierName) {
                    setSupplierName(data.supplierName);
                }
                if (data.date) setPoDate(data.date);
                if (data.currency) setCurrency(data.currency);
                if (data.items && Array.isArray(data.items)) {
                    setItems(data.items.map((item: any) => ({
                        productId: item.productId || '',
                        productName: item.productName || item.name,
                        qty: item.qty || 1,
                        uom: item.uom || 'PCS', // â† Extract UOM from scan
                        unitPrice: item.unitPrice || 0,
                        taxRate: item.taxRate || 0, // â† Capture Tax from scan
                        sku: item.sku || ''
                    })));
                } else if (items.length === 0) {
                    setItems([{ productId: '', productName: '', qty: 1, uom: 'PCS', unitPrice: 0, taxRate: 0 }]);
                }
                toast.success("Invoice Processed", { description: "Data auto-filled from document." });
            }
        } catch (error) {
            toast.error("Error", { description: "Could not process invoice." });
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const validItems = items.filter(i => i.qty > 0 && i.unitPrice >= 0 && i.productId);

        if (!supplierId) {
            toast.error("Required", { description: "Please select a supplier." });
            setIsSubmitting(false);
            return;
        }

        const payload = {
            supplierId,
            date: new Date(poDate),
            expectedDate: expectedDate ? new Date(expectedDate) : undefined,
            currency,
            notes,
            reference,
            items: validItems.map(item => ({
                productId: item.productId,
                qty: Number(item.qty),
                uom: item.uom || 'PCS',
                unitPrice: Number(item.unitPrice),
                taxRate: Number(item.taxRate || 0)
            }))
        };

        const res = await createPurchaseOrder(payload);
        if (res.error) {
            toast.error("Error", { description: res.error });
        } else {
            toast.success("Success", { description: "Purchase Order created." });
            setTimeout(() => router.push('/hms/purchasing/orders'), 500);
        }
        setIsSubmitting(false);
    };

    const addItem = () => setItems([...items, { productId: '', productName: '', qty: 1, uom: 'PCS', unitPrice: 0, taxRate: 0 }]);
    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };
    const handleProductSelect = (index: number, id: string | null, option?: Option | null) => {
        const newItems = [...items];
        if (option) {
            newItems[index] = {
                ...newItems[index],
                productId: id,
                productName: option.label,
                unitPrice: option.price || newItems[index].unitPrice,
                taxRate: option.taxRate || newItems[index].taxRate || 0
            };
        } else {
            newItems[index] = { ...newItems[index], productId: '', productName: '', unitPrice: 0, taxRate: 0 };
        }
        setItems(newItems);
    };

    const subtotal = items.reduce((acc, item) => acc + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0);
    const taxTotal = items.reduce((acc, item) => acc + ((Number(item.qty || 0) * Number(item.unitPrice || 0)) * (Number(item.taxRate || 0) / 100)), 0);
    const grandTotal = subtotal + taxTotal;

    return (
        <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30 selection:text-indigo-200 font-sans">
            <Toaster />

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-neutral-950/80 backdrop-blur-md">
                <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="text-neutral-400 hover:text-white transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="h-6 w-px bg-white/10 mx-2"></div>
                        <h1 className="text-sm font-medium tracking-wide text-neutral-200">New Purchase Order</h1>
                    </div>
                    <div className="flex gap-4">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleScan} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20"
                        >
                            {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                            AI Auto-Fill
                        </button>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-40 max-w-[1600px] mx-auto px-8">
                <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-12">

                    {/* Left Panel: Context */}
                    <div className="col-span-12 lg:col-span-4 space-y-8">
                        {/* Supplier Card */}
                        <div className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-white/10 transition-colors group">
                            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4 block">Supplier</label>
                            <SearchableSelect
                                value={supplierId}
                                onChange={(id, opt) => { setSupplierId(id); setSupplierName(opt?.label || ''); }}
                                onSearch={searchSuppliers}
                                onCreate={async (name) => await createSupplierQuick(name)}
                                placeholder="Select Vendor..."
                                className="w-full bg-transparent border-none text-xl font-medium placeholder:text-neutral-700 p-0 focus:ring-0"
                                variant="ghost"
                            />
                            <div className="h-px w-full bg-neutral-800 mt-2 group-focus-within:bg-indigo-500 transition-colors duration-500"></div>
                        </div>

                        {/* PO Info Card */}
                        <div className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">PO Number</label>
                                <div className="text-sm font-medium text-neutral-400 font-mono">
                                    PO-AUTO-GENERATED
                                </div>
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider group-focus-within:text-indigo-400 transition-colors">Reference / Quote #</label>
                                <input
                                    type="text"
                                    className="w-full bg-transparent border-b border-neutral-800 focus:border-indigo-500 p-0 pb-2 text-sm font-medium text-neutral-200 focus:ring-0 transition-colors placeholder:text-neutral-700"
                                    placeholder="e.g. Q-99281"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/5 space-y-2">
                                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</label>
                                <input
                                    type="date"
                                    value={poDate}
                                    onChange={(e) => setPoDate(e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-neutral-200 focus:ring-0 [color-scheme:dark]"
                                />
                            </div>
                            <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/5 space-y-2">
                                <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Delivery</label>
                                <input
                                    type="date"
                                    value={expectedDate}
                                    onChange={(e) => setExpectedDate(e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-neutral-200 focus:ring-0 [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Currency */}
                        <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/5 flex items-center justify-between">
                            <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Currency</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="bg-transparent border-none text-right text-sm font-bold text-neutral-200 focus:ring-0 cursor-pointer"
                            >
                                <option value="USD" className="bg-neutral-900">USD ($)</option>
                                <option value="EUR" className="bg-neutral-900">EUR (â‚¬)</option>
                                <option value="GBP" className="bg-neutral-900">GBP (Â£)</option>
                                <option value="INR" className="bg-neutral-900">INR ({currencySymbol})</option>
                            </select>
                        </div>
                    </div>

                    {/* Right Panel: Items */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-lg font-medium text-white">Line Items</h2>
                            <button type="button" onClick={addItem} className="text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Add Item
                            </button>
                        </div>

                        <div className="rounded-2xl border border-white/5 bg-neutral-900/30 backdrop-blur-sm">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-neutral-900/50">
                                        <th className="py-4 pl-6 pr-4 text-xs font-medium uppercase tracking-wider text-neutral-500 w-[35%]">Item</th>
                                        <th className="py-4 px-4 text-xs font-medium uppercase tracking-wider text-neutral-500 w-20 text-center">Qty</th>
                                        <th className="py-4 px-4 text-xs font-medium uppercase tracking-wider text-neutral-500 w-24 text-center">UOM</th>
                                        <th className="py-4 px-4 text-xs font-medium uppercase tracking-wider text-neutral-500 w-28 text-right">Price</th>
                                        <th className="py-4 px-4 text-xs font-medium uppercase tracking-wider text-neutral-500 w-24 text-right">Tax (%)</th>
                                        <th className="py-4 px-4 text-xs font-medium uppercase tracking-wider text-neutral-500 w-32 text-right">Total</th>
                                        <th className="w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.map((item, index) => (
                                        <tr key={index} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="py-2 pl-6 pr-4">
                                                <SearchableSelect
                                                    value={item.productId}
                                                    onChange={(id, opt) => handleProductSelect(index, id, opt)}
                                                    onSearch={searchProducts}
                                                    placeholder="Search product..."
                                                    variant="ghost"
                                                    className="w-full text-sm font-medium text-neutral-200 placeholder:text-neutral-700"
                                                />
                                            </td>
                                            <td className="py-2 px-4">
                                                <input
                                                    type="number" min="1"
                                                    value={item.qty}
                                                    onChange={(e) => updateItem(index, 'qty', e.target.value)}
                                                    className="w-full bg-transparent text-center font-mono text-sm text-neutral-300 focus:text-white outline-none placeholder:text-neutral-800"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="py-2 px-4">
                                                <select
                                                    value={item.uom || 'PCS'}
                                                    onChange={(e) => updateItem(index, 'uom', e.target.value)}
                                                    className="w-full bg-transparent text-center font-mono text-xs text-neutral-300 focus:text-white outline-none cursor-pointer"
                                                >
                                                    <option value="PCS" className="bg-neutral-900">PCS</option>
                                                    <option value="PACK-10" className="bg-neutral-900">PACK-10</option>
                                                    <option value="PACK-15" className="bg-neutral-900">PACK-15</option>
                                                    <option value="PACK-20" className="bg-neutral-900">PACK-20</option>
                                                    <option value="PACK-30" className="bg-neutral-900">PACK-30</option>
                                                    <option value="STRIP" className="bg-neutral-900">STRIP</option>
                                                    <option value="BOX" className="bg-neutral-900">BOX</option>
                                                    <option value="BOTTLE" className="bg-neutral-900">BOTTLE</option>
                                                </select>
                                            </td>
                                            <td className="py-2 px-4 text-right">
                                                <input
                                                    type="number" min="0" step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                                    className="w-full bg-transparent text-right font-mono text-sm text-neutral-300 focus:text-white outline-none placeholder:text-neutral-800"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="py-2 px-4 text-right">
                                                <select
                                                    value={item.taxRate || 0}
                                                    onChange={(e) => updateItem(index, 'taxRate', Number(e.target.value))}
                                                    className="w-full bg-transparent text-right font-mono text-sm text-neutral-300 focus:text-white outline-none cursor-pointer"
                                                >
                                                    <option value="0" className="bg-neutral-900">0%</option>
                                                    <option value="5" className="bg-neutral-900">5%</option>
                                                    <option value="12" className="bg-neutral-900">12%</option>
                                                    <option value="18" className="bg-neutral-900">18%</option>
                                                    <option value="28" className="bg-neutral-900">28%</option>
                                                </select>
                                            </td>
                                            <td className="py-2 px-4 text-right">
                                                <span className="font-mono text-sm font-medium text-neutral-400 group-hover:text-white transition-colors">
                                                    {((Number(item.qty || 0) * Number(item.unitPrice || 0)) * (1 + (Number(item.taxRate || 0) / 100))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="py-2 pr-4 text-right">
                                                <button type="button" onClick={() => removeItem(index)} className="text-neutral-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary Block */}
                        <div className="flex justify-end pt-4">
                            <div className="w-80 p-6 rounded-2xl bg-neutral-900/50 border border-white/5 space-y-4">
                                <div className="flex justify-between text-sm text-neutral-500">
                                    <span>Subtotal</span>
                                    <span className="font-mono">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm text-neutral-500">
                                    <span>Tax</span>
                                    <span className="font-mono">{taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="h-px bg-white/5"></div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-medium text-white">Total Due</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xs text-neutral-500">{currency}</span>
                                        <span className="text-2xl font-bold text-white tracking-tight">
                                            {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            {/* Bottom Bar: Primary Action - Pure linear style */}
            <div className="fixed bottom-8 left-0 w-full flex justify-center z-40 pointer-events-none">
                <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-6 pr-2 flex items-center gap-6 shadow-2xl pointer-events-auto">
                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {items.length} Items â€¢ Draft
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-white text-black hover:bg-neutral-200 transition-colors px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Save Order <CheckCircle2 className="h-4 w-4" /></>}
                    </button>
                </div>
            </div>
        </div>
    );
}
