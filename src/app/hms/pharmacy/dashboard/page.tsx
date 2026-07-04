import Link from "next/link"
import { Pill, PackageOpen, ArrowRight, Activity, Beaker } from "lucide-react"

export default function PharmacyDashboard() {
    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-emerald-900 to-emerald-800 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 shadow-inner">
                        <Pill className="w-10 h-10 text-emerald-200" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Pharmacy Workspace</h1>
                        <p className="text-emerald-100 mt-2 text-lg">Manage prescriptions, billing, and inventory from one place.</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Pharmacy Billing */}
                <Link href="/hms/pharmacy/billing" className="group">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col items-start hover:-translate-y-1 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                            <Activity className="w-32 h-32 text-emerald-600" />
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                            <Pill className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-3">Pharmacy Billing</h2>
                        <p className="text-slate-500 mb-8 max-w-sm">Process outpatient and inpatient prescriptions, generate bills, and manage pharmacy queues.</p>
                        <div className="mt-auto flex items-center text-emerald-600 font-semibold group-hover:gap-2 transition-all">
                            Open Billing Center <ArrowRight className="w-5 h-5 ml-2" />
                        </div>
                    </div>
                </Link>

                {/* Inventory Management */}
                <Link href="/hms/inventory" className="group">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col items-start hover:-translate-y-1 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                            <PackageOpen className="w-32 h-32 text-blue-600" />
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                            <PackageOpen className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-3">Pharmacy Inventory</h2>
                        <p className="text-slate-500 mb-8 max-w-sm">Track medical stock levels, manage batches, handle suppliers, and oversee internal movements.</p>
                        <div className="mt-auto flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                            Manage Stock <ArrowRight className="w-5 h-5 ml-2" />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    )
}
