'use client'

import React, { useState } from 'react'
import { CDSSReport, ClinicalAlert } from '@/lib/cdss/engine'
import { ShieldAlert, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, ShieldCheck, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CDSSAlertProps {
    report: CDSSReport | null
    isChecking?: boolean
    onOverrideAcknowledged?: (justification: string) => void
    isOverridden?: boolean
}

export function ClinicalDecisionSupportAlert({
    report,
    isChecking = false,
    onOverrideAcknowledged,
    isOverridden = false
}: CDSSAlertProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [showOverrideInput, setShowOverrideInput] = useState(false)
    const [justification, setJustification] = useState('')

    if (isChecking) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-3 text-xs text-slate-500 animate-pulse my-4">
                <div className="h-4 w-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                <span>Screening candidate medications against WHO/FDA Clinical Decision Support rules...</span>
            </div>
        )
    }

    if (!report || report.checkedMedicinesCount === 0) return null

    if (report.isSafe) {
        return (
            <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3 px-4 flex items-center justify-between my-4 transition-all">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div>
                        <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider block">
                            CDSS Clinical Safety Clearance
                        </span>
                        <p className="text-[11px] text-emerald-700">
                            Zero drug-drug interactions or known allergy contraindications detected across {report.checkedMedicinesCount} medicine{report.checkedMedicinesCount === 1 ? '' : 's'}.
                        </p>
                    </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    SAFE
                </span>
            </div>
        )
    }

    const criticalAlerts = report.alerts.filter(a => a.severity === 'CRITICAL')
    const moderateAlerts = report.alerts.filter(a => a.severity === 'MODERATE')

    const bannerBg = report.hasCritical 
        ? isOverridden ? 'bg-amber-50/80 border-amber-300' : 'bg-red-50/90 border-red-300' 
        : 'bg-amber-50/80 border-amber-200'

    const titleColor = report.hasCritical 
        ? isOverridden ? 'text-amber-900' : 'text-red-950 font-black' 
        : 'text-amber-900'

    const handleConfirmOverride = () => {
        if (!justification.trim()) {
            alert('Clinical justification is legally required to override critical safety warnings.')
            return
        }
        if (onOverrideAcknowledged) {
            onOverrideAcknowledged(justification.trim())
        }
        setShowOverrideInput(false)
    }

    return (
        <div className={`rounded-2xl border-2 ${bannerBg} shadow-sm overflow-hidden my-4 transition-all`}>
            {/* Header Banner */}
            <div 
                className="p-4 flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3.5">
                    {report.hasCritical ? (
                        <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 border border-red-200">
                            <ShieldAlert className="h-6 w-6 text-red-600 animate-pulse" />
                        </div>
                    ) : (
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className={`text-xs uppercase tracking-tight ${titleColor}`}>
                                {report.hasCritical ? 'Critical Patient Safety Alert (Contraindication Detected)' : 'Clinical Decision Advisory (Interaction Warning)'}
                            </h4>
                            {isOverridden && (
                                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> CLINICALLY OVERRIDDEN
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                            {report.summary}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/80 border border-slate-200 text-slate-700 shadow-2xs">
                        {report.alerts.length} Alert{report.alerts.length === 1 ? '' : 's'}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                </div>
            </div>

            {/* Expandable Alert Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-red-200/60 bg-white/70 p-4 space-y-3"
                    >
                        {report.alerts.map((alert) => (
                            <div 
                                key={alert.id}
                                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                                    alert.severity === 'CRITICAL' 
                                        ? 'bg-red-50/40 border-red-200' 
                                        : 'bg-amber-50/40 border-amber-200'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                                            alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                                        }`}>
                                            {alert.severity}
                                        </span>
                                        <span className="font-bold text-slate-800">{alert.title}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        {alert.drugA} {alert.drugB ? `⚡ ${alert.drugB}` : ''}
                                    </span>
                                </div>

                                <p className="text-[11px] text-slate-600 font-medium">
                                    <span className="font-bold text-slate-700">Mechanism: </span>
                                    {alert.mechanism}
                                </p>

                                <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/60 mt-1">
                                    <span className="font-bold text-emerald-800 text-[11px]">Recommended Clinical Action: </span>
                                    <span className="text-slate-700 text-[11px]">{alert.recommendation}</span>
                                </div>
                            </div>
                        ))}

                        {/* Clinical Override Panel */}
                        {report.hasCritical && !isOverridden && (
                            <div className="mt-4 pt-3 border-t border-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-red-100/50 p-3 rounded-xl">
                                <div>
                                    <span className="text-[11px] font-bold text-red-950 block">Prescribing Physician Override</span>
                                    <p className="text-[10px] text-red-800">
                                        FDA / JCI compliance requires mandatory justification to proceed with severe interactions.
                                    </p>
                                </div>

                                {!showOverrideInput ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowOverrideInput(true)}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                                    >
                                        Acknowledge & Override
                                    </button>
                                ) : (
                                    <div className="w-full space-y-2 mt-2">
                                        <input
                                            type="text"
                                            value={justification}
                                            onChange={(e) => setJustification(e.target.value)}
                                            placeholder="Enter clinical rationale (e.g. Special valve protocol, monitored INR)..."
                                            className="w-full px-3 py-1.5 text-xs bg-white border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowOverrideInput(false)}
                                                className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleConfirmOverride}
                                                className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded shadow"
                                            >
                                                Confirm Justified Override
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
