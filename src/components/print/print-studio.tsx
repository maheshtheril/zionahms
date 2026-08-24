'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, Save, Plus, Trash2, Star, Loader2, AlignLeft, AlignCenter, AlignRight, X, ImageIcon, AlertCircle, Grid, Users, Zap, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { setPrintTemplateActive, updatePrintTemplateConfig, createPrintTemplate, deletePrintTemplate, getPrintTemplates } from '@/app/actions/print-settings'
import { BUILT_IN_PRESETS, PAPER_OPTIONS, COLOR_PALETTES, FONT_OPTIONS, type PrintTemplatePreset } from '@/lib/print/template-presets'
import { useRouter } from 'next/navigation'

const ROLES = ['ADMIN', 'RECEPTION', 'PHARMACIST', 'DOCTOR', 'NURSE', 'LAB', 'CASHIER', 'ACCOUNTANT'] as const

const SECTIONS_CONFIG = [
    {
        group: 'Header', icon: '🏥', items: [
            { key: 'showLogo', label: 'Company Logo' },
            { key: 'showHospitalName', label: 'Hospital Name' },
            { key: 'showAddress', label: 'Address' },
            { key: 'showPhone', label: 'Phone' },
            { key: 'showEmail', label: 'Email' },
            { key: 'showTaxId', label: 'GSTIN / Tax ID' },
        ]
    },
    {
        group: 'Patient Info', icon: '👤', items: [
            { key: 'showPatientId', label: 'Patient ID' },
            { key: 'showDoctorName', label: 'Doctor Name' },
            { key: 'showDueDate', label: 'Due Date' },
        ]
    },
    {
        group: 'Table Columns', icon: '📋', items: [
            { key: 'showTaxColumn', label: 'Tax (CGST / SGST)' },
            { key: 'showDiscountColumn', label: 'Discount Column' },
            { key: 'showUOMColumn', label: 'Unit (UOM)' },
            { key: 'showHSNColumn', label: 'HSN / SAC Code' },
        ]
    },
    {
        group: 'Footer', icon: '📌', items: [
            { key: 'showBankDetails', label: 'Bank Details' },
            { key: 'showQRCode', label: 'UPI QR Code' },
            { key: 'showTerms', label: 'Terms & Conditions' },
            { key: 'showSignature', label: 'Authorized Signatory' },
        ]
    },
]

// ── Small Toggle ──────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            style={{
                display: 'inline-flex', alignItems: 'center',
                width: 36, height: 20, borderRadius: 10, padding: '2px',
                backgroundColor: checked ? '#4f46e5' : '#e2e8f0',
                border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
            }}
        >
            <span style={{
                display: 'block', width: 16, height: 16, borderRadius: '50%',
                backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transform: checked ? 'translateX(16px)' : 'translateX(0)',
                transition: 'transform 0.2s',
            }} />
        </button>
    )
}

