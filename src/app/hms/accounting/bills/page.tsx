"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Search, Filter, ArrowUpRight,
    MoreHorizontal, Download, FileText,
    Clock, CheckCircle2, AlertCircle,
    ChevronRight, LayoutGrid, List,
    Calendar, User, Receipt, Eye, Trash2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

import { getPurchaseInvoices } from "@/app/actions/accounting/bills";
import { useLocalization } from "@/contexts/localization-context";

export default function PurchaseBillsPage() {
    const { currencySymbol } = useLocalization();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [bills, setBills] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    useEffect(() => {
        const fetchBills = async () => {
            try {
                const data = await getPurchaseInvoices();
                setBills(data);
            } catch (error) {
                toast.error("Failed to load bills");
            } finally {
                setLoading(false);
            }
        };
        fetchBills();
    }, []);

    const getStatusBadge = (status: string) => {
        const { currencySymbol } = useLocalization();
        switch (status?.toLowerCase()) {
            case 'posted':
                return <Badge className="bg-green-500/10 text-green-400 border-green-500/20 px-3 py-1">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Posted
                </Badge>;
            case 'draft':
                return <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20 px-3 py-1">
                    <Clock className="w-3 h-3 mr-1" /> Draft
                </Badge>;
            case 'cancelled':
                return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1">
                    <AlertCircle className="w-3 h-3 mr-1" /> Cancelled
                </Badge>;
            default:
                return <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1">
                    {status}
                </Badge>;
        }
    };

    const filteredBills = bills.filter(bill =>
        bill.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.supplier_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto min-h-screen">
            {/* Header section with Glassmorphism */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                        Vendor Bills
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-indigo-400" />
                        Manage your purchase invoices and supplier payments.
                    </p>
                    <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md w-fit">
                        <span className="text-[10px] text-indigo-400 font-medium">💡 Tip: Bills are auto-created when you add stock in <Link href="/hms/purchasing/receipts" className="underline hover:text-indigo-300">Purchase Receipts</Link></span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search bills..."
                            className="w-64 bg-white/5 border-white/10 pr-10 focus:ring-indigo-500/20 transition-all group-hover:bg-white/10"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    </div>

                    <div className="flex items-center p-1 bg-white/5 border border-white/10 rounded-lg">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('list')}
                            className={`w-8 h-8 ${viewMode === 'list' ? 'bg-white/10 text-indigo-400' : 'text-white/40'}`}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('grid')}
                            className={`w-8 h-8 ${viewMode === 'grid' ? 'bg-white/10 text-indigo-400' : 'text-white/40'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                    </div>

                    <Link href="/hms/accounting/bills/new">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 px-6">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Bill
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: "Total Outstanding", value: "${currencySymbol}4,25,000", delta: "+12%", color: "indigo" },
                    { label: "Pending Approval", value: "12 Bills", delta: "Updated now", color: "purple" },
                    { label: "Monthly Purchases", value: "${currencySymbol}1,82,400", delta: "-5%", color: "blue" }
                ].map((stat, i) => (
                    <Card key={i} className="bg-black/40 border-white/10 backdrop-blur-md overflow-hidden relative group">
                        <div className={`absolute top-0 left-0 w-1 h-full bg-${stat.color}-500 opacity-50 group-hover:opacity-100 transition-all`} />
                        <CardContent className="p-6">
                            <p className="text-xs font-medium text-white/40 uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-3xl font-bold mt-2 text-white/90">{stat.value}</h3>
                            <div className="flex items-center gap-2 mt-4">
                                <span className={`text-xs px-2 py-0.5 rounded-full bg-${stat.color}-500/10 text-${stat.color}-400 font-medium`}>
                                    {stat.delta}
                                </span>
                                <span className="text-[10px] text-white/20 uppercase tracking-tighter">vs last month</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content: List or Grid */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 gap-4"
                    >
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full animate-spin border-t-indigo-500" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <Receipt className="w-6 h-6 text-indigo-400" />
                            </div>
                        </div>
                        <p className="text-white/40 font-medium tracking-wide">Fetching Vendor Bills...</p>
                    </motion.div>
                ) : filteredBills.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20 bg-black/20 border border-white/5 border-dashed rounded-3xl"
                    >
                        <div className="bg-white/5 p-6 rounded-full mb-6">
                            <FileText className="w-12 h-12 text-white/20" />
                        </div>
                        <h3 className="text-xl font-semibold text-white/60 mb-2">No Bills found</h3>
                        <p className="text-white/30 mb-8 max-w-xs text-center">
                            Start by creating your first vendor bill or use the AI scanner to import from a PDF.
                        </p>
                        <Link href="/hms/accounting/bills/new">
                            <Button variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
                                Create New Bill
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
                    >
                        {filteredBills.map((bill, idx) => (
                            <motion.div
                                key={bill.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                {viewMode === 'grid' ? (
                                    <Card className="bg-black/40 border-white/10 backdrop-blur-xl group hover:border-indigo-500/30 transition-all overflow-hidden h-full flex flex-col">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-white/5">
                                            <div className="space-y-1">
                                                <p className="text-xs font-mono text-white/40">{bill.name}</p>
                                                <CardTitle className="text-lg text-white/90">{currencySymbol}{Number(bill.total_amount).toLocaleString()}</CardTitle>
                                            </div>
                                            {getStatusBadge(bill.status)}
                                        </CardHeader>
                                        <CardContent className="p-6 flex-grow flex flex-col justify-between space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm text-white/60">
                                                    <User className="w-4 h-4 text-indigo-400" />
                                                    {bill.hms_supplier?.name || "Global Medical Supplies"}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-white/40">
                                                    <Calendar className="w-4 h-4" />
                                                    Posted: {new Date(bill.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                                <Button variant="ghost" size="sm" className="text-xs text-white/40 hover:text-white group">
                                                    View Details <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="icon" className="w-8 h-8 text-white/20 hover:text-indigo-400">
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="bg-black/40 border border-white/10 backdrop-blur-xl rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-500/30 transition-all hover:translate-x-1">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                                                <FileText className="w-6 h-6 text-white/20 group-hover:text-indigo-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-bold text-white/90">{bill.name}</h4>
                                                    {getStatusBadge(bill.status)}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-white/40">
                                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {bill.hms_supplier?.name || "Global Medical Supplies"}</span>
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {bill.due_date ? new Date(bill.due_date).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-white">{currencySymbol}{Number(bill.total_amount).toLocaleString()}</p>
                                                <p className="text-[10px] uppercase tracking-widest text-white/20 font-medium">Auto-Allocated</p>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-white/20 hover:text-white">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                                                    <DropdownMenuItem className="focus:bg-white/5 gap-2">
                                                        <Eye className="w-4 h-4" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="focus:bg-white/5 gap-2">
                                                        <Download className="w-4 h-4" /> Download PDF
                                                    </DropdownMenuItem>
                                                    <Separator className="bg-white/5 my-1" />
                                                    <DropdownMenuItem className="focus:bg-red-500/10 text-red-400 gap-2">
                                                        <Trash2 className="w-4 h-4" /> Cancel Bill
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer with branding */}
            <footer className="flex items-center justify-between pt-12 border-t border-white/5 text-white/20 text-[10px] uppercase tracking-[0.2em]">
                <div className="flex items-center gap-6">
                    <span className="hover:text-white transition-colors cursor-pointer">Security Protocol AES-256</span>
                    <span className="hover:text-white transition-colors cursor-pointer">Compliance Ready</span>
                </div>
                <div className="font-mono">
                    HMS.ERP.ACCOUNTING.BILLS.SUBSYSTEM.REVISION_7
                </div>
            </footer>
        </div>
    );
}
