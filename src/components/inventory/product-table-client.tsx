'use client';
import { useLocalization } from '@/contexts/localization-context';

import { useState, useTransition } from "react"
import Link from "next/link"
import { Package, TrendingUp, TrendingDown, Layers, Check, X, ShieldCheck, ChevronRight, Pencil, Trash2, MousePointerClick, Settings2, Trash, MapPin } from "lucide-react"
import { EditProductModal } from "./edit-product-modal"
import { BulkEditModal } from "./bulk-edit-modal"
import { deleteProduct } from "@/app/actions/inventory"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface ProductTableClientProps {
    products: any[];
    meta: any;
    session: any;
    suppliers: any[];
    taxRates: any[];
    uoms: any[];
    categories: any[];
    manufacturers: any[];
    uomCategories: any[];
    storageLocations?: any[];
    query?: string;
    currentPage: number;
}

export function ProductTableClient({
    products,
    meta,
    session,
    suppliers,
    taxRates,
    uoms,
    categories,
    manufacturers,
    uomCategories,
    query,
    currentPage
}: ProductTableClientProps) {
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Multi-select logic with strict unique ID validation
    const validProductIds: string[] = (products || []).map(p => p.id).filter(Boolean);
    const isAllSelected = validProductIds.length > 0 && validProductIds.every(id => selectedIds.includes(id));
    const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

    const toggleAll = () => {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(validProductIds);
        }
    };

    const toggleOne = (id: string) => {
        if (!id) return;
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const user = session?.user as any;
    const isAdmin = user?.isAdmin || user?.isTenantAdmin || user?.isPlatformAdmin || user?.role?.toLowerCase() === 'admin';

    const handleDelete = async (product: any) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete "${product.name}"? This action cannot be undone and will only succeed if there are zero transactions.`)) return;

        const res = await deleteProduct(product.id);
        if (res.success) {
            toast.success("Product Deleted Successfully");
            startTransition(() => {
                router.refresh();
            });
        } else {
            toast.error("Deletion Blocked", { description: res.error });
        }
    };

    const { currencySymbol: locCurrency } = useLocalization();
    const rawCurrency = meta?.currencySymbol || session?.user?.currencySymbol || locCurrency;
    const currencySymbol = (rawCurrency && (rawCurrency.includes('Γé╣') || rawCurrency.length > 3)) ? locCurrency : (rawCurrency || locCurrency);

    return (
        <div className="space-y-4 relative">
            {/* Syncing Overlay */}
            {isPending && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[2px] rounded-2xl animate-in fade-in duration-200">
                    <div className="bg-white/90 shadow-xl border border-indigo-100 px-6 py-4 rounded-full flex items-center gap-3 transform -translate-y-4">
                        <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-bold text-indigo-900 tracking-widest uppercase">Updating Catalog...</span>
                    </div>
                </div>
            )}

            <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative transition-all duration-300 ${isPending ? 'opacity-50 pointer-events-none filter blur-[1px]' : 'opacity-100'}`}>
                {/* Bulk Actions Top Banner */}
                {selectedIds.length > 0 && (
                    <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2.5 flex items-center justify-between text-xs transition-all">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-indigo-600 text-white font-bold text-[11px]">
                                {selectedIds.length}
                            </span>
                            <span className="font-semibold text-slate-800">
                                {selectedIds.length === 1 ? '1 product selected' : `${selectedIds.length} products selected`}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={() => setIsBulkModalOpen(true)}
                                className="h-8 px-3.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                            >
                                <Settings2 className="h-3.5 w-3.5" />
                                Batch Categorize
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedIds([])}
                                className="h-8 px-3 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg text-xs font-medium"
                            >
                                Clear Selection
                            </Button>
                        </div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">
                                <th className="p-4 w-12 text-center group/all pointer-events-auto">
                                    <Checkbox
                                        checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                                        onCheckedChange={toggleAll}
                                        className="h-4 w-4 border-slate-300 dark:border-white/20 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 transition-all shadow-xs"
                                    />
                                    <span className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover/all:opacity-100 transition-opacity bg-slate-900 text-white px-2 py-1 rounded text-[8px] whitespace-nowrap z-50">Select All Products</span>
                                </th>
                                <th className="p-4 flex items-center gap-2">
                                    <span>Product Info</span>
                                    {selectedIds.length === 0 && (
                                        <span className="ml-3 normal-case tracking-normal text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                            <MousePointerClick className="h-3 w-3" />
                                            Click checkboxes to select items
                                        </span>
                                    )}
                                </th>
                                <th className="p-4">Brand</th>
                                <th className="p-4">SKU / Code</th>
                                <th className="p-4">UOM</th>
                                <th className="p-4 w-48">Stock Level</th>
                                <th className="p-4">Tax</th>
                                <th className="p-4">Price</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {!products || products.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-gray-50 rounded-full">
                                                <Package className="h-8 w-8 opacity-40" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest italic opacity-60">No products found in catalog</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product: any) => (
                                    <tr
                                        key={product.id}
                                        className={`hover:bg-indigo-50/10 transition-all group ${selectedIds.includes(product.id) ? 'bg-indigo-50/30' : ''}`}
                                    >
                                        <td className="p-4 text-center">
                                            <Checkbox
                                                checked={selectedIds.includes(product.id)}
                                                onCheckedChange={() => toggleOne(product.id)}
                                                className="h-5 w-5 border-slate-300 dark:border-white/10 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-[10px] border border-transparent group-hover:border-indigo-200 transition-all">
                                                    {(product.name || '??').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <button
                                                            onClick={() => setEditingProduct(product)}
                                                            className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors text-left text-sm tracking-tight"
                                                        >
                                                            {product.name || 'Unnamed Product'}
                                                        </button>
                                                        {product.drugSchedule && product.drugSchedule !== 'General' && (
                                                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border ${
                                                                product.drugSchedule.includes('Schedule X') ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                product.drugSchedule.includes('Schedule H') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                'bg-purple-50 text-purple-700 border-purple-200'
                                                            }`}>
                                                                {product.drugSchedule}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                        {product.composition && (
                                                            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                                                <span className="text-[9px] uppercase font-bold text-slate-400">Gen:</span> {product.composition}
                                                            </span>
                                                        )}
                                                        {product.is_service && <span className="text-[8px] bg-amber-50 text-amber-600 px-1 rounded font-black uppercase tracking-widest border border-amber-100">Service</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-black text-slate-600 uppercase tracking-tighter">{product.brand || 'No Vendor'}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1.5">
                                                <span className="font-black text-[10px] text-indigo-500 font-mono bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 uppercase italic tracking-widest block w-max">{product.sku}</span>
                                                {(product.storageLocation || product.locZone || product.rack || product.locRack || product.shelf || product.locShelf || product.bin) ? (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200/80 dark:border-emerald-800/40 w-max shadow-xs">
                                                            <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                                                            <span className="truncate max-w-[200px]">
                                                                {product.storageLocation || product.locZone || 'Store'}
                                                                {(product.rack || product.locRack) && ` › R:${product.rack || product.locRack}`}
                                                                {(product.shelf || product.locShelf) && ` › S:${product.shelf || product.locShelf}`}
                                                                {product.bin && ` › B:${product.bin}`}
                                                            </span>
                                                        </div>
                                                        {product.storageCondition && product.storageCondition !== 'Room Temperature' && (
                                                            <div className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 flex items-center gap-1 w-max">
                                                                <span>❄️</span> {product.storageCondition}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 italic block">📍 Unassigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono uppercase tracking-widest">{product.uom}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-[10px]">
                                                    <span className={`font-black uppercase tracking-widest ${product.stockStatus === 'Low Stock' || product.totalStock === 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                                        {product.totalStock} {product.uom}
                                                    </span>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest scale-90 ${product.totalStock > 0 ? 'text-emerald-500' : 'text-rose-400'}`}>{product.stockStatus === 'In Stock' ? 'In Stock' : product.stockStatus}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${product.totalStock === 0 ? 'bg-slate-300' :
                                                            product.totalStock < 10 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500'
                                                            }`}
                                                        style={{ width: `${Math.min((Number(product.totalStock) / 50) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                {product.taxRateId ? taxRates.find(t => t.id === product.taxRateId)?.name || 'Unknown Tax' : 'No Tax'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-black text-slate-900 font-mono">{currencySymbol}{Number(product.price).toFixed(2)}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditingProduct(product)}
                                                    className="h-8 px-4 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 shadow-sm transition-all flex items-center gap-2"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                    Edit
                                                </button>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleDelete(product)}
                                                        className="h-8 px-3 bg-white border-2 border-slate-100 rounded-xl text-slate-400 hover:border-rose-600 hover:text-rose-600 shadow-sm transition-all flex items-center justify-center"
                                                        title="Delete Product (Admin Only)"
                                                    >
                                                        <Trash className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {meta && meta.totalPages > 1 && (
                    <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-slate-50/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {meta.page} of {meta.totalPages} • {meta.total?.toLocaleString() || 0} Total Products</p>
                        <div className="flex gap-2">
                            <Link
                                href={currentPage > 1 ? `?page=${currentPage - 1}&query=${query || ''}` : '#'}
                                className={`h-8 px-6 flex items-center font-black uppercase text-[9px] tracking-widest border-2 rounded-xl transition-all ${currentPage <= 1 ? 'opacity-30 pointer-events-none' : 'border-slate-200 hover:border-slate-400'}`}
                            >
                                Previous Page
                            </Link>
                            <Link
                                href={currentPage < meta.totalPages ? `?page=${currentPage + 1}&query=${query || ''}` : '#'}
                                className={`h-8 px-6 flex items-center bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest rounded-xl transition-all ${currentPage >= meta.totalPages ? 'opacity-30 pointer-events-none' : 'hover:bg-indigo-600'}`}
                            >
                                Next Page
                            </Link>
                        </div>
                    </div>
                )}

                {/* FLOATING ACTION DOCK */}
                <AnimatePresence mode="wait">
                    {selectedIds.length > 0 && !isBulkModalOpen && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="fixed bottom-6 right-8 z-[100] pointer-events-none"
                        >
                            <div className="bg-slate-900 text-white border border-slate-700 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 pointer-events-auto backdrop-blur-xl">
                                <div className="flex items-center gap-2.5 pr-4 border-r border-slate-700">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span className="text-xs font-bold text-slate-200">
                                        {selectedIds.length} Product{selectedIds.length > 1 ? "s" : ""} Selected
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => setIsBulkModalOpen(true)}
                                        className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                                    >
                                        <Settings2 className="h-3.5 w-3.5" />
                                        Batch Categorize
                                    </Button>
                                    <button
                                        onClick={() => setSelectedIds([])}
                                        className="h-8 w-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center"
                                        title="Clear selection"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {editingProduct && (
                <EditProductModal
                    isOpen={!!editingProduct}
                    onClose={() => setEditingProduct(null)}
                    product={editingProduct}
                    suppliers={suppliers}
                    taxRates={taxRates}
                    uoms={uoms}
                    categories={categories}
                    manufacturers={manufacturers}
                    uomCategories={uomCategories}
                    batches={editingProduct.batches || []}
                    onSuccess={() => {
                        setEditingProduct(null);
                        startTransition(() => {
                            router.refresh();
                        });
                    }}
                />
            )}

            {isBulkModalOpen && (
                <BulkEditModal
                    isOpen={isBulkModalOpen}
                    onClose={() => setIsBulkModalOpen(false)}
                    selectedIds={selectedIds}
                    categories={categories}
                    onSuccess={() => {
                        setIsBulkModalOpen(false);
                        setSelectedIds([]);
                        startTransition(() => {
                            router.refresh();
                        });
                    }}
                />
            )}
        </div>
    )
}