// ── Live Bill Preview ─────────────────────────────────────────────────
function LivePreview({ brand, sections, paper }: {
    brand: PrintTemplatePreset['brand']
    sections: PrintTemplatePreset['sections']
    paper: 'a4' | 'a5' | 'roll80'
}) {
    const isNarrow = paper === 'roll80'
    const billW = isNarrow ? 220 : paper === 'a5' ? 420 : 595
    const font = brand.fontFamily === 'times' ? 'Georgia, Times, serif' : brand.fontFamily === 'courier' ? 'Courier New, monospace' : 'Arial, Helvetica, sans-serif'

    return (
        <div style={{
            width: '100%', height: '100%', overflow: 'auto',
            backgroundColor: '#e2e8f0', display: 'flex',
            justifyContent: 'center', padding: '24px',
        }}>
            {/* Actual bill */}
            <div style={{
                backgroundColor: 'white',
                width: billW,
                minHeight: isNarrow ? 500 : 842,
                flexShrink: 0,
                fontFamily: font,
                fontSize: 11,
                color: '#1e293b',
                boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
            }}>
                {/* Header */}
                <div style={{
                    backgroundColor: brand.headerBg,
                    color: brand.headerText,
                    padding: isNarrow ? '12px 14px' : '20px 28px',
                    display: 'flex',
                    flexDirection: brand.logoPosition === 'center' ? 'column' : 'row',
                    alignItems: 'center',
                    justifyContent: brand.logoPosition === 'right' ? 'flex-end' : brand.logoPosition === 'center' ? 'center' : 'flex-start',
                    gap: isNarrow ? 8 : 14,
                }}>
                    {sections.showLogo && brand.logoPosition !== 'hidden' && (
                        <div style={{
                            width: isNarrow ? 34 : 52, height: isNarrow ? 34 : 52,
                            borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            order: brand.logoPosition === 'right' ? 2 : 0,
                        }}>
                            <ImageIcon style={{ width: isNarrow ? 16 : 24, height: isNarrow ? 16 : 24, opacity: 0.7 }} />
                        </div>
                    )}
                    <div style={{ textAlign: brand.logoPosition === 'center' ? 'center' : 'left' }}>
                        {sections.showHospitalName && (
                            <div style={{ fontWeight: 900, fontSize: isNarrow ? 13 : 18, letterSpacing: 0.4 }}>
                                ELITE MEDICAL CENTER
                            </div>
                        )}
                        {sections.showAddress && (
                            <div style={{ fontSize: isNarrow ? 9 : 11, opacity: 0.85, marginTop: 3 }}>
                                123 Hospital Road, Thrissur, Kerala – 680001
                            </div>
                        )}
                        {sections.showPhone && (
                            <div style={{ fontSize: isNarrow ? 9 : 10, opacity: 0.75, marginTop: 2 }}>
                                +91 98765 43210{sections.showEmail ? '  ·  info@elitehospital.in' : ''}
                            </div>
                        )}
                        {sections.showTaxId && (
                            <div style={{ fontSize: 9, opacity: 0.65, marginTop: 1 }}>GSTIN: 32AABCE1234F1Z5</div>
                        )}
                    </div>
                </div>

                <div style={{ padding: isNarrow ? '10px 14px' : '20px 28px' }}>
                    {/* Bill meta row */}
                    {!isNarrow && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 14, borderBottom: `2px solid ${brand.primaryColor}22` }}>
                            <div>
                                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Bill To</div>
                                <div style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>JOHN DOE</div>
                                {sections.showPatientId && <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>Patient ID: P-900827</div>}
                                {sections.showDoctorName && <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1 }}>Dr. Alexander Fleming – Cardiology</div>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 900, fontSize: 13, color: brand.primaryColor }}>TAX INVOICE</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>INV-2026-00142</div>
                                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>Date: 10 Jul 2026</div>
                                {sections.showDueDate && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 1 }}>Due: 25 Jul 2026</div>}
                            </div>
                        </div>
                    )}

                    {/* Items table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isNarrow ? 9.5 : 11 }}>
                        <thead>
                            <tr style={{ backgroundColor: brand.primaryColor + '18' }}>
                                <th style={{ padding: isNarrow ? '6px 8px' : '8px 12px', textAlign: 'left', fontWeight: 800, fontSize: isNarrow ? 8 : 9.5, textTransform: 'uppercase', color: brand.primaryColor, letterSpacing: 0.5 }}>
                                    Description
                                </th>
                                {sections.showUOMColumn && !isNarrow && <th style={{ padding: '8px 6px', textAlign: 'center', color: brand.primaryColor, fontWeight: 700, fontSize: 9 }}>Unit</th>}
                                {sections.showHSNColumn && !isNarrow && <th style={{ padding: '8px 6px', textAlign: 'center', color: brand.primaryColor, fontWeight: 700, fontSize: 9 }}>HSN</th>}
                                <th style={{ padding: isNarrow ? '6px 5px' : '8px 6px', textAlign: 'right', color: brand.primaryColor, fontWeight: 700, fontSize: 9 }}>Qty</th>
                                <th style={{ padding: isNarrow ? '6px 5px' : '8px 6px', textAlign: 'right', color: brand.primaryColor, fontWeight: 700, fontSize: 9 }}>Rate</th>
                                {sections.showDiscountColumn && !isNarrow && <th style={{ padding: '8px 6px', textAlign: 'right', color: '#16a34a', fontWeight: 700, fontSize: 9 }}>Disc%</th>}
                                {sections.showTaxColumn && <th style={{ padding: isNarrow ? '6px 5px' : '8px 6px', textAlign: 'right', color: brand.primaryColor, fontWeight: 700, fontSize: 9 }}>Tax</th>}
                                <th style={{ padding: isNarrow ? '6px 8px' : '8px 12px', textAlign: 'right', color: brand.primaryColor, fontWeight: 700, fontSize: 9 }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { name: 'Consultation Fee', uom: 'Nos', hsn: '999311', qty: 1, rate: 500, disc: 0, tax: 25, total: 525 },
                                { name: 'Lab Test – CBC', uom: 'Nos', hsn: '999312', qty: 1, rate: 350, disc: 0, tax: 17, total: 367 },
                                { name: 'Paracetamol 500mg', uom: 'Pcs', hsn: '30049099', qty: 10, rate: 12, disc: 5, tax: 6, total: 120 },
                            ].map((item, i) => (
                                <tr key={item.name} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: i % 2 === 0 ? '#fafbfc' : '#ffffff' }}>
                                    <td style={{ padding: isNarrow ? '5px 8px' : '7px 12px' }}>{item.name}</td>
                                    {sections.showUOMColumn && !isNarrow && <td style={{ padding: '7px 6px', textAlign: 'center', color: '#94a3b8' }}>{item.uom}</td>}
                                    {sections.showHSNColumn && !isNarrow && <td style={{ padding: '7px 6px', textAlign: 'center', color: '#94a3b8', fontSize: 9 }}>{item.hsn}</td>}
                                    <td style={{ padding: isNarrow ? '5px 5px' : '7px 6px', textAlign: 'right' }}>{item.qty}</td>
                                    <td style={{ padding: isNarrow ? '5px 5px' : '7px 6px', textAlign: 'right' }}>₹{item.rate}</td>
                                    {sections.showDiscountColumn && !isNarrow && <td style={{ padding: '7px 6px', textAlign: 'right', color: '#16a34a' }}>{item.disc || '—'}</td>}
                                    {sections.showTaxColumn && <td style={{ padding: isNarrow ? '5px 5px' : '7px 6px', textAlign: 'right', color: '#64748b' }}>₹{item.tax}</td>}
                                    <td style={{ padding: isNarrow ? '5px 8px' : '7px 12px', textAlign: 'right', fontWeight: 700 }}>₹{item.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                        <div style={{ minWidth: 160 }}>
                            {sections.showTaxColumn && !isNarrow && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 10, color: '#64748b', marginBottom: 3 }}>
                                        <span>Subtotal</span><span>₹ 1,012</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 10, color: '#64748b', marginBottom: 8 }}>
                                        <span>Total Tax</span><span>₹ 48</span>
                                    </div>
                                </>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, paddingTop: 8, borderTop: `2px solid ${brand.primaryColor}` }}>
                                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: brand.primaryColor }}>Grand Total</span>
                                <span style={{ fontSize: isNarrow ? 16 : 20, fontWeight: 900, color: brand.primaryColor }}>₹ 1,060</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    {!isNarrow && (sections.showBankDetails || sections.showSignature) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                            {sections.showBankDetails ? (
                                <div style={{ fontSize: 9.5, color: '#64748b', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontWeight: 800, marginBottom: 3, color: '#334155' }}>Bank Details</div>
                                    <div>A/C: 1234567890  ·  IFSC: SBIN001234</div>
                                    <div>State Bank of India, Thrissur Branch</div>
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
                    {sections.showTerms && !isNarrow && (
                        <div style={{ marginTop: 14, fontSize: 8.5, color: '#94a3b8', borderTop: '1px dashed #e2e8f0', paddingTop: 8 }}>
                            <strong>Terms & Conditions:</strong> Payment due within 15 days. Goods once sold will not be returned. Subject to Thrissur jurisdiction.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Main Export ───────────────────────────────────────────────────────
interface PrintStudioProps {
    usage?: string
    initialTemplates?: any[]
    onTemplateUpdate?: () => void
}

type Tab = 'design' | 'sections' | 'roles' | 'automation'

export function PrintStudio({ usage = 'sale_bill', initialTemplates = [], onTemplateUpdate }: PrintStudioProps) {
    const router = useRouter()
    const [myTemplates, setMyTemplates] = useState<any[]>(initialTemplates)
    const [loadingTemplates, setLoadingTemplates] = useState(false)
    const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null)
    const [isNewTemplate, setIsNewTemplate] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<Tab>('design')
    const [templateName, setTemplateName] = useState('')
    const [selectedPresetId, setSelectedPresetId] = useState('classic_blue')
    const [brand, setBrand] = useState<PrintTemplatePreset['brand']>({
        primaryColor: '#1e3a8a', accentColor: '#3b82f6',
        headerBg: '#1e3a8a', headerText: '#ffffff',
        fontFamily: 'helvetica', logoPosition: 'left', logoSize: 70,
    })
    const [sections, setSections] = useState<PrintTemplatePreset['sections']>({
        showLogo: true, showHospitalName: true, showAddress: true,
        showPhone: true, showEmail: true, showTaxId: true,
        showPatientId: true, showDoctorName: true,
        showTaxColumn: true, showDiscountColumn: false, showUOMColumn: false, showHSNColumn: false,
        showBankDetails: false, showQRCode: false, showTerms: false, showSignature: true,
        showDueDate: false, showSerialNumbers: false,
    })
    const [paper, setPaper] = useState<'a4' | 'a5' | 'roll80'>('a4')
    const [roles, setRoles] = useState<string[]>([])
    const [automation, setAutomation] = useState({
        autoPrint: false, previewBeforePrint: true,
        whatsappOnSave: false, emailOnSave: false,
        actionAfterSave: 'success_screen', copies: 1,
    })

    const fetchTemplates = async () => {
        setLoadingTemplates(true)
        try {
            const res = await getPrintTemplates()
            if (res.success && res.data) {
                const data = res.data as Record<string, any[]>
                setMyTemplates(data[usage] || [])
            }
        } catch { } finally { setLoadingTemplates(false) }
    }

    useEffect(() => { fetchTemplates() }, [usage])

    const applyPreset = (p: PrintTemplatePreset) => {
        setSelectedPresetId(p.id)
        setBrand(p.brand)
        setSections(p.sections)
        setPaper(p.paper)
        if (!templateName) setTemplateName(p.name)
    }

    const loadTemplate = (tpl: any) => {
        setActiveTemplateId(tpl.id)
        setIsNewTemplate(false)
        setTemplateName(tpl.name || '')
        const cfg = tpl.config || {}
        const meta = (tpl.metadata as any) || {}
        if (cfg.brand) setBrand((b: any) => ({ ...b, ...cfg.brand }))
        if (cfg.sections) setSections((s: any) => ({ ...s, ...cfg.sections }))
        if (cfg.pageSizeSettings?.format) setPaper(cfg.pageSizeSettings.format)
        if (meta.defaultForRoles) setRoles(meta.defaultForRoles)
        if (cfg.automation) setAutomation((a: any) => ({ ...a, ...cfg.automation }))
        setActiveTab('design')
    }

    const startNew = () => {
        setActiveTemplateId(null)
        setIsNewTemplate(true)
        setTemplateName('')
        const p = BUILT_IN_PRESETS[0]
        setBrand(p.brand); setSections(p.sections); setPaper(p.paper)
        setRoles([]); setActiveTab('design')
    }

    const handleSave = async () => {
        if (!templateName.trim()) {
            toast.error('Enter template name first!')
            return
        }
        setIsSaving(true)
        try {
            const config = {
                brand, sections, pageSizeSettings: { format: paper },
                columns: { showTax: sections.showTaxColumn, showDiscount: sections.showDiscountColumn, showUOM: sections.showUOMColumn, showHsn: sections.showHSNColumn },
                automation, advanced: { showBankDetails: sections.showBankDetails, showQRCode: sections.showQRCode, showTerms: sections.showTerms, showSignature: sections.showSignature },
                presetId: selectedPresetId, source: 'print_studio',
            }
            const metadata = { defaultForRoles: roles }
            if (!isNewTemplate && activeTemplateId) {
                const res = await updatePrintTemplateConfig(activeTemplateId, config, metadata)
                if (!res.success) throw new Error(res.error)
                toast.success('✅ Updated!', { description: `"${templateName}" saved.` })
            } else {
                const res = await createPrintTemplate({ name: templateName.trim(), usage, config, metadata })
                if (!res.success) throw new Error(res.error)
                setActiveTemplateId(res.id ?? null)
                setIsNewTemplate(false)
                toast.success('✅ Template Saved!', { description: 'Now click "Set as Default" to activate it.' })
            }
            await fetchTemplates()
            router.refresh()
        } catch (e: any) {
            toast.error('Save Failed', { description: e.message })
        } finally { setIsSaving(false) }
    }

    const handleSetDefault = async (id: string) => {
        const res = await setPrintTemplateActive(id, usage)
        if (res.success) { toast.success('⚡ Activated as Default!'); await fetchTemplates(); router.refresh() }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this template?')) return
        const res = await deletePrintTemplate(id)
        if (res.success) { toast.success('Deleted'); startNew(); await fetchTemplates(); router.refresh() }
        else toast.error('Cannot Delete', { description: res.error })
    }

    const activeData = myTemplates.find(t => t.id === activeTemplateId)
    const isDefault = activeData?.is_default

    const TABS: { id: Tab; label: string }[] = [
        { id: 'design', label: '🎨 Design & Style' },
        { id: 'sections', label: '📋 Show / Hide Fields' },
        { id: 'roles', label: '👥 Role Access' },
        { id: 'automation', label: '⚡ Automation' },
    ]

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'inherit', overflow: 'hidden', backgroundColor: '#f8fafc' }}>

            {/* ═══════════════════════════════════════
                LEFT PANEL — 320px fixed
            ═══════════════════════════════════════ */}
            <div style={{
                width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column',
                borderRight: '1px solid #e2e8f0', backgroundColor: 'white', overflow: 'hidden',
            }}>

                {/* Top: Saved templates */}
                <div style={{ borderBottom: '1px solid #f1f5f9', padding: '12px 16px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                            {loadingTemplates ? 'Loading...' : `${myTemplates.length} Saved Template${myTemplates.length !== 1 ? 's' : ''}`}
                        </span>
                        <button onClick={startNew} style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Plus style={{ width: 12, height: 12 }} /> New
                        </button>
                    </div>
                    <div style={{ maxHeight: 130, overflowY: 'auto', paddingBottom: 10 }}>
                        {myTemplates.map(tpl => {
                            const isActive = activeTemplateId === tpl.id
                            const color = (tpl.config as any)?.brand?.primaryColor || '#4f46e5'
                            return (
                                <button key={tpl.id} onClick={() => loadTemplate(tpl)} style={{
                                    width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '7px 10px', borderRadius: 8, marginBottom: 2, border: 'none', cursor: 'pointer',
                                    backgroundColor: isActive ? '#4f46e5' : 'transparent', transition: 'background 0.15s',
                                }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? 'white' : '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tpl.name}</span>
                                    {tpl.is_default && <Star style={{ width: 11, height: 11, color: isActive ? '#fcd34d' : '#10b981', flexShrink: 0 }} />}
                                </button>
                            )
                        })}
                        {myTemplates.length === 0 && !loadingTemplates && (
                            <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>No templates yet</p>
                        )}
                    </div>
                </div>

                {/* ── TEMPLATE NAME INPUT — Always visible ── */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', backgroundColor: !templateName.trim() ? '#fff7f7' : 'white' }}>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                        Template Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        placeholder="e.g. Standard A4 Invoice"
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            border: `2px solid ${!templateName.trim() ? '#fca5a5' : '#e2e8f0'}`,
                            borderRadius: 8, padding: '8px 12px',
                            fontSize: 13, fontWeight: 600, color: '#0f172a',
                            backgroundColor: 'white', outline: 'none',
                            transition: 'border-color 0.2s',
                        }}
                        onFocus={e => { e.target.style.borderColor = '#4f46e5' }}
                        onBlur={e => { e.target.style.borderColor = !templateName.trim() ? '#fca5a5' : '#e2e8f0' }}
                    />
                    {!templateName.trim() && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 10, color: '#ef4444' }}>
                            <AlertCircle style={{ width: 11, height: 11 }} />
                            <span>Required — enter a name before saving</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: '8px 10px', borderBottom: '1px solid #f1f5f9' }}>
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none',
                            cursor: 'pointer', fontSize: 12, fontWeight: activeTab === tab.id ? 800 : 600,
                            color: activeTab === tab.id ? '#4f46e5' : '#64748b',
                            backgroundColor: activeTab === tab.id ? '#eef2ff' : 'transparent',
                            marginBottom: 2, transition: 'all 0.15s',
                        }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content (scrollable) */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>

                    {/* ── DESIGN TAB ── */}
                    {activeTab === 'design' && (
                        <div>
                            {/* Preset gallery */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                                    1. Pick a Base Design
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {BUILT_IN_PRESETS.map(p => {
                                        const sel = selectedPresetId === p.id && isNewTemplate
                                        return (
                                            <button key={p.id} onClick={() => applyPreset(p)} style={{
                                                border: `2px solid ${sel ? '#4f46e5' : '#e2e8f0'}`,
                                                borderRadius: 10, padding: '10px 8px', cursor: 'pointer',
                                                backgroundColor: sel ? '#eef2ff' : 'white', textAlign: 'center',
                                                transition: 'all 0.15s', boxShadow: sel ? '0 0 0 3px #4f46e520' : 'none',
                                            }}>
                                                <div style={{ width: 32, height: 20, borderRadius: 3, margin: '0 auto 6px', backgroundColor: p.previewColors.header }} />
                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                                                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>{p.paper.toUpperCase()}</div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Paper size */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>2. Paper Size</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {PAPER_OPTIONS.map(opt => (
                                        <button key={opt.value} onClick={() => setPaper(opt.value as any)} style={{
                                            flex: 1, border: `2px solid ${paper === opt.value ? '#4f46e5' : '#e2e8f0'}`,
                                            borderRadius: 8, padding: '8px 4px', cursor: 'pointer',
                                            backgroundColor: paper === opt.value ? '#eef2ff' : 'white',
                                            textAlign: 'center', transition: 'all 0.15s',
                                        }}>
                                            <div style={{ fontSize: 18 }}>{opt.icon}</div>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginTop: 2 }}>{opt.label.split(' ')[0]}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Brand color */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>3. Brand Color</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                    {COLOR_PALETTES.filter(p => p.primary).map(p => (
                                        <button key={p.label} title={p.label}
                                            onClick={() => setBrand(b => ({ ...b, primaryColor: p.primary, accentColor: p.accent, headerBg: p.primary }))}
                                            style={{
                                                width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                                                backgroundColor: p.primary,
                                                border: `3px solid ${brand.primaryColor === p.primary ? '#1e293b' : 'transparent'}`,
                                                boxShadow: brand.primaryColor === p.primary ? '0 0 0 2px white inset' : 'none',
                                                transition: 'all 0.15s',
                                            }} />
                                    ))}
                                </div>
                                {/* Custom color pickers */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Header / Primary</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px' }}>
                                            <input type="color" value={brand.primaryColor}
                                                onChange={e => setBrand(b => ({ ...b, primaryColor: e.target.value, headerBg: e.target.value }))}
                                                style={{ width: 24, height: 24, border: 'none', cursor: 'pointer', padding: 0, background: 'none', borderRadius: 4 }} />
                                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{brand.primaryColor}</span>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Accent / Lines</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px' }}>
                                            <input type="color" value={brand.accentColor}
                                                onChange={e => setBrand(b => ({ ...b, accentColor: e.target.value }))}
                                                style={{ width: 24, height: 24, border: 'none', cursor: 'pointer', padding: 0, background: 'none', borderRadius: 4 }} />
                                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b' }}>{brand.accentColor}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Font */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>4. Font</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {FONT_OPTIONS.map(f => (
                                        <button key={f.value} onClick={() => setBrand(b => ({ ...b, fontFamily: f.value as any }))} style={{
                                            flex: 1, border: `2px solid ${brand.fontFamily === f.value ? '#4f46e5' : '#e2e8f0'}`,
                                            borderRadius: 8, padding: '8px 4px', cursor: 'pointer',
                                            backgroundColor: brand.fontFamily === f.value ? '#eef2ff' : 'white', textAlign: 'center',
                                        }}>
                                            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: f.value === 'helvetica' ? 'Arial' : f.value === 'times' ? 'Georgia' : 'monospace' }}>Aa</div>
                                            <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{f.label.split(' ')[0]}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Logo position */}
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>5. Logo Position</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {(['left', 'center', 'right', 'hidden'] as const).map(pos => (
                                        <button key={pos} onClick={() => setBrand(b => ({ ...b, logoPosition: pos }))} style={{
                                            flex: 1, border: `2px solid ${brand.logoPosition === pos ? '#4f46e5' : '#e2e8f0'}`,
                                            borderRadius: 8, padding: '6px 2px', cursor: 'pointer',
                                            backgroundColor: brand.logoPosition === pos ? '#eef2ff' : 'white', textAlign: 'center',
                                            fontSize: 10, fontWeight: 700, color: brand.logoPosition === pos ? '#4f46e5' : '#64748b',
                                            textTransform: 'capitalize',
                                        }}>
                                            {pos}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── SECTIONS TAB ── */}
                    {activeTab === 'sections' && (
                        <div>
                            {SECTIONS_CONFIG.map(group => (
                                <div key={group.group} style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '8px 8px 0 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: 14 }}>{group.icon}</span>
                                        <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>{group.group}</span>
                                    </div>
                                    <div style={{ border: '1px solid #f1f5f9', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                                        {group.items.map((item, idx) => (
                                            <div key={item.key} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '9px 12px',
                                                borderTop: idx > 0 ? '1px solid #f8fafc' : 'none',
                                                backgroundColor: 'white',
                                            }}>
                                                <span
                                                    style={{ fontSize: 12, color: '#334155', cursor: 'pointer', userSelect: 'none' }}
                                                    onClick={() => setSections(s => ({ ...s, [item.key]: !s[item.key as keyof typeof s] }))}
                                                >
                                                    {item.label}
                                                </span>
                                                <Toggle
                                                    checked={sections[item.key as keyof typeof sections] as boolean}
                                                    onChange={v => setSections(s => ({ ...s, [item.key]: v }))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── ROLES TAB ── */}
                    {activeTab === 'roles' && (
                        <div>
                            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 14, lineHeight: 1.5 }}>
                                Users with selected roles will automatically use this template when printing.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                {ROLES.map(role => {
                                    const on = roles.includes(role)
                                    return (
                                        <button key={role} onClick={() => setRoles(r => on ? r.filter(x => x !== role) : [...r, role])} style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '9px 10px', borderRadius: 8, border: `2px solid ${on ? '#4f46e5' : '#e2e8f0'}`,
                                            cursor: 'pointer', backgroundColor: on ? '#eef2ff' : 'white',
                                            transition: 'all 0.15s',
                                        }}>
                                            <div style={{
                                                width: 14, height: 14, borderRadius: '50%', border: `2px solid ${on ? '#4f46e5' : '#cbd5e1'}`,
                                                backgroundColor: on ? '#4f46e5' : 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}>
                                                {on && <Check style={{ width: 8, height: 8, color: 'white' }} />}
                                            </div>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: on ? '#4f46e5' : '#64748b' }}>{role}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── AUTOMATION TAB ── */}
                    {activeTab === 'automation' && (
                        <div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Action After Saving Bill</label>
                                <select value={automation.actionAfterSave} onChange={e => setAutomation(a => ({ ...a, actionAfterSave: e.target.value }))}
                                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#0f172a', backgroundColor: 'white', outline: 'none' }}>
                                    <option value="success_screen">Show Success Screen</option>
                                    <option value="new_bill">Open New Bill (Fast Mode)</option>
                                    <option value="list">Go to Bill List</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Number of Print Copies</label>
                                <input type="number" min={1} max={5} value={automation.copies}
                                    onChange={e => setAutomation(a => ({ ...a, copies: Number(e.target.value) }))}
                                    style={{ width: 80, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px', fontSize: 14, fontWeight: 700, textAlign: 'center', color: '#0f172a', outline: 'none' }} />
                            </div>
                            {[
                                { k: 'autoPrint', l: 'Auto-Print (Skip Preview)' },
                                { k: 'previewBeforePrint', l: 'Show Preview Before Print' },
                                { k: 'whatsappOnSave', l: 'Send WhatsApp Automatically' },
                                { k: 'emailOnSave', l: 'Send Email Automatically' },
                            ].map(item => (
                                <div key={item.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ fontSize: 12, color: '#334155' }}>{item.l}</span>
                                    <Toggle checked={automation[item.k as keyof typeof automation] as boolean}
                                        onChange={v => setAutomation(a => ({ ...a, [item.k]: v }))} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Bottom Action Buttons ── */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button onClick={handleSave} disabled={isSaving || !templateName.trim()} style={{
                        width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: isSaving || !templateName.trim() ? 'not-allowed' : 'pointer',
                        backgroundColor: isSaving || !templateName.trim() ? '#e2e8f0' : '#4f46e5',
                        color: isSaving || !templateName.trim() ? '#94a3b8' : 'white',
                        fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.15s', boxShadow: templateName.trim() ? '0 2px 8px #4f46e540' : 'none',
                    }}>
                        {isSaving ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 14, height: 14 }} />}
                        {isSaving ? 'Saving...' : isNewTemplate ? 'Save Template' : 'Update Template'}
                    </button>

                    {activeTemplateId && !isNewTemplate && (
                        <div style={{ display: 'flex', gap: 8 }}>
                            {!isDefault ? (
                                <button onClick={() => handleSetDefault(activeTemplateId)} style={{
                                    flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    backgroundColor: '#059669', color: 'white', fontSize: 12, fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                }}>
                                    <Star style={{ width: 13, height: 13 }} /> Set as Default
                                </button>
                            ) : (
                                <div style={{ flex: 1, padding: '9px', borderRadius: 8, backgroundColor: '#d1fae5', color: '#065f46', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    <Check style={{ width: 13, height: 13 }} /> Is Default
                                </div>
                            )}
                            <button onClick={() => handleDelete(activeTemplateId)} style={{
                                padding: '9px 12px', borderRadius: 8, border: '1px solid #fecaca',
                                cursor: 'pointer', backgroundColor: 'white', color: '#ef4444',
                            }}>
                                <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════
                RIGHT PANEL — Live Preview fills rest
            ═══════════════════════════════════════ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Preview header */}
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>Live Preview</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>— updates instantly as you design</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: 20 }}>
                        {paper === 'roll80' ? '80mm Thermal Roll' : paper === 'a5' ? 'A5 Half Page' : 'A4 Full Page'}
                    </span>
                </div>
                {/* Live preview fills remaining height */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <LivePreview brand={brand} sections={sections} paper={paper} />
                </div>
            </div>
        </div>
    )
}
