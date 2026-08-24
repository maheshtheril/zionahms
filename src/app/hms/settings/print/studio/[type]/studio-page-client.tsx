'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Save, Plus, Trash2, Star, Loader2, X, ImageIcon, AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import {
    setPrintTemplateActive, updatePrintTemplateConfig,
    createPrintTemplate, deletePrintTemplate, getPrintTemplates
} from '@/app/actions/print-settings'
import { BUILT_IN_PRESETS, PAPER_OPTIONS, COLOR_PALETTES, FONT_OPTIONS, type PrintTemplatePreset } from '@/lib/print/template-presets'

const ROLES = ['ADMIN', 'RECEPTION', 'PHARMACIST', 'DOCTOR', 'NURSE', 'LAB', 'CASHIER', 'ACCOUNTANT']

const SECTIONS = [
    { group: '🏥 Header', items: [
        { key: 'showLogo', label: 'Logo' },
        { key: 'showHospitalName', label: 'Hospital Name' },
        { key: 'showAddress', label: 'Address' },
        { key: 'showPhone', label: 'Phone' },
        { key: 'showEmail', label: 'Email' },
        { key: 'showTaxId', label: 'GSTIN' },
    ]},
    { group: '👤 Patient', items: [
        { key: 'showPatientId', label: 'Patient ID' },
        { key: 'showDoctorName', label: 'Doctor Name' },
        { key: 'showDueDate', label: 'Due Date' },
    ]},
    { group: '📋 Columns', items: [
        { key: 'showTaxColumn', label: 'Tax (GST)' },
        { key: 'showDiscountColumn', label: 'Discount' },
        { key: 'showUOMColumn', label: 'Unit (UOM)' },
        { key: 'showHSNColumn', label: 'HSN Code' },
    ]},
    { group: '📌 Footer', items: [
        { key: 'showBankDetails', label: 'Bank Details' },
        { key: 'showQRCode', label: 'QR Code' },
        { key: 'showTerms', label: 'Terms' },
        { key: 'showSignature', label: 'Signature' },
    ]},
]

