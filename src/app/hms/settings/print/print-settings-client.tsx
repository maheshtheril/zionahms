'use client'

import { useState } from 'react'
import {
    FileText, Monitor, Package, Stethoscope, FlaskConical,
    ScrollText, CreditCard, Clock, RotateCcw, RefreshCw,
    Printer, Star, Settings2, ChevronRight, Check
} from 'lucide-react'

const DOC_TYPES = [
    { id: 'sale_bill', label: 'Sale Invoice', color: 'indigo', description: 'Main hospital bill / invoice for patient billing', emoji: '🧾' },
    { id: 'pos_bill', label: 'POS Receipt', color: 'emerald', description: 'Pharmacy counter & retail POS thermal receipt', emoji: '🖨️' },
    { id: 'purchase_receipt', label: 'Purchase Bill (GRN)', color: 'amber', description: 'Goods Received Note for purchase bills', emoji: '📦' },
    { id: 'op_slip', label: 'OP Slip / Token', color: 'blue', description: 'Outpatient visit slip and appointment token', emoji: '🏥' },
    { id: 'lab_report', label: 'Lab Report', color: 'purple', description: 'Laboratory test results report', emoji: '🔬' },
    { id: 'prescription', label: 'Prescription', color: 'rose', description: 'Doctor prescription pad format', emoji: '💊' },
    { id: 'payment_voucher', label: 'Payment Voucher', color: 'sky', description: 'Payment receipt / voucher', emoji: '💳' },
    { id: 'shift_close', label: 'Shift Z-Report', color: 'orange', description: 'Cashier shift closing summary / Z-report', emoji: '⏱️' },
    { id: 'sales_return', label: 'Sales Return', color: 'teal', description: 'Sales return / credit note format', emoji: '↩️' },
    { id: 'purchase_return', label: 'Purchase Return', color: 'slate', description: 'Purchase return / debit note format', emoji: '↪️' },
] as const

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; activeBg: string; activeText: string; badge: string }> = {
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', activeBg: 'bg-indigo-600', activeText: 'text-white', badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', activeBg: 'bg-emerald-600', activeText: 'text-white', badge: 'bg-emerald-100 text-emerald-700' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', activeBg: 'bg-amber-600', activeText: 'text-white', badge: 'bg-amber-100 text-amber-700' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', activeBg: 'bg-blue-600', activeText: 'text-white', badge: 'bg-blue-100 text-blue-700' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', activeBg: 'bg-purple-600', activeText: 'text-white', badge: 'bg-purple-100 text-purple-700' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800', activeBg: 'bg-rose-600', activeText: 'text-white', badge: 'bg-rose-100 text-rose-700' },
    sky: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800', activeBg: 'bg-sky-600', activeText: 'text-white', badge: 'bg-sky-100 text-sky-700' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', activeBg: 'bg-orange-600', activeText: 'text-white', badge: 'bg-orange-100 text-orange-700' },
    teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800', activeBg: 'bg-teal-600', activeText: 'text-white', badge: 'bg-teal-100 text-teal-700' },
    slate: { bg: 'bg-slate-50 dark:bg-slate-900/20', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', activeBg: 'bg-slate-700', activeText: 'text-white', badge: 'bg-slate-100 text-slate-700' },
}

interface Props {
    templates: Record<string, any[]>
    allTemplates: any[]
}

