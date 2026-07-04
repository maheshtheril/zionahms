'use client'

import { useState } from "react"
import { updateClaimStatus } from "@/app/actions/claims"
import { CheckCircle2, XCircle, Clock, ShieldAlert, FileText, Send, X, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export function ClaimsClient({ initialClaims }: { initialClaims: any[] }) {
    const router = useRouter()
    const [claims, setClaims] = useState(initialClaims)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isPending, setIsPending] = useState(false)

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === claims.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(claims.map(c => c.id)))
        }
    }

    const handleStatusUpdate = async (status: string) => {
        if (selectedIds.size === 0) return
        if (!confirm(`Are you sure you want to mark ${selectedIds.size} claims as ${status.toUpperCase()}?`)) return
        
        setIsPending(true)
        const res = await updateClaimStatus(Array.from(selectedIds), status)
        setIsPending(false)

        if (res.success) {
            // Optimistic update
            setClaims(claims.map(c => selectedIds.has(c.id) ? { ...c, status } : c))
            setSelectedIds(new Set())
            router.refresh()
        } else {
            alert(res.error || "Failed to update claims")
        }
    }

    return (
        <div className="space-y-6">
            {/* Batch Action Toolbar */}
            <div className={`p-4 bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex items-center justify-between transition-all ${selectedIds.size > 0 ? 'opacity-100 translate-y-0' : 'opacity-50 pointer-events-none'}`}>
                <div className="flex items-center gap-3">
                    <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-black px-3 py-1 rounded-lg text-sm">
                        {selectedIds.size} Selected
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleStatusUpdate('submitted')}
                        disabled={isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" /> Submit to TPA
                    </button>
                    <button 
                        onClick={() => handleStatusUpdate('paid')}
                        disabled={isPending}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 flex items-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" /> Mark Paid
                    </button>
                    <button 
                        onClick={() => handleStatusUpdate('denied')}
                        disabled={isPending}
                        className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-700 flex items-center gap-2"
                    >
                        <XCircle className="w-4 h-4" /> Deny
                    </button>
                </div>
            </div>

            {/* Claims Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.size > 0 && selectedIds.size === claims.length}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date / Invoice</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Patient</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Provider</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Billed Amt</th>
                                <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {claims.map((claim) => (
                                <tr key={claim.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${selectedIds.has(claim.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                                    <td className="p-4 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(claim.id)}
                                            onChange={() => toggleSelect(claim.id)}
                                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td className="p-4" onClick={() => toggleSelect(claim.id)}>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                            {new Date(claim.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono mt-1">
                                            {claim.invoice?.invoice_no}
                                        </div>
                                    </td>
                                    <td className="p-4" onClick={() => toggleSelect(claim.id)}>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                                            {claim.patient_insurance?.patient?.first_name} {claim.patient_insurance?.patient?.last_name}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            ID: {claim.patient_insurance?.patient?.patient_number}
                                        </div>
                                    </td>
                                    <td className="p-4" onClick={() => toggleSelect(claim.id)}>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            <ShieldAlert className="w-3 h-3" />
                                            {claim.provider?.name}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right" onClick={() => toggleSelect(claim.id)}>
                                        <div className="text-sm font-black text-slate-900 dark:text-white">
                                            ${Number(claim.amount_billed).toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center" onClick={() => toggleSelect(claim.id)}>
                                        <StatusBadge status={claim.status} />
                                    </td>
                                </tr>
                            ))}
                            {claims.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500 text-sm font-bold">
                                        No claims found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'draft':
            return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider"><Clock className="w-3 h-3"/> Draft</span>
        case 'submitted':
            return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider"><Send className="w-3 h-3"/> Submitted</span>
        case 'paid':
            return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider"><CheckCircle2 className="w-3 h-3"/> Paid</span>
        case 'denied':
            return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider"><XCircle className="w-3 h-3"/> Denied</span>
        default:
            return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">{status}</span>
    }
}