// ─── LIVE BILL PREVIEW ─────────────────────────────────────────────
function BillPreview({ brand, sections, paper }: { brand: any; sections: any; paper: string }) {
    const narrow = paper === 'roll80'
    const W = narrow ? 226 : paper === 'a5' ? 420 : 595
    const ff = brand.fontFamily === 'times' ? 'Georgia,serif' : brand.fontFamily === 'courier' ? 'Courier New,monospace' : 'Arial,sans-serif'

    return (
        <div style={{ width: '100%', height: '100%', overflowY: 'auto', background: '#e2e8f0', display: 'flex', justifyContent: 'center', padding: 32 }}>
            <div style={{ background: '#fff', width: W, minHeight: narrow ? 480 : 842, flexShrink: 0, fontFamily: ff, fontSize: 11, color: '#1e293b', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', borderRadius: 2 }}>
                {/* Header */}
                <div style={{ background: brand.headerBg, color: brand.headerText, padding: narrow ? '12px 14px' : '22px 28px', display: 'flex', alignItems: 'center', gap: 14, justifyContent: brand.logoPosition === 'center' ? 'center' : brand.logoPosition === 'right' ? 'flex-end' : 'flex-start', flexDirection: brand.logoPosition === 'center' ? 'column' : 'row' }}>
                    {sections.showLogo && brand.logoPosition !== 'hidden' && (
                        <div style={{ width: narrow ? 36 : 52, height: narrow ? 36 : 52, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ImageIcon style={{ width: narrow ? 18 : 26, height: narrow ? 18 : 26, opacity: 0.8 }} />
                        </div>
                    )}
                    <div style={{ textAlign: brand.logoPosition === 'center' ? 'center' : 'left' }}>
                        {sections.showHospitalName && <div style={{ fontWeight: 900, fontSize: narrow ? 14 : 20 }}>ELITE MEDICAL CENTER</div>}
                        {sections.showAddress && <div style={{ fontSize: narrow ? 9 : 11, opacity: 0.85, marginTop: 3 }}>123 Hospital Road, Thrissur, Kerala – 680001</div>}
                        {sections.showPhone && <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>+91 98765 43210{sections.showEmail ? '  ·  info@elite.in' : ''}</div>}
                        {sections.showTaxId && <div style={{ fontSize: 9, opacity: 0.65, marginTop: 1 }}>GSTIN: 32AABCE1234F1Z5</div>}
                    </div>
                </div>
                <div style={{ padding: narrow ? '12px 14px' : '22px 28px' }}>
                    {/* Bill meta */}
                    {!narrow && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: `2px solid ${brand.primaryColor}20` }}>
                            <div>
                                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Bill To</div>
                                <div style={{ fontWeight: 900, fontSize: 16 }}>JOHN DOE</div>
                                {sections.showPatientId && <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>Patient ID: P-900827</div>}
                                {sections.showDoctorName && <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1 }}>Dr. Alexander Fleming – Cardiology</div>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 900, fontSize: 14, color: brand.primaryColor }}>TAX INVOICE</div>
                                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>INV-2026-00142</div>
                                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>Date: 10 Jul 2026</div>
                                {sections.showDueDate && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 1 }}>Due: 25 Jul 2026</div>}
                            </div>
                        </div>
                    )}
                    {/* Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: narrow ? 9.5 : 10.5 }}>
                        <thead>
                            <tr style={{ background: brand.primaryColor + '18' }}>
                                <th style={{ padding: narrow ? '6px 8px' : '8px 12px', textAlign: 'left', fontWeight: 800, fontSize: narrow ? 8 : 9, textTransform: 'uppercase', color: brand.primaryColor }}>Item</th>
                                {sections.showUOMColumn && !narrow && <th style={{ padding: '8px 5px', textAlign: 'center', color: brand.primaryColor, fontWeight: 700, fontSize: 9 }}>Unit</th>}
                                {sections.showHSNColumn && !narrow && <th style={{ padding: '8px 5px', textAlign: 'center', color: brand.primaryColor, fontWeight: 700, fontSize: 9 }}>HSN</th>}
                                <th style={{ padding: '8px 5px', textAlign: 'right', color: brand.primaryColor, fontWeight: 700, fontSize: 9 }}>Qty</th>
                                <th style={{ padding: '8px 5px', textAlign: 'right', color: brand.primaryColor, fontWeight: 700, fontSize: 9 }}>Rate</th>
                                {sections.showDiscountColumn && !narrow && <th style={{ padding: '8px 5px', textAlign: 'right', color: '#16a34a', fontWeight: 700, fontSize: 9 }}>Disc</th>}
                                {sections.showTaxColumn && <th style={{ padding: '8px 5px', textAlign: 'right', color: brand.primaryColor, fontWeight: 700, fontSize: 9 }}>Tax</th>}
                                <th style={{ padding: narrow ? '6px 8px' : '8px 12px', textAlign: 'right', color: brand.primaryColor, fontWeight: 700, fontSize: 9 }}>Amt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { n: 'Consultation Fee', u: 'Nos', h: '999311', q: 1, r: 500, d: 0, t: 25, a: 525 },
                                { n: 'Lab Test – CBC', u: 'Nos', h: '999312', q: 1, r: 350, d: 0, t: 17, a: 367 },
                                { n: 'Paracetamol 500mg', u: 'Pcs', h: '30049099', q: 10, r: 12, d: 5, t: 6, a: 120 },
                            ].map((row, i) => (
                                <tr key={i} style={{ background: i % 2 === 0 ? '#fafbfc' : '#fff', borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: narrow ? '5px 8px' : '7px 12px' }}>{row.n}</td>
                                    {sections.showUOMColumn && !narrow && <td style={{ padding: '7px 5px', textAlign: 'center', color: '#94a3b8' }}>{row.u}</td>}
                                    {sections.showHSNColumn && !narrow && <td style={{ padding: '7px 5px', textAlign: 'center', color: '#94a3b8', fontSize: 9 }}>{row.h}</td>}
                                    <td style={{ padding: '7px 5px', textAlign: 'right' }}>{row.q}</td>
                                    <td style={{ padding: '7px 5px', textAlign: 'right' }}>₹{row.r}</td>
                                    {sections.showDiscountColumn && !narrow && <td style={{ padding: '7px 5px', textAlign: 'right', color: '#16a34a' }}>{row.d || '—'}</td>}
                                    {sections.showTaxColumn && <td style={{ padding: '7px 5px', textAlign: 'right', color: '#64748b' }}>₹{row.t}</td>}
                                    <td style={{ padding: narrow ? '5px 8px' : '7px 12px', textAlign: 'right', fontWeight: 700 }}>₹{row.a}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Total */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                        <div style={{ textAlign: 'right', minWidth: 160 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, paddingTop: 8, borderTop: `2px solid ${brand.primaryColor}` }}>
                                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: brand.primaryColor }}>Total</span>
                                <span style={{ fontSize: narrow ? 17 : 22, fontWeight: 900, color: brand.primaryColor }}>₹ 1,060</span>
                            </div>
                        </div>
                    </div>
                    {/* Footer */}
                    {!narrow && (sections.showBankDetails || sections.showSignature) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 28, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                            {sections.showBankDetails ? (
                                <div style={{ fontSize: 9.5, color: '#64748b', background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontWeight: 800, marginBottom: 3 }}>Bank Details</div>
                                    <div>A/C: 1234567890  ·  IFSC: SBIN001234</div>
                                    <div>State Bank of India, Thrissur</div>
                                </div>
                            ) : <div />}
                            {sections.showSignature && (
                                <div style={{ textAlign: 'center', fontSize: 9, color: '#64748b' }}>
                                    <div style={{ borderTop: '1px solid #334155', width: 130, marginBottom: 5 }} />
                                    Authorized Signatory
                                </div>
                            )}
                        </div>
                    )}
                    {sections.showTerms && !narrow && (
                        <div style={{ marginTop: 14, fontSize: 8.5, color: '#94a3b8', borderTop: '1px dashed #e2e8f0', paddingTop: 8 }}>
                            Terms: Payment due within 15 days. Subject to Thrissur jurisdiction.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── TOGGLE ───────────────────────────────────────────────────────────
function Tog({ on, set }: { on: boolean; set: (v: boolean) => void }) {
    return (
        <button onClick={() => set(!on)} style={{ width: 38, height: 22, borderRadius: 11, padding: 3, border: 'none', cursor: 'pointer', background: on ? '#4f46e5' : '#e2e8f0', transition: 'background .2s', flexShrink: 0 }}>
            <span style={{ display: 'block', width: 16, height: 16, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transform: on ? 'translateX(16px)' : 'none', transition: 'transform .2s' }} />
        </button>
    )
}

// ─── MAIN ─────────────────────────────────────────────────────────────
interface Props { usage: string; label: string; initialTemplates: any[] }
type Tab = 'design' | 'fields' | 'roles' | 'auto'

const DEFAULT_BRAND = { primaryColor: '#1e3a8a', accentColor: '#3b82f6', headerBg: '#1e3a8a', headerText: '#ffffff', fontFamily: 'helvetica', logoPosition: 'left', logoSize: 70 }
const DEFAULT_SECTIONS = { showLogo: true, showHospitalName: true, showAddress: true, showPhone: true, showEmail: true, showTaxId: true, showPatientId: true, showDoctorName: true, showTaxColumn: true, showDiscountColumn: false, showUOMColumn: false, showHSNColumn: false, showBankDetails: false, showQRCode: false, showTerms: false, showSignature: true, showDueDate: false, showSerialNumbers: false }

export function FullScreenStudio({ usage, label, initialTemplates }: Props) {
    const router = useRouter()
    const [templates, setTemplates] = useState<any[]>(initialTemplates)
    const [loadingTpls, setLoadingTpls] = useState(false)
    const [saving, setSaving] = useState(false)
    const [tab, setTab] = useState<Tab>('design')

    // ── Active template state ──
    const [activeId, setActiveId] = useState<string | null>(null)
    const [isNew, setIsNew] = useState(true)

    // ── Design state — drives live preview ──
    const [name, setName] = useState('')
    const [presetId, setPresetId] = useState('classic_blue')
    const [brand, setBrand] = useState<any>(DEFAULT_BRAND)
    const [sections, setSections] = useState<any>(DEFAULT_SECTIONS)
    const [paper, setPaper] = useState('a4')
    const [roles, setRoles] = useState<string[]>([])
    const [auto, setAuto] = useState({ autoPrint: false, previewBeforePrint: true, whatsappOnSave: false, emailOnSave: false, actionAfterSave: 'success_screen', copies: 1 })

    const refresh = async () => {
        setLoadingTpls(true)
        try {
            const r = await getPrintTemplates()
            if (r.success && r.data) setTemplates((r.data as any)[usage] || [])
        } finally { setLoadingTpls(false) }
    }

    useEffect(() => { refresh() }, [usage])

    const applyPreset = (p: PrintTemplatePreset) => {
        setPresetId(p.id); setBrand(p.brand); setSections(p.sections); setPaper(p.paper)
        if (!name) setName(p.name)
    }

    const loadTpl = (t: any) => {
        setActiveId(t.id); setIsNew(false); setName(t.name || '')
        const c = t.config || {}; const m = (t.metadata as any) || {}
        if (c.brand) setBrand((b: any) => ({ ...b, ...c.brand }))
        if (c.sections) setSections((s: any) => ({ ...s, ...c.sections }))
        if (c.pageSizeSettings?.format) setPaper(c.pageSizeSettings.format)
        if (m.defaultForRoles) setRoles(m.defaultForRoles)
        if (c.automation) setAuto((a: any) => ({ ...a, ...c.automation }))
        setTab('design')
    }

    const startNew = () => {
        setActiveId(null); setIsNew(true); setName('')
        setBrand(DEFAULT_BRAND); setSections(DEFAULT_SECTIONS); setPaper('a4'); setRoles([])
    }

    const save = async () => {
        if (!name.trim()) { toast({ title: '❌ Enter a template name first!', variant: 'destructive' }); return }
        setSaving(true)
        try {
            const config = { brand, sections, pageSizeSettings: { format: paper }, columns: { showTax: sections.showTaxColumn, showDiscount: sections.showDiscountColumn, showUOM: sections.showUOMColumn, showHsn: sections.showHSNColumn }, automation: auto, presetId, source: 'print_studio' }
            const metadata = { defaultForRoles: roles }
            if (!isNew && activeId) {
                const r = await updatePrintTemplateConfig(activeId, config, metadata)
                if (!r.success) throw new Error(r.error)
                toast({ title: '✅ Updated!' })
            } else {
                const r = await createPrintTemplate({ name: name.trim(), usage, config, metadata })
                if (!r.success) throw new Error(r.error)
                setActiveId(r.id ?? null); setIsNew(false)
                toast({ title: '✅ Template Saved!', description: 'Now click "Set as Default" to activate.' })
            }
            await refresh()
        } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }) }
        finally { setSaving(false) }
    }

    const setDefault = async (id: string) => {
        await setPrintTemplateActive(id, usage)
        toast({ title: '⚡ Set as Default!' }); await refresh()
    }

    const del = async (id: string) => {
        if (!confirm('Delete this template?')) return
        const r = await deletePrintTemplate(id)
        if (r.success) { toast({ title: 'Deleted' }); startNew(); await refresh() }
        else toast({ title: 'Cannot delete', description: r.error, variant: 'destructive' })
    }

    const activeData = templates.find(t => t.id === activeId)

    const S = (k: string) => sections[k] ?? false
    const setS = (k: string, v: boolean) => setSections((s: any) => ({ ...s, [k]: v }))

    const TABS: { id: Tab; label: string }[] = [
        { id: 'design', label: '🎨 Design & Style' },
        { id: 'fields', label: '📋 Show / Hide Fields' },
        { id: 'roles', label: '👥 Role Access' },
        { id: 'auto', label: '⚡ Automation' },
    ]

    return (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'white', fontFamily: 'Arial, sans-serif', zIndex: 9999 }}>

            {/* ── TOP BAR ── */}
            <div style={{ height: 52, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'white', flexShrink: 0, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => window.location.href = '/hms/settings/print'} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        ← Back
                    </button>
                    <div>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Print Studio</span>
                        <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>— {label}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{templates.length} template{templates.length !== 1 ? 's' : ''} saved</span>
                    <button onClick={save} disabled={saving || !name.trim()} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: saving || !name.trim() ? 'not-allowed' : 'pointer', background: saving || !name.trim() ? '#e2e8f0' : '#4f46e5', color: saving || !name.trim() ? '#94a3b8' : 'white', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {saving && <Loader2 style={{ width: 14, height: 14 }} />}
                        {saving ? 'Saving...' : isNew ? 'Save Template' : 'Update Template'}
                    </button>
                    {activeId && !isNew && (
                        activeData?.is_default
                            ? <span style={{ padding: '8px 14px', borderRadius: 8, background: '#d1fae5', color: '#065f46', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Check style={{ width: 13, height: 13 }} />Default</span>
                            : <button onClick={() => setDefault(activeId)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#059669', color: 'white', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Star style={{ width: 13, height: 13 }} />Set Default</button>
                    )}
                    {activeId && !isNew && (
                        <button onClick={() => del(activeId)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca', background: 'white', cursor: 'pointer', color: '#ef4444' }}>
                            <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── BODY ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ══ LEFT PANEL: 300px ══ */}
                <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#fafafa', overflow: 'hidden' }}>

                    {/* Saved templates list */}
                    <div style={{ borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Your Templates</span>
                            <button onClick={startNew} style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Plus style={{ width: 13, height: 13 }} />New
                            </button>
                        </div>
                        <div style={{ padding: '0 8px 8px', maxHeight: 160, overflowY: 'auto' }}>
                            {templates.length === 0 && !loadingTpls && (
                                <div style={{ padding: '10px 8px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                                    No templates yet.<br />Design one and save it below.
                                </div>
                            )}
                            {templates.map(t => {
                                const active = activeId === t.id
                                const color = (t.config as any)?.brand?.primaryColor || '#4f46e5'
                                return (
                                    <button key={t.id} onClick={() => loadTpl(t)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, marginBottom: 2, border: 'none', cursor: 'pointer', background: active ? '#4f46e5' : 'transparent', transition: 'background .15s' }}>
                                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0, border: active ? '2px solid rgba(255,255,255,0.5)' : 'none' }} />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'white' : '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                                        {t.is_default && <Star style={{ width: 12, height: 12, color: active ? '#fcd34d' : '#10b981', flexShrink: 0 }} />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* ── TEMPLATE NAME — Bold, red-highlighted ── */}
                    <div style={{ padding: '14px 16px 12px', background: 'white', borderBottom: '2px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                            Template Name <span style={{ color: '#ef4444', fontWeight: 900 }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g.  Standard A4 Bill"
                            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', fontSize: 14, fontWeight: 700, color: '#0f172a', border: `2px solid ${!name.trim() ? '#fca5a5' : '#c7d2fe'}`, borderRadius: 10, outline: 'none', background: !name.trim() ? '#fff7f7' : '#f5f3ff', transition: 'border-color .2s, background .2s' }}
                            onFocus={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.background = '#eef2ff' }}
                            onBlur={e => { e.currentTarget.style.borderColor = !name.trim() ? '#fca5a5' : '#c7d2fe'; e.currentTarget.style.background = !name.trim() ? '#fff7f7' : '#f5f3ff' }}
                        />
                        {!name.trim() && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                                <AlertCircle style={{ width: 12, height: 12 }} />
                                Enter a name before saving
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 10px', borderBottom: '1px solid #e2e8f0', background: 'white', gap: 2 }}>
                        {TABS.map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)} style={{ textAlign: 'left', padding: '9px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: tab === t.id ? 800 : 600, fontSize: 13, color: tab === t.id ? '#4f46e5' : '#64748b', background: tab === t.id ? '#eef2ff' : 'transparent', transition: 'all .15s' }}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content — scrollable */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

                        {/* ── DESIGN TAB ── */}
                        {tab === 'design' && <>
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>1. Pick a Base Design</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {BUILT_IN_PRESETS.map(p => {
                                        const sel = presetId === p.id && isNew
                                        return (
                                            <button key={p.id} onClick={() => applyPreset(p)} style={{ border: `2px solid ${sel ? '#4f46e5' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 8px', cursor: 'pointer', background: sel ? '#eef2ff' : 'white', textAlign: 'center', transition: 'all .15s' }}>
                                                <div style={{ width: 40, height: 24, borderRadius: 4, margin: '0 auto 7px', background: p.previewColors.header }} />
                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                                                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>{p.paper.toUpperCase()}</div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>2. Paper Size</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {PAPER_OPTIONS.map(o => (
                                        <button key={o.value} onClick={() => setPaper(o.value)} style={{ flex: 1, border: `2px solid ${paper === o.value ? '#4f46e5' : '#e2e8f0'}`, borderRadius: 8, padding: '8px 4px', cursor: 'pointer', background: paper === o.value ? '#eef2ff' : 'white', textAlign: 'center' }}>
                                            <div style={{ fontSize: 20 }}>{o.icon}</div>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginTop: 3 }}>{o.label.split(' ')[0]}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>3. Brand Color</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
                                    {COLOR_PALETTES.filter(p => p.primary).map(p => (
                                        <button key={p.label} title={p.label} onClick={() => setBrand((b: any) => ({ ...b, primaryColor: p.primary, accentColor: p.accent, headerBg: p.primary }))}
                                            style={{ width: 30, height: 30, borderRadius: '50%', background: p.primary, border: `3px solid ${brand.primaryColor === p.primary ? '#0f172a' : 'transparent'}`, cursor: 'pointer', transition: 'all .15s', boxShadow: brand.primaryColor === p.primary ? '0 0 0 2px white inset' : 'none' }} />
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 5 }}>Primary / Header</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px' }}>
                                            <input type="color" value={brand.primaryColor} onChange={e => setBrand((b: any) => ({ ...b, primaryColor: e.target.value, headerBg: e.target.value }))} style={{ width: 26, height: 26, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }} />
                                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{brand.primaryColor}</span>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 5 }}>Accent</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px' }}>
                                            <input type="color" value={brand.accentColor} onChange={e => setBrand((b: any) => ({ ...b, accentColor: e.target.value }))} style={{ width: 26, height: 26, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }} />
                                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{brand.accentColor}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>4. Font</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {FONT_OPTIONS.map(f => (
                                        <button key={f.value} onClick={() => setBrand((b: any) => ({ ...b, fontFamily: f.value }))} style={{ flex: 1, border: `2px solid ${brand.fontFamily === f.value ? '#4f46e5' : '#e2e8f0'}`, borderRadius: 8, padding: '8px 4px', cursor: 'pointer', background: brand.fontFamily === f.value ? '#eef2ff' : 'white', textAlign: 'center' }}>
                                            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: f.value === 'times' ? 'Georgia' : f.value === 'courier' ? 'Courier New' : 'Arial' }}>Aa</div>
                                            <div style={{ fontSize: 9, color: '#64748b', marginTop: 3 }}>{f.label.split(' ')[0]}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>5. Logo Position</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {(['left', 'center', 'right', 'hidden'] as const).map(p => (
                                        <button key={p} onClick={() => setBrand((b: any) => ({ ...b, logoPosition: p }))} style={{ flex: 1, border: `2px solid ${brand.logoPosition === p ? '#4f46e5' : '#e2e8f0'}`, borderRadius: 8, padding: '8px 4px', cursor: 'pointer', background: brand.logoPosition === p ? '#eef2ff' : 'white', textAlign: 'center', fontSize: 10, fontWeight: 700, color: brand.logoPosition === p ? '#4f46e5' : '#64748b', textTransform: 'capitalize' }}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>}

                        {/* ── FIELDS TAB ── */}
                        {tab === 'fields' && (
                            <div>
                                {SECTIONS.map(g => (
                                    <div key={g.group} style={{ marginBottom: 16, border: '1px solid #f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                                        <div style={{ padding: '9px 12px', background: '#f8fafc', fontSize: 11, fontWeight: 800, color: '#64748b' }}>{g.group}</div>
                                        {g.items.map((item, i) => (
                                            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'white', borderTop: i > 0 ? '1px solid #f8fafc' : 'none' }}>
                                                <span style={{ fontSize: 13, color: '#334155', cursor: 'pointer' }} onClick={() => setS(item.key, !S(item.key))}>{item.label}</span>
                                                <Tog on={S(item.key)} set={v => setS(item.key, v)} />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ── ROLES TAB ── */}
                        {tab === 'roles' && (
                            <div>
                                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14, lineHeight: 1.6 }}>
                                    Select which staff roles will automatically use this template when printing.
                                    <br /><br />
                                    <strong>Example:</strong> Create "Cashier Format" and assign CASHIER role. Create "Doctor Format" and assign DOCTOR role.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {ROLES.map(role => {
                                        const on = roles.includes(role)
                                        return (
                                            <button key={role} onClick={() => setRoles(r => on ? r.filter(x => x !== role) : [...r, role])} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 9, border: `2px solid ${on ? '#4f46e5' : '#e2e8f0'}`, cursor: 'pointer', background: on ? '#eef2ff' : 'white', transition: 'all .15s' }}>
                                                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${on ? '#4f46e5' : '#cbd5e1'}`, background: on ? '#4f46e5' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {on && <Check style={{ width: 9, height: 9, color: 'white' }} />}
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: on ? '#4f46e5' : '#64748b' }}>{role}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── AUTOMATION TAB ── */}
                        {tab === 'auto' && (
                            <div>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 7 }}>After Bill is Saved</label>
                                    <select value={auto.actionAfterSave} onChange={e => setAuto(a => ({ ...a, actionAfterSave: e.target.value }))} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', background: 'white', outline: 'none' }}>
                                        <option value="success_screen">Show Success Screen</option>
                                        <option value="new_bill">Open New Bill (Fast Mode)</option>
                                        <option value="list">Go to Bill List</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 7 }}>Print Copies</label>
                                    <input type="number" min={1} max={5} value={auto.copies} onChange={e => setAuto(a => ({ ...a, copies: +e.target.value }))} style={{ width: 80, border: '1px solid #e2e8f0', borderRadius: 8, padding: '9px', fontSize: 15, fontWeight: 800, textAlign: 'center', color: '#0f172a', outline: 'none' }} />
                                </div>
                                {[
                                    { k: 'autoPrint', l: 'Auto-Print (skip preview)' },
                                    { k: 'previewBeforePrint', l: 'Show preview before print' },
                                    { k: 'whatsappOnSave', l: 'Send WhatsApp on save' },
                                    { k: 'emailOnSave', l: 'Send Email on save' },
                                ].map(item => (
                                    <div key={item.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: 13, color: '#334155' }}>{item.l}</span>
                                        <Tog on={(auto as any)[item.k]} set={v => setAuto(a => ({ ...a, [item.k]: v }))} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ══ RIGHT: LIVE PREVIEW fills everything ══ */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 20px', borderBottom: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>👁 Live Preview — updates as you design</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: 20 }}>
                            {paper === 'roll80' ? '80mm Thermal' : paper === 'a5' ? 'A5' : 'A4'}
                        </span>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <BillPreview brand={brand} sections={sections} paper={paper} />
                    </div>
                </div>
            </div>
        </div>
    )
}