export function PrintSettingsClientV2({ templates, allTemplates }: Props) {
    const [activeDocType, setActiveDocType] = useState<string>('sale_bill')

    const activeDoc = DOC_TYPES.find(d => d.id === activeDocType)!
    const colors = COLOR_MAP[activeDoc.color]
    const currentTemplates = templates[activeDocType] || []
    const hasTemplates = currentTemplates.length > 0

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Page header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                            <Printer className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Print Configuration Centre</h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Design · Brand · Role · Automate</p>
                        </div>
                    </div>
                    <span className="hidden md:flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        {allTemplates.length} templates configured
                    </span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="flex gap-6">
                    {/* Left sidebar — doc types */}
                    <div className="w-64 shrink-0 space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 pb-2">Document Types</p>
                        {DOC_TYPES.map(doc => {
                            const isActive = activeDocType === doc.id
                            const docTemplates = templates[doc.id] || []
                            const hasDefault = docTemplates.some((t: any) => t.is_default)
                            const c = COLOR_MAP[doc.color]
                            return (
                                <button
                                    key={doc.id}
                                    onClick={() => setActiveDocType(doc.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive
                                        ? `${c.activeBg} shadow-md ${c.activeText}`
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'
                                        }`}
                                >
                                    <span className="text-base">{doc.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : ''}`}>{doc.label}</p>
                                        <p className={`text-[10px] truncate ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                                            {docTemplates.length} template{docTemplates.length !== 1 ? 's' : ''}
                                            {hasDefault ? ' · ✓ Active' : ''}
                                        </p>
                                    </div>
                                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70 shrink-0" />}
                                </button>
                            )
                        })}
                    </div>

                    {/* Right panel — overview only. Studio opens as full-page /print-studio/[type] */}
                    <div className="flex-1 min-w-0 space-y-6">

                        {/* Header card */}
                        <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-5`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{activeDoc.emoji}</span>
                                    <div>
                                        <h2 className={`text-lg font-black ${colors.text}`}>{activeDoc.label}</h2>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeDoc.description}</p>
                                    </div>
                                </div>
                                {/* Opens /print-studio/[type] — root level, NO sidebar */}
                                <a
                                    href={`/print-studio/${activeDocType}`}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl ${colors.activeBg} ${colors.activeText} text-xs font-black uppercase tracking-widest shadow-md transition-all hover:opacity-90 hover:scale-105 active:scale-100`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <Settings2 className="w-3.5 h-3.5" />
                                    Open Print Studio
                                </a>
                            </div>
                        </div>

                        {/* No templates yet */}
                        {!hasTemplates && (
                            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
                                <div className="text-5xl mb-4">{activeDoc.emoji}</div>
                                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2 text-lg">No templates for {activeDoc.label} yet</h3>
                                <p className="text-sm text-slate-400 mb-6">Design your first template in Print Studio.<br />Choose colors, font, paper size, and show/hide fields.</p>
                                <a
                                    href={`/print-studio/${activeDocType}`}
                                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl ${colors.activeBg} ${colors.activeText} text-sm font-black uppercase tracking-widest shadow-md`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <Settings2 className="w-4 h-4" /> Open Print Studio
                                </a>
                            </div>
                        )}

                        {/* Templates grid */}
                        {hasTemplates && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {currentTemplates.length} Template{currentTemplates.length !== 1 ? 's' : ''} — {activeDoc.label}
                                    </p>
                                    <a
                                        href={`/print-studio/${activeDocType}`}
                                        className={`text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1`}
                                        style={{ textDecoration: 'none' }}
                                    >
                                        + Create New / Edit in Studio
                                    </a>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {currentTemplates.map((tpl: any) => {
                                        const isDefault = tpl.is_default
                                        const cfg = tpl.config as any || {}
                                        const brand = cfg.brand || {}
                                        const paperFormat = cfg.pageSizeSettings?.format?.toUpperCase() || 'A4'
                                        const roles = (tpl.metadata as any)?.defaultForRoles || []
                                        return (
                                            <div key={tpl.id} className={`relative bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all overflow-hidden ${isDefault ? `${colors.border} shadow-lg` : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md'}`}>
                                                <div className="h-2 w-full" style={{ backgroundColor: brand.primaryColor || '#4f46e5' }} />
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                        <div>
                                                            <h3 className="font-black text-sm text-slate-900 dark:text-white">{tpl.name}</h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{paperFormat}</span>
                                                                {brand.fontFamily && <span className="text-[10px] font-bold text-slate-300 uppercase">{brand.fontFamily}</span>}
                                                            </div>
                                                        </div>
                                                        {isDefault && (
                                                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                                <Star className="w-2.5 h-2.5" /> Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    {roles.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mb-3">
                                                            {roles.slice(0, 4).map((r: string) => (
                                                                <span key={r} className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${colors.badge}`}>{r}</span>
                                                            ))}
                                                            {roles.length > 4 && <span className="text-[9px] text-slate-400">+{roles.length - 4}</span>}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mb-4">
                                                        {cfg.automation?.autoPrint && <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" />Auto-Print</span>}
                                                        {cfg.automation?.whatsappOnSave && <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" />WhatsApp</span>}
                                                        {cfg.automation?.copies > 1 && <span className="flex items-center gap-1"><Printer className="w-3 h-3 text-indigo-500" />{cfg.automation.copies} copies</span>}
                                                    </div>
                                                    {/* Edit goes to studio */}
                                                    <a
                                                        href={`/print-studio/${activeDocType}`}
                                                        className="block w-full py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center"
                                                        style={{ textDecoration: 'none' }}
                                                    >
                                                        Edit in Studio
                                                    </a>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Total Templates', value: currentTemplates.length, icon: '📄' },
                                { label: 'Roles Assigned', value: currentTemplates.reduce((a: number, t: any) => a + ((t.metadata as any)?.defaultForRoles?.length || 0), 0), icon: '👥' },
                                { label: 'Auto-Print ON', value: currentTemplates.filter((t: any) => (t.config as any)?.automation?.autoPrint).length, icon: '⚡' },
                            ].map(stat => (
                                <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 text-center">
                                    <div className="text-2xl mb-1">{stat.icon}</div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
