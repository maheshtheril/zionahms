import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { useLocalization } from "@/contexts/localization-context";

export default async function PurchaseOrdersPage() {
    const { currencySymbol } = useLocalization();
    const session = await auth()
    if (!session?.user?.companyId || !session?.user?.tenantId) {
        return <div>Unauthorized</div>
    }

    const tenantId = session.user.tenantId
    const companyId = session.user.companyId

    console.log('🔍 [PURCHASE ORDERS PAGE] User:', session.user.email)
    console.log('🔍 [PURCHASE ORDERS PAGE] Tenant ID:', tenantId)
    console.log('🔍 [PURCHASE ORDERS PAGE] Company ID:', companyId)

    // REAL DATA - Filtered by tenant
    const orders = await prisma.hms_purchase_order.findMany({
        where: {
            tenant_id: tenantId,
            company_id: companyId
        },
        include: {
            hms_supplier: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        },
        take: 50
    })

    console.log('🔍 [PURCHASE ORDERS PAGE] Found orders:', orders.length)
    console.log('🔍 [PURCHASE ORDERS PAGE] Orders tenant_ids:', orders.map(o => o.tenant_id))
    console.log('🔍 [PURCHASE ORDERS PAGE] First 3 orders:', orders.slice(0, 3).map(o => ({
        id: o.id,
        name: o.name,
        tenant_id: o.tenant_id,
        company_id: o.company_id,
        supplier: o.hms_supplier?.name
    })))

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans tracking-tight">
            {/* Header */}
            <div className="px-12 pt-16 pb-12 border-b-2 border-slate-900 flex justify-between items-end max-w-[1600px] mx-auto">
                <div>
                    <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">Procurement / Overview</p>
                    <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-none">PURCHASE<br />ORDERS.</h1>
                </div>
                <div>
                    <Link href="/hms/purchasing/orders/new" className="bg-slate-900 text-white px-8 py-4 font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-3 text-xs shadow-xl shadow-slate-200">
                        <Plus className="h-4 w-4" /> New Order
                    </Link>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-[1600px] mx-auto px-12 py-12">

                {/* Filters */}
                <div className="flex gap-8 mb-12 items-center">
                    <div className="relative group w-96">
                        <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="SEARCH ORDERS..."
                            className="w-full pl-8 bg-transparent border-b border-slate-200 py-2 text-xl font-bold focus:outline-none focus:border-indigo-600 placeholder:text-slate-200 uppercase tracking-wide transition-colors"
                        />
                    </div>
                    <div className="flex gap-4">
                        <button className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-1">All</button>
                        <button className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors pb-1">Drafts</button>
                        <button className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors pb-1">Pending</button>
                    </div>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 gap-0">
                    <div className="grid grid-cols-12 border-b border-slate-900 pb-4 mb-4 opacity-50">
                        <div className="col-span-3 text-xs font-bold uppercase tracking-widest">Order #</div>
                        <div className="col-span-4 text-xs font-bold uppercase tracking-widest">Supplier</div>
                        <div className="col-span-2 text-xs font-bold uppercase tracking-widest">Status</div>
                        <div className="col-span-3 text-right text-xs font-bold uppercase tracking-widest">Total Value</div>
                    </div>

                    {orders.length === 0 ? (
                        <div className="py-24 text-center">
                            <p className="text-lg font-bold text-slate-300 mb-2">No Purchase Orders Yet</p>
                            <p className="text-sm text-slate-400">Create your first purchase order to get started</p>
                            <Link href="/hms/purchasing/orders/new" className="inline-block mt-6 bg-slate-900 text-white px-6 py-3 font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all text-xs">
                                <Plus className="h-4 w-4 inline mr-2" /> Create Order
                            </Link>
                        </div>
                    ) : (
                        <>
                            {orders.map((po, i) => (
                                <Link
                                    key={po.id}
                                    href={`/hms/purchasing/orders/${po.id}`}
                                    className="group grid grid-cols-12 py-6 border-b border-slate-100 hover:bg-slate-50 transition-all items-center cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-indigo-600 transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>

                                    <div className="col-span-3 font-mono text-lg font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                                        {po.name || `PO-${po.id.slice(0, 8)}`}
                                    </div>
                                    <div className="col-span-4 text-2xl font-bold tracking-tight">
                                        {po.hms_supplier?.name || 'Unknown Supplier'}
                                    </div>
                                    <div className="col-span-2">
                                        <span className={`
                                            text-xs font-black uppercase tracking-widest py-1 px-3 
                                            ${po.status === 'confirmed' || po.status === 'billed' ? 'bg-indigo-100 text-indigo-700' :
                                                po.status === 'received' || po.status === 'closed' ? 'bg-emerald-100 text-emerald-800' :
                                                    'bg-slate-100 text-slate-500'}
                                        `}>
                                            {po.status}
                                        </span>
                                    </div>
                                    <div className="col-span-3 text-right font-mono text-2xl font-bold tracking-tighter">
                                        <span className="text-sm text-slate-400 mr-2 align-middle font-sans font-bold">{currencySymbol}</span>
                                        {Number(po.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </Link>
                            ))}

                            {/* End of List */}
                            <div className="py-12 text-center">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-300">End of List</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
