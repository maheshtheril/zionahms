"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Trash2, Save, FileText, ArrowLeft,
    Calendar, Calculator, ShoppingBag, Search,
    Eye, Info, AlertCircle, CheckCircle2,
    Loader2, Upload, Scan
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUpload } from "@/components/ui/file-upload";

import { upsertPurchaseInvoice } from "@/app/actions/accounting/bills";
import { scanInvoiceFromUrl } from "@/app/actions/scan-invoice";
import { getSuppliers, getProductsPremium } from "@/app/actions/inventory";
import { useLocalization } from "@/contexts/localization-context";

import { AccountingWarningBanner } from "@/components/accounting/accounting-warning-banner";

export default function NewPurchaseBillPage() {
    const { currencySymbol } = useLocalization();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Form State
    const [billData, setBillData] = useState({
        invoiceNumber: "",
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: "",
        supplierId: "",
        currency: "INR",
        items: [
            { id: crypto.randomUUID(), productId: "", description: "", qty: 1, unitPrice: 0, lineTotal: 0 }
        ],
        subtotal: 0,
        taxTotal: 0,
        totalAmount: 0,
        attachments: {} as any
    });

    // Load data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const s = await getSuppliers();
                setSuppliers(s);

                const p = await getProductsPremium();
                if (p.success) {
                    setProducts(p.data);
                }
            } catch (error) {
                console.error("Failed to load data", error);
            }
        };
        fetchData();
    }, []);

    const calculateTotals = (items: any[]) => {
        const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
        const tax = subtotal * 0.18; // Mock 18% GST for visual impact
        return {
            subtotal,
            taxTotal: tax,
            totalAmount: subtotal + tax
        };
    };

    const handleItemChange = (id: string, field: string, value: any) => {
        const newItems = billData.items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                updatedItem.lineTotal = updatedItem.qty * updatedItem.unitPrice;
                return updatedItem;
            }
            return item;
        });

        const totals = calculateTotals(newItems);
        setBillData({ ...billData, items: newItems, ...totals });
    };

    const addItem = () => {
        setBillData({
            ...billData,
            items: [...billData.items, { id: crypto.randomUUID(), productId: "", description: "", qty: 1, unitPrice: 0, lineTotal: 0 }]
        });
    };

    const removeItem = (id: string) => {
        if (billData.items.length === 1) return;
        const newItems = billData.items.filter(item => item.id !== id);
        const totals = calculateTotals(newItems);
        setBillData({ ...billData, items: newItems, ...totals });
    };

    const handleFileUpload = async (url: string) => {
        if (!url) return;
        setScanning(true);
        toast.info("Scanning invoice with AI...");

        try {
            const result = (await scanInvoiceFromUrl(url)) as any;
            if (result && result.success && result.data) {
                const d = result.data;
                // Map AI result to form
                setBillData(prev => ({
                    ...prev,
                    invoiceNumber: d.reference || prev.invoiceNumber,
                    invoiceDate: d.date || prev.invoiceDate,
                    totalAmount: d.grandTotal || prev.totalAmount,
                    supplierId: d.supplierId || prev.supplierId,
                    items: d.items?.map((li: any) => ({
                        id: crypto.randomUUID(),
                        productId: li.productId || "",
                        description: li.productName || li.description || "",
                        qty: li.qty || 1,
                        unitPrice: li.unitPrice || 0,
                        lineTotal: (li.qty || 1) * (li.unitPrice || 0)
                    })) || prev.items,
                    attachments: { url }
                }));
                toast.success("Invoice scanned successfully!");
            } else if (result && result.error) {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("AI Scanning failed. Please enter details manually.");
        } finally {
            setScanning(false);
        }
    };

    const handleSubmit = async () => {
        if (!billData.supplierId || !billData.invoiceNumber) {
            toast.error("Please fill required fields (Supplier, Bill Number)");
            return;
        }

        setLoading(true);
        try {
            const res = (await upsertPurchaseInvoice(billData)) as any;
            if (res.success) {
                toast.success("Vendor Bill Saved & Posted to GL");
                router.push("/hms/accounting/bills");
            } else {
                toast.error(res.error || "Failed to save bill");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <AccountingWarningBanner />
            {/* Header section with Glassmorphism */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to Bills</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        New Vendor Bill
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-indigo-400" />
                        Accurate bookkeeping with AI-assisted scanning and GL posting.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Bill
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-8"
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save & Post Bill
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <CardHeader className="border-b border-white/5 bg-white/5">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                Bill Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-white/60">Supplier / Vendor</Label>
                                    <Select onValueChange={(v) => setBillData({ ...billData, supplierId: v })}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-indigo-500/20">
                                            <SelectValue placeholder="Select Supplier" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                            {suppliers.map(sup => (
                                                <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/60">Bill / Invoice Number</Label>
                                    <div className="relative">
                                        <Input
                                            value={billData.invoiceNumber}
                                            onChange={(e) => setBillData({ ...billData, invoiceNumber: e.target.value })}
                                            placeholder="e.g. INV-2025-001"
                                            className="bg-white/5 border-white/10 pr-10 focus:ring-indigo-500/20"
                                        />
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/60">Bill Date</Label>
                                    <Input
                                        type="date"
                                        value={billData.invoiceDate}
                                        onChange={(e) => setBillData({ ...billData, invoiceDate: e.target.value })}
                                        className="bg-white/5 border-white/10 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/60">Due Date</Label>
                                    <Input
                                        type="date"
                                        value={billData.dueDate}
                                        onChange={(e) => setBillData({ ...billData, dueDate: e.target.value })}
                                        className="bg-white/5 border-white/10 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Line Items Table */}
                    <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                                Line Items
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={addItem} className="text-indigo-400 hover:text-indigo-300 hover:bg-white/5">
                                <Plus className="w-4 h-4 mr-1" /> Add Item
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-white/40">
                                            <th className="px-6 py-3 font-medium">Description</th>
                                            <th className="px-4 py-3 font-medium w-24">Qty</th>
                                            <th className="px-4 py-3 font-medium w-32">Unit Price</th>
                                            <th className="px-4 py-3 font-medium w-32 text-right">Total</th>
                                            <th className="px-4 py-3 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <AnimatePresence>
                                            {billData.items.map((item, idx) => (
                                                <motion.tr
                                                    key={item.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="group hover:bg-white/5 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <Input
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                            className="bg-transparent border-transparent group-hover:border-white/10 focus:bg-white/5 transition-all"
                                                            placeholder="Enter item description..."
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Input
                                                            type="number"
                                                            value={item.qty}
                                                            onChange={(e) => handleItemChange(item.id, 'qty', Number(e.target.value))}
                                                            className="bg-transparent border-transparent group-hover:border-white/10 focus:bg-white/5 transition-all"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Input
                                                            type="number"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                                                            className="bg-transparent border-transparent group-hover:border-white/10 focus:bg-white/5 transition-all text-right"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-semibold text-white/90">
                                                        {currencySymbol}{item.lineTotal.toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-white/20 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: AI Scan & Summary */}
                <div className="space-y-6">
                    {/* AI Scan Component */}
                    <Card className="border-indigo-500/20 bg-indigo-500/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                            <Scan className="w-12 h-12 text-indigo-400 rotate-12" />
                        </div>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-400">
                                <Scan className="w-5 h-5" />
                                AI Smart Scan
                            </CardTitle>
                            <CardDescription className="text-indigo-200/60">
                                Upload a PDF or Image to auto-fill the bill details using AI.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FileUpload
                                onUploadComplete={handleFileUpload}
                                className="border-dashed border-indigo-500/20 bg-black/40 hover:bg-black/60 transition-all rounded-xl p-8"
                            />
                            {scanning && (
                                <div className="flex items-center justify-center gap-3 py-4 text-indigo-400 font-medium animate-pulse">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Analyzing Document...
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary Card */}
                    <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
                        <CardHeader className="border-b border-white/5">
                            <CardTitle>Bill Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm text-white/40 font-medium">
                                    <span>Subtotal</span>
                                    <span>{currencySymbol}{billData.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-white/40">
                                    <div className="flex items-center gap-1">
                                        <span>Estimated GST (18%)</span>
                                        <Info className="w-3 h-3 cursor-help text-indigo-400" />
                                    </div>
                                    <span>{currencySymbol}{billData.taxTotal.toLocaleString()}</span>
                                </div>
                                <Separator className="bg-white/5" />
                                <div className="flex justify-between text-xl font-bold text-white pt-2">
                                    <span>Total Amount</span>
                                    <span className="text-indigo-400">{currencySymbol}{billData.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 space-y-3 border border-white/5 mt-6">
                                <h4 className="text-sm font-semibold flex items-center gap-2 text-white/80">
                                    <AlertCircle className="w-4 h-4 text-amber-500" />
                                    Accounting Impact
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/30">
                                        <span>Account</span>
                                        <span>Debit / Credit</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-white/60">Purchase Account</span>
                                        <span className="text-green-400">Dr {currencySymbol}{billData.subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-white/60">Input VAT</span>
                                        <span className="text-green-400">Dr {currencySymbol}{billData.taxTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs border-t border-white/5 pt-1">
                                        <span className="text-white/60">Accounts Payable</span>
                                        <span className="text-red-400 font-semibold">Cr {currencySymbol}{billData.totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <footer className="flex items-center justify-between pt-8 border-t border-white/5 text-white/20 text-xs">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Auto-saved</span>
                    <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Audit Log Enabled</span>
                </div>
                <div className="font-mono uppercase tracking-widest">
                    V-BILL SECURE SYSTEM v2.0
                </div>
            </footer>
        </div>
    );
}
