'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { 
    ShoppingCart, Plus, Minus, CheckCircle2, 
    ScanBarcode, CreditCard, Banknote, LayoutGrid, X, 
    Package, AlertTriangle, Calendar, ChevronRight, Layers,
    ChevronDown, Check, List
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { processPOSCheckout, POSCartItem } from '@/app/actions/pos-checkout'
import { getActivePOSPrintConfig } from '@/app/actions/print-settings'
import { useRouter } from 'next/navigation'
import { useLocalization } from "@/contexts/localization-context";

// ─── Types ─────────────────────────────────────────────────────────────────

type UomOption = {
    uom: string
    factor: number   // relative to base (base = 1)
    price: number    // basePrice × factor
}

type Batch = {
    id: string
    batchNo: string
    expiryDate: string | null
    qtyOnHand: number
    mrp: number | null
    salePrice: number | null
}

type Product = {
    id: string
    name: string
    sku: string
    price: number     // base price
    uom: string       // base UOM
    uomOptions: UomOption[]
    barcode: string | null
    category: string
    taxRate: number
    batches: Batch[]
}

// Extended cart item carries active UOM + price
type CartItem = POSCartItem & {
    basePrice: number
    uom: string
    uomOptions: UomOption[]
}

interface Props {
    products: Product[]
    availableTaxes?: { id: string, name: string, rate: number }[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatExpiry(isoDate: string | null): string {
    if (!isoDate) return 'No Expiry'
    return new Date(isoDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

function isNearExpiry(isoDate: string | null): boolean {
    if (!isoDate) return false
    const expiry = new Date(isoDate)
    const threeMonths = new Date()
    threeMonths.setMonth(threeMonths.getMonth() + 3)
    return expiry <= threeMonths
}

function isExpired(isoDate: string | null): boolean {
    if (!isoDate) return false
    return new Date(isoDate) < new Date()
}

// ─── UOM Picker ─────────────────────────────────────────────────────────────
// Shows ONLY the UOMs configured for this specific product.
// If only 1 UOM (no conversions), the badge is static (no dropdown).

function UOMPicker({
    currentUom,
    uomOptions,
    onSelect,
}: {
    currentUom: string
    uomOptions: UomOption[]
    onSelect: (opt: UomOption) => void
}) {
    const { currencySymbol } = useLocalization();
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const hasOptions = uomOptions.length > 1

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => hasOptions && setOpen(v => !v)}
                title={hasOptions ? 'Change UOM' : 'No UOM conversions configured for this product'}
                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-md px-2 py-0.5 transition-colors ${
                    hasOptions
                        ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 cursor-pointer'
                        : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 cursor-default'
                }`}
            >
                {currentUom}
                {hasOptions && <ChevronDown className="h-2.5 w-2.5" />}
            </button>

            {open && hasOptions && (
                <div className="absolute bottom-full left-0 mb-1 z-50 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-2xl p-2 min-w-[180px] animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 mb-2">
                        Select UOM
                    </p>
                    <div className="space-y-1">
                        {uomOptions.map(opt => (
                            <button
                                key={opt.uom}
                                onClick={() => { onSelect(opt); setOpen(false) }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                    currentUom === opt.uom
                                        ? 'bg-violet-600 text-white'
                                        : 'bg-slate-50 dark:bg-zinc-700 text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-400'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    {currentUom === opt.uom && <Check className="h-3 w-3" />}
                                    {opt.uom}
                                    {opt.factor !== 1 && (
                                        <span className={`text-[9px] font-semibold ${currentUom === opt.uom ? 'text-violet-200' : 'text-slate-400'}`}>
                                            ×{opt.factor}
                                        </span>
                                    )}
                                </span>
                                <span className={currentUom === opt.uom ? 'text-violet-200' : 'text-indigo-600 dark:text-indigo-400'}>
                                    {currencySymbol}{opt.price.toFixed(2)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Batch Picker Dialog ─────────────────────────────────────────────────────

function BatchPickerDialog({ 
    product, 
    onSelect, 
    onClose 
}: { 
    product: Product
    onSelect: (product: Product, batch: Batch) => void
    onClose: () => void 
}) {
    const { currencySymbol } = useLocalization();
    const validBatches = product.batches.filter(b => !isExpired(b.expiryDate))

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div 
                className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <Layers className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black leading-tight">{product.name}</h2>
                                <p className="text-indigo-200 text-sm font-medium mt-0.5">
                                    {validBatches.length} batch{validBatches.length !== 1 ? 'es' : ''} — select one to add
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                    {validBatches.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="font-semibold">No valid batches in stock</p>
                        </div>
                    ) : (
                        validBatches.map((batch, idx) => {
                            const { currencySymbol } = useLocalization();
                            const nearExpiry = isNearExpiry(batch.expiryDate)
                            const sellPrice  = batch.salePrice ?? batch.mrp ?? product.price

                            return (
                                <button
                                    key={batch.id}
                                    onClick={() => onSelect(product, batch)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all hover:scale-[1.01] active:scale-95 group ${
                                        idx === 0
                                            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-700'
                                            : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-600'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-black text-slate-900 dark:text-white text-base">
                                                    Batch: {batch.batchNo}
                                                </span>
                                                {idx === 0 && (
                                                    <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">FEFO</span>
                                                )}
                                                {nearExpiry && (
                                                    <span className="text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Near Expiry
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>Exp: <span className={`font-semibold ${nearExpiry ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {formatExpiry(batch.expiryDate)}
                                                    </span></span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                    <Package className="h-3.5 w-3.5" />
                                                    <span>Qty: <span className="font-semibold text-slate-700 dark:text-slate-300">{batch.qtyOnHand}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{currencySymbol}{sellPrice.toFixed(2)}</p>
                                            <ChevronRight className="h-5 w-5 text-slate-300 dark:text-zinc-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                </button>
                            )
                        })
                    )}
                    {product.batches.filter(b => isExpired(b.expiryDate)).length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                <AlertTriangle className="h-3 w-3" />
                                {product.batches.filter(b => isExpired(b.expiryDate)).length} expired batch(es) — not selectable
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Main POS Client ─────────────────────────────────────────────────────────

export function POSClient({ products, availableTaxes = [] }: Props) {
    const { currencySymbol } = useLocalization();
    const router = useRouter()
    const [search,          setSearch]          = useState('')
    const [activeCategory,  setActiveCategory]  = useState<string>('All')
    const [cart,            setCart]            = useState<CartItem[]>([])
    const [isCheckingOut,   setIsCheckingOut]   = useState(false)
    const [successInvoice,  setSuccessInvoice]  = useState<string | null>(null)
    const [receiptData,     setReceiptData]     = useState<{ items: CartItem[], subtotal: number, tax: number, total: number, paymentMethod: string } | null>(null)
    const [paymentMethod,   setPaymentMethod]   = useState<'cash' | 'card'>('cash')
    const [batchPickerProduct, setBatchPickerProduct] = useState<Product | null>(null)
    const [viewMode,        setViewMode]        = useState<'grid' | 'list'>('grid')
    const [focusedIndex,    setFocusedIndex]    = useState(-1)
    const [printConfig,     setPrintConfig]     = useState<any>({ source: "legacy_html" })
    const searchInputRef    = useRef<HTMLInputElement>(null)

    // [ELITE-FEATURE] Fetch Dynamic Retail POS Print Profile
    useEffect(() => {
        getActivePOSPrintConfig().then(config => {
            if (config) setPrintConfig(config)
        })
    }, [])

    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category))
        return ['All', ...Array.from(cats)]
    }, [products])

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                               (p.barcode && p.barcode.includes(search)) ||
                               p.sku.toLowerCase().includes(search.toLowerCase())
            const matchCat = activeCategory === 'All' || p.category === activeCategory
            return matchSearch && matchCat
        })
    }, [products, search, activeCategory])

    useEffect(() => {
        setFocusedIndex(-1)
    }, [search, activeCategory])

    useEffect(() => {
        if (focusedIndex >= 0) {
            const el = document.getElementById(`product-item-${focusedIndex}`)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
        }
    }, [focusedIndex])

    const cartTotals = useMemo(() => {
        let subtotal = 0, tax = 0
        cart.forEach(i => { subtotal += i.netAmount; tax += i.taxAmount })
        return { subtotal, tax, total: subtotal + tax }
    }, [cart])

    // ── Add to Cart ───────────────────────────────────────────────────────

    const handleProductClick = useCallback((product: Product) => {
        const active = product.batches.filter(b => !isExpired(b.expiryDate) && b.qtyOnHand > 0)
        if (active.length === 0)       addToCartDirect(product, null)
        else if (active.length === 1)  addToCartDirect(product, active[0])
        else                           setBatchPickerProduct(product)
    }, [])

    const handleBatchSelect = useCallback((product: Product, batch: Batch) => {
        setBatchPickerProduct(null)
        addToCartDirect(product, batch)
    }, [])

    const addToCartDirect = (product: Product, batch: Batch | null) => {
        // Use batch sale_price/mrp as base price if available, else product base price
        const basePrice = batch?.salePrice ?? batch?.mrp ?? product.price
        // Default to first UOM option (base UOM, factor=1)
        const baseUomOpt = product.uomOptions[0]
        const unitPrice  = basePrice * baseUomOpt.factor
        const taxRate    = product.taxRate ?? 0
        const cartKey    = batch ? `${product.id}::${batch.id}` : product.id

        setCart(prev => {
            const existing = prev.find(i => i.productId === cartKey)
            if (existing) {
                return prev.map(i => {
                    if (i.productId !== cartKey) return i
                    const newQ = i.quantity + 1
                    return { ...i, quantity: newQ, netAmount: newQ * i.unitPrice, taxAmount: newQ * i.unitPrice * i.taxRate }
                })
            }
            const newItem: CartItem = {
                productId:   cartKey,
                name:        product.name,
                quantity:    1,
                unitPrice,
                basePrice,
                taxRate,
                taxAmount:   unitPrice * taxRate,
                netAmount:   unitPrice,
                batchId:     batch?.id     ?? '',
                batchNo:     batch?.batchNo ?? '',
                uom:         baseUomOpt.uom,
                uomOptions:  product.uomOptions,
            }
            return [...prev, newItem]
        })

        // World standard: clear search, clear selection, return focus to search bar
        setSearch('')
        setFocusedIndex(-1)
        // small timeout ensures the DOM has updated before we grab focus back
        setTimeout(() => searchInputRef.current?.focus(), 10)
    }

    const updateQuantity = (cartKey: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.productId !== cartKey) return i
            const newQ = Math.max(0, i.quantity + delta)
            return { ...i, quantity: newQ, netAmount: newQ * i.unitPrice, taxAmount: newQ * i.unitPrice * i.taxRate }
        }).filter(i => i.quantity > 0))
    }

    // When UOM changes: update unitPrice = basePrice × factor, recalc totals
    const updateUOM = (cartKey: string, opt: UomOption) => {
        setCart(prev => prev.map(i => {
            if (i.productId !== cartKey) return i
            const newUnitPrice = i.basePrice * opt.factor
            return {
                ...i,
                uom:       opt.uom,
                unitPrice: newUnitPrice,
                netAmount: i.quantity * newUnitPrice,
                taxAmount: i.quantity * newUnitPrice * i.taxRate,
            }
        }))
    }

    const updateTax = (cartKey: string, newTaxRate: number) => {
        setCart(prev => prev.map(i => {
            if (i.productId !== cartKey) return i
            return {
                ...i,
                taxRate: newTaxRate,
                taxAmount: i.quantity * i.unitPrice * newTaxRate
            }
        }))
    }

    const handleCheckout = async () => {
        if (cart.length === 0) return
        setIsCheckingOut(true)
        const res = await processPOSCheckout({
            items: cart.map(i => ({ ...i, uom: i.uom })),
            subtotal:      cartTotals.subtotal,
            totalTax:      cartTotals.tax,
            totalDiscount: 0,
            total:         cartTotals.total,
            paymentMethod,
        })
        setIsCheckingOut(false)
        if (res.success) {
            setSuccessInvoice(res.invoiceNumber!)
            setReceiptData({ items: cart, subtotal: cartTotals.subtotal, tax: cartTotals.tax, total: cartTotals.total, paymentMethod })
            setCart([])
            
            // Handle Post-Save Automation
            const autoPrint = printConfig?.automation?.autoPrint !== false; // Default true for legacy
            const showPreview = printConfig?.automation?.previewBeforePrint;

            if (autoPrint) {
                if (printConfig.source === 'legacy_html') {
                    setTimeout(() => window.print(), 100);
                } else {
                    const url = `/api/print/pos_bill/${res.invoiceId}${showPreview ? '' : '?autoPrint=true'}`;
                    window.open(url, '_blank');
                }
            } else if (showPreview) {
                window.open(`/api/print/pos_bill/${res.invoiceId}`, '_blank');
            }
            
            setTimeout(() => setSuccessInvoice(null), 4000)
        } else {
            alert('Checkout Failed: ' + res.error)
        }
    }

    return (
        <>
            {batchPickerProduct && (
                <BatchPickerDialog
                    product={batchPickerProduct}
                    onSelect={handleBatchSelect}
                    onClose={() => setBatchPickerProduct(null)}
                />
            )}

            <div className="flex h-full w-full print:hidden">
                {/* ── Left: Catalog ── */}
                <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-zinc-950">

                    {/* Search bar */}
                    <div className="p-4 bg-white dark:bg-zinc-900 shadow-sm z-10 flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/hms/dashboard')}
                            className="shrink-0 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors">
                            <X className="h-6 w-6" />
                        </Button>
                        <div className="flex-1 relative">
                            <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Scan barcode or search products..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault()
                                        setFocusedIndex(prev => Math.min(prev + 1, filteredProducts.length - 1))
                                    } else if (e.key === 'ArrowUp') {
                                        e.preventDefault()
                                        setFocusedIndex(prev => Math.max(prev - 1, 0))
                                    } else if (e.key === 'Enter') {
                                        e.preventDefault()
                                        if (focusedIndex >= 0 && focusedIndex < filteredProducts.length) {
                                            const p = filteredProducts[focusedIndex]
                                            const active = p.batches.filter(b => !isExpired(b.expiryDate) && b.qtyOnHand > 0)
                                            if (active.length > 0 || p.batches.length === 0) {
                                                handleProductClick(p)
                                            }
                                        }
                                    }
                                }}
                                className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-zinc-950 border-none rounded-xl text-lg font-medium focus:ring-4 focus:ring-indigo-500/20 focus:outline-none transition-all"
                                autoFocus
                            />
                        </div>
                        <div className="flex bg-slate-100 dark:bg-zinc-950 p-1 rounded-xl shrink-0">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm dark:bg-zinc-800 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                                <LayoutGrid className="h-5 w-5" />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm dark:bg-zinc-800 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                                <List className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="flex gap-2 p-4 overflow-x-auto hide-scrollbar bg-slate-50 dark:bg-zinc-950/50 border-b border-slate-200 dark:border-zinc-800">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                                    activeCategory === cat
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-md'
                                        : 'bg-white text-slate-600 dark:bg-zinc-900 dark:text-slate-400 hover:bg-slate-200 border border-slate-200 dark:border-zinc-800'
                                }`}
                            >{cat}</button>
                        ))}
                    </div>

                    {/* Product Grid / List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filteredProducts.map((p, idx) => {
                                    const { currencySymbol } = useLocalization();
                                const active        = p.batches.filter(b => !isExpired(b.expiryDate) && b.qtyOnHand > 0)
                                const hasMultiBatch = active.length > 1
                                const hasSingleBatch= active.length === 1
                                const outOfStock    = p.batches.length > 0 && active.length === 0
                                const single        = hasSingleBatch ? active[0] : null
                                const nearExpSingle = single ? isNearExpiry(single.expiryDate) : false
                                const hasUomOpts    = p.uomOptions.length > 1

                                return (
                                    <div
                                        id={`product-item-${idx}`}
                                        key={p.id}
                                        onClick={() => !outOfStock && handleProductClick(p)}
                                        className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 border flex flex-col h-44 select-none relative overflow-hidden transition-all ${
                                            outOfStock
                                                ? 'opacity-50 cursor-not-allowed grayscale border-slate-200 dark:border-zinc-800'
                                                : focusedIndex === idx
                                                    ? 'cursor-pointer shadow-xl ring-4 ring-indigo-500 border-indigo-500'
                                                    : 'cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-95 border-slate-200 dark:border-zinc-800'
                                        }`}
                                    >
                                        {/* Multi-batch badge */}
                                        {hasMultiBatch && (
                                            <div className="absolute top-2 right-2 bg-violet-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                                                <Layers className="h-2.5 w-2.5" />
                                                {active.length} BATCHES
                                            </div>
                                        )}
                                        {/* Out of stock */}
                                        {outOfStock && (
                                            <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                OUT OF STOCK
                                            </div>
                                        )}
                                        {/* Near expiry on single batch */}
                                        {hasSingleBatch && nearExpSingle && !hasMultiBatch && (
                                            <div className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                                                <AlertTriangle className="h-2.5 w-2.5" />
                                                NEAR EXP
                                            </div>
                                        )}

                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight pr-12">{p.name}</h3>
                                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{p.sku}</p>
                                        </div>

                                        <div className="mt-auto space-y-1">
                                            <div className="flex justify-between items-end">
                                                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                                    {currencySymbol}{p.price.toFixed(2)}
                                                </span>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{p.uom}</span>
                                                    <span className="text-[9px] font-semibold text-slate-500">Tax: {(p.taxRate * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>

                                            {/* Single batch: show expiry */}
                                            {hasSingleBatch && single && (
                                                <div className={`flex items-center gap-1 text-[10px] font-semibold rounded-md px-1.5 py-0.5 w-fit ${
                                                    nearExpSingle
                                                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                                                        : 'bg-slate-50 text-slate-400 dark:bg-zinc-800 dark:text-slate-500'
                                                }`}>
                                                    <Calendar className="h-2.5 w-2.5 shrink-0" />
                                                    Exp: {formatExpiry(single.expiryDate)}
                                                </div>
                                            )}

                                            {hasMultiBatch && (
                                                <p className="text-[10px] text-violet-500 font-semibold">Tap to select batch →</p>
                                            )}

                                            {/* UOM options indicator on card */}
                                            {hasUomOpts && (
                                                <p className="text-[10px] text-indigo-400 font-semibold">
                                                    {p.uomOptions.length} UOMs available
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-zinc-950/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-zinc-800">
                                        <tr>
                                            <th className="p-4">Product</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Price</th>
                                            <th className="p-4">Tax</th>
                                            <th className="p-4">Availability</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                                        {filteredProducts.map((p, idx) => {
                                            const { currencySymbol } = useLocalization();
                                            const active        = p.batches.filter(b => !isExpired(b.expiryDate) && b.qtyOnHand > 0)
                                            const outOfStock    = p.batches.length > 0 && active.length === 0
                                            const isFocused     = focusedIndex === idx
                                            
                                            return (
                                                <tr id={`product-item-${idx}`}
                                                    key={p.id} 
                                                    onClick={() => !outOfStock && handleProductClick(p)}
                                                    className={`transition-colors ${
                                                        outOfStock 
                                                            ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-zinc-950' 
                                                            : isFocused 
                                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 cursor-pointer outline outline-2 outline-indigo-500 -outline-offset-2 relative z-10'
                                                                : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                                                    }`}>
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-900 dark:text-white text-base leading-tight">{p.name}</div>
                                                        <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{p.sku}</div>
                                                    </td>
                                                    <td className="p-4 text-slate-500 font-medium">{p.category}</td>
                                                    <td className="p-4">
                                                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg">{currencySymbol}{p.price.toFixed(2)}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">/{p.uom}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="inline-block bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md text-xs font-bold">
                                                            {(p.taxRate * 100).toFixed(0)}%
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {outOfStock ? (
                                                            <span className="text-[10px] font-black tracking-widest text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-md">OUT OF STOCK</span>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <Layers className="h-4 w-4 text-violet-500" />
                                                                <span className="font-bold text-slate-700 dark:text-slate-300">{active.length} batch(es)</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {filteredProducts.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <LayoutGrid className="h-16 w-16 mb-4 opacity-20" />
                                <h2 className="text-xl font-bold">No products found</h2>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: Cart ── */}
                <div className="w-[400px] xl:w-[450px] bg-white dark:bg-zinc-900 shadow-[-10px_0_30px_rgba(0,0,0,0.05)] flex flex-col border-l border-slate-200 dark:border-zinc-800 z-20">
                    <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                        <h2 className="text-2xl font-black flex items-center">
                            <ShoppingCart className="mr-3 h-6 w-6" />
                            Current Order
                        </h2>
                        <span className="bg-white/20 px-3 py-1 rounded-full font-bold text-sm">
                            {cart.length} Items
                        </span>
                    </div>

                    {/* Cart items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50 dark:bg-zinc-950/30">
                        {cart.map(item => (
                            <div key={item.productId} className="bg-white dark:bg-zinc-900 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                                {/* Name + Qty */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">{item.name}</h4>
                                        {item.batchNo && (
                                            <p className="text-[10px] text-violet-500 font-semibold mt-0.5 flex items-center gap-1">
                                                <Layers className="h-2.5 w-2.5" />
                                                {item.batchNo}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => updateQuantity(item.productId, -1)}
                                            className="h-8 w-8 bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800 rounded-full flex items-center justify-center transition-colors">
                                            <Minus className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="w-6 text-center font-black text-base">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.productId, 1)}
                                            className="h-8 w-8 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-zinc-800 rounded-full flex items-center justify-center transition-colors">
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Price + UOM picker */}
                                <div className="flex items-center justify-between mt-1.5">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                            {currencySymbol}{(item.unitPrice * item.quantity).toFixed(2)}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            @{currencySymbol}{item.unitPrice.toFixed(2)}/{item.uom}
                                        </span>
                                    </div>

                                    {/* UOM picker — only this product's configured UOMs */}
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={item.taxRate}
                                            onChange={e => updateTax(item.productId, Number(e.target.value))}
                                            className="text-[9px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded border border-slate-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                        >
                                            {!availableTaxes.some(t => t.rate === item.taxRate) && (
                                                <option value={item.taxRate}>Tax: {(item.taxRate * 100).toFixed(0)}%</option>
                                            )}
                                            {availableTaxes.map(t => (
                                                <option key={t.id} value={t.rate}>Tax: {(t.rate * 100).toFixed(0)}%</option>
                                            ))}
                                        </select>
                                        <UOMPicker
                                            currentUom={item.uom}
                                            uomOptions={item.uomOptions}
                                            onSelect={opt => updateUOM(item.productId, opt)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {cart.length === 0 && !successInvoice && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 p-12 text-center">
                                <ShoppingCart className="h-16 w-16 mb-4" />
                                <p className="font-semibold text-lg">Cart is empty</p>
                                <p className="text-sm">Scan a barcode or tap a product</p>
                            </div>
                        )}

                        {successInvoice && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 text-center animate-in fade-in zoom-in duration-300">
                                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-3" />
                                <h3 className="text-xl font-black text-emerald-700 dark:text-emerald-400">Payment Successful!</h3>
                                <p className="text-emerald-600 dark:text-emerald-500 font-medium mt-1">Invoice {successInvoice}</p>
                            </div>
                        )}
                    </div>

                    {/* Checkout Footer */}
                    <div className="p-6 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-slate-500 font-semibold text-lg">
                                <span>Subtotal</span><span>{currencySymbol}{cartTotals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 font-semibold text-lg">
                                <span>Tax (Est)</span><span>{currencySymbol}{cartTotals.tax.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-slate-200 dark:border-zinc-800 my-2 pt-2" />
                            <div className="flex justify-between text-slate-900 dark:text-white font-black text-4xl tracking-tight">
                                <span>Total</span><span>{currencySymbol}{cartTotals.total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button onClick={() => setPaymentMethod('cash')}
                                className={`p-4 rounded-xl flex flex-col items-center justify-center font-bold transition-all border-2 ${
                                    paymentMethod === 'cash'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900'
                                }`}>
                                <Banknote className="h-8 w-8 mb-2" />CASH
                            </button>
                            <button onClick={() => setPaymentMethod('card')}
                                className={`p-4 rounded-xl flex flex-col items-center justify-center font-bold transition-all border-2 ${
                                    paymentMethod === 'card'
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-zinc-800 dark:bg-zinc-900'
                                }`}>
                                <CreditCard className="h-8 w-8 mb-2" />CARD
                            </button>
                        </div>

                        <Button
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || isCheckingOut}
                            className="w-full h-20 text-2xl font-black rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all active:translate-y-0"
                        >
                            {isCheckingOut ? 'PROCESSING...' : 'PAY NOW'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Receipt (Print Only) ── */}
            {receiptData && (
                <div className="hidden print:block w-[80mm] p-2 bg-white text-black text-xs font-mono mx-auto">
                    <div className="text-center mb-4">
                        <h1 className="text-xl font-bold">SAAS ERP PHARMACY</h1>
                        <p>Invoice: {successInvoice}</p>
                        <p>{new Date().toLocaleString('en-IN')}</p>
                    </div>
                    <div className="border-b border-dashed border-gray-400 mb-2"></div>
                    <table className="w-full text-left mb-2">
                        <thead>
                            <tr className="border-b border-dashed border-gray-400">
                                <th>Item</th>
                                <th className="text-right">Qty</th>
                                <th className="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receiptData.items.map((item, idx) => {
                                const { currencySymbol } = useLocalization();
                                const cols = printConfig?.columns || { showTax: true, showUOM: true };
                                return (
                                    <tr key={idx}>
                                        <td className="py-1">
                                            <div className="truncate w-32 font-bold">
                                                {item.name}
                                                {cols.showHsn && item.product?.hsn_code ? ` (HSN:${item.product.hsn_code})` : ''}
                                                {cols.showTax && item.taxRate > 0 ? ` [T]` : ''}
                                            </div>
                                            <div className="text-[10px] text-gray-500">@{item.unitPrice.toFixed(2)}</div>
                                        </td>
                                        <td className="text-right align-top py-1">{item.quantity} {cols.showUOM ? item.uom : ''}</td>
                                        <td className="text-right align-top py-1">{((item.unitPrice * item.quantity) + (cols.showTax ? item.taxAmount : 0)).toFixed(2)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    <div className="border-t border-dashed border-gray-400 mt-2 pt-2">
                        <div className="flex justify-between"><span>Subtotal:</span><span>{receiptData.subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Tax:</span><span>{receiptData.tax.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-base mt-1 border-t border-black pt-1">
                            <span>Total:</span><span>{receiptData.total.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="text-center mt-4">
                        <p>Payment: {receiptData.paymentMethod.toUpperCase()}</p>
                        <p className="mt-2 font-bold">Thank you for your visit!</p>
                    </div>
                </div>
            )}
        </>
    )
}
