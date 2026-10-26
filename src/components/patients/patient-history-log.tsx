'use client'

import { useState, useEffect } from 'react'
import { getPatientHistory } from '@/app/actions/audit'
import { 
    Clock, User, AlertCircle, ChevronDown, ChevronUp, Database, 
    Eye, ShieldAlert, FileDown, Edit3, PlusCircle, ShieldCheck 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function PatientHistoryLog({ patientId }: { patientId: string }) {
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    useEffect(() => {
        loadHistory()
    }, [patientId])

    async function loadHistory() {
        setLoading(true)
        const res = await getPatientHistory(patientId)
        if (res.success && res.data) {
            setHistory(res.data)
        }
        setLoading(false)
    }

    const toggleExpand = (id: string | number) => {
        const next = new Set(expanded)
        const sid = String(id)
        if (next.has(sid)) next.delete(sid)
        else next.add(sid)
        setExpanded(next)
    }

    const getOperationBadge = (op: string) => {
        switch (op?.toUpperCase()) {
            case 'VIEW':
                return {
                    color: 'bg-sky-50 text-sky-700 border-sky-200',
                    icon: <Eye className="h-4 w-4 text-sky-600" />,
                    label: 'CHART VIEWED'
                }
            case 'BREAK_GLASS':
                return {
                    color: 'bg-rose-50 text-rose-700 border-rose-300 font-black animate-pulse',
                    icon: <ShieldAlert className="h-4 w-4 text-rose-600" />,
                    label: 'EMERGENCY OVERRIDE (BREAK-GLASS)'
                }
            case 'EXPORT':
            case 'PRINT':
                return {
                    color: 'bg-purple-50 text-purple-700 border-purple-200',
                    icon: <FileDown className="h-4 w-4 text-purple-600" />,
                    label: 'ePHI EXPORTED'
                }
            case 'UPDATE':
                return {
                    color: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: <Edit3 className="h-4 w-4 text-amber-600" />,
                    label: 'RECORD UPDATED'
                }
            case 'INSERT':
            case 'CREATE':
                return {
                    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    icon: <PlusCircle className="h-4 w-4 text-emerald-600" />,
                    label: 'RECORD CREATED'
                }
            default:
                return {
                    color: 'bg-slate-50 text-slate-700 border-slate-200',
                    icon: <Database className="h-4 w-4 text-slate-600" />,
                    label: op || 'AUDIT EVENT'
                }
        }
    }

    if (loading) return (
        <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-100 rounded-3xl" />
            ))}
        </div>
    )

    if (history.length === 0) return (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <ShieldCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-slate-500 font-bold uppercase tracking-wider text-sm">Audit Trail Initialized</h3>
            <p className="text-slate-400 text-xs mt-2 max-w-md mx-auto">
                HIPAA § 164.312(b) audit recording is active. Future views, chart modifications, and medical exports will automatically register here.
            </p>
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            <div className="px-4 mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        HIPAA § 164.312(b) & 21 CFR Part 11 Audit Trail
                    </span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
                    {history.length} Event{history.length === 1 ? '' : 's'} Recorded
                </span>
            </div>

            {history.map((log) => {
                const badge = getOperationBadge(log.operation)
                const metadata = (log.new_data as any) || {}
                const reason = metadata.reason || 'Clinical Workflow'

                return (
                    <div 
                        key={log.history_id} 
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:border-slate-300 hover:shadow-md group"
                    >
                        <div 
                            className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none"
                            onClick={() => toggleExpand(log.history_id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-11 w-11 rounded-xl flex items-center justify-center border ${badge.color}`}>
                                    {badge.icon}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-medium">
                                            {new Date(log.changed_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 text-slate-600 font-medium text-xs">
                                        <User className="h-3.5 w-3.5 text-slate-400" /> 
                                        <span className="font-semibold text-slate-800">{log.userName || 'Staff'}</span>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-slate-500 capitalize">{log.userRole || 'Clinician'}</span>
                                        {reason && (
                                            <>
                                                <span className="text-slate-400">•</span>
                                                <span className="text-slate-500 italic text-[11px]">{reason}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {expanded.has(String(log.history_id)) 
                                    ? <ChevronUp className="h-4 w-4 text-slate-400" /> 
                                    : <ChevronDown className="h-4 w-4 text-slate-400" />
                                }
                            </div>
                        </div>

                        <AnimatePresence>
                            {expanded.has(String(log.history_id)) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden border-t border-slate-100 bg-slate-50/60"
                                >
                                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Audit Metadata</h4>
                                            <div className="bg-white p-3 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-700 whitespace-pre-wrap overflow-auto max-h-52">
                                                {JSON.stringify(log.new_data || {}, null, 2)}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Diff / Changes</h4>
                                            <div className="bg-white p-3 rounded-xl border border-slate-200/80 font-mono text-[11px] text-slate-700 whitespace-pre-wrap overflow-auto max-h-52">
                                                {JSON.stringify(log.diff || log.old_data || { status: 'No direct field alterations' }, null, 2)}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )
            })}
        </div>
    )
}
