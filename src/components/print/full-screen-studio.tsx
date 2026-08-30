'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, Plus, Trash2, Star, Loader2, AlertCircle, GripVertical, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import {
    setPrintTemplateActive, updatePrintTemplateConfig,
    createPrintTemplate, deletePrintTemplate, getPrintTemplates
} from '@/app/actions/print-settings'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type BlockType = 'header' | 'bill_info' | 'table' | 'summary' | 'payment' | 'footer'
type PaperSize = 'a4' | 'a5' | 'roll80'

interface BlockStyle { fontSize: number; bold: boolean; align: 'left' | 'center' | 'right'; padding: number }

interface Block {
    id: BlockType
    label: string
    enabled: boolean
    variant: string   // 'A' | 'B' | 'C' | 'D'
    fields: Record<string, boolean>
    style: BlockStyle
}

interface Theme {
    primaryColor: string
    accentColor: string
    fontFamily: string
    paperSize: PaperSize
    headerBg: string
    headerText: string
}

interface PrintLayout { blocks: Block[]; theme: Theme }

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────

const DEFAULT_THEME: Theme = {
    primaryColor: '#1e3a8a', accentColor: '#3b82f6',
    fontFamily: 'Arial', paperSize: 'a4',
    headerBg: '#1e3a8a', headerText: '#ffffff'
}

const DEFAULT_BLOCKS: Block[] = [
    {
        id: 'header', label: 'Header', enabled: true, variant: 'A',
        fields: { logo: true, hospitalName: true, address: true, phone: true, email: false, gstin: true, tagline: false },
        style: { fontSize: 13, bold: false, align: 'left', padding: 24 }
    },
    {
        id: 'bill_info', label: 'Patient & Bill Info', enabled: true, variant: 'A',
        fields: { showTaxInvoiceTitle: true, patientName: true, patientId: true, doctorName: true, opNumber: true, billNumber: true, billDate: true, dueDate: false, phone: false },
        style: { fontSize: 11, bold: false, align: 'left', padding: 16 }
    },
    {
        id: 'table', label: 'Items Table', enabled: true, variant: 'A',
        fields: { slNo: true, item: true, uom: false, hsn: false, qty: true, rate: true, discount: false, tax: true, amount: true },
        style: { fontSize: 10, bold: false, align: 'left', padding: 0 }
    },
    {
        id: 'summary', label: 'Bill Summary', enabled: true, variant: 'A',
        fields: { subtotal: true, discount: true, taxBreakdown: true, roundOff: true, grandTotal: true, amountInWords: true },
        style: { fontSize: 11, bold: false, align: 'right', padding: 16 }
    },
    {
        id: 'payment', label: 'Payment Info', enabled: false, variant: 'A',
        fields: { paymentMode: true, received: true, balance: true, upiRef: false },
        style: { fontSize: 11, bold: false, align: 'left', padding: 16 }
    },
    {
        id: 'footer', label: 'Footer', enabled: true, variant: 'A',
        fields: { bankDetails: false, terms: false, signature: true, qrCode: false, thankYou: true },
        style: { fontSize: 10, bold: false, align: 'left', padding: 16 }
    },
]

// ─── BLOCK VARIANT DEFINITIONS ────────────────────────────────────────────────

const BLOCK_VARIANTS: Record<BlockType, { id: string; label: string; desc: string }[]> = {
    header: [
        { id: 'A', label: 'Logo Left', desc: 'Logo left, name & address right' },
        { id: 'B', label: 'Centered', desc: 'Logo above, name centered' },
        { id: 'C', label: '3-Column', desc: 'Logo | Name+Address | Bill No+Date' },
        { id: 'D', label: 'Minimal', desc: 'Name only, no logo, clean bar' },
    ],
    bill_info: [
        { id: 'A', label: '2-Column', desc: 'Patient left | Bill details right' },
        { id: 'B', label: '3-Column', desc: 'Patient | Doctor | Bill No/Date' },
        { id: 'C', label: 'Compact', desc: 'Single row, minimal space' },
    ],
    table: [
        { id: 'A', label: 'Striped', desc: 'Alternating row shading' },
        { id: 'B', label: 'Bordered', desc: 'Full grid lines, formal' },
    ],
    summary: [
        { id: 'A', label: 'Right Side', desc: 'Totals right-aligned' },
        { id: 'B', label: 'Full Width', desc: 'Tax breakdown full width' },
    ],
    payment: [
        { id: 'A', label: 'Inline', desc: 'Horizontal payment details' },
        { id: 'B', label: 'Card', desc: 'Boxed payment summary' },
    ],
    footer: [
        { id: 'A', label: 'Bank + Sign', desc: 'Bank left, signature right' },
        { id: 'B', label: 'Terms + Sign', desc: 'Terms full width, signature below' },
        { id: 'C', label: 'QR + Sign', desc: 'QR code left, signature right' },
    ],
}

const BLOCK_FIELDS: Record<BlockType, { key: string; label: string }[]> = {
    header: [
        { key: 'logo', label: 'Logo' }, { key: 'hospitalName', label: 'Hospital Name' },
        { key: 'address', label: 'Address' }, { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' }, { key: 'gstin', label: 'GSTIN' }, { key: 'tagline', label: 'Tagline' }
    ],
    bill_info: [
        { key: 'showTaxInvoiceTitle', label: 'Tax Invoice Title' },
        { key: 'patientName', label: 'Patient Name' }, { key: 'patientId', label: 'Patient ID' },
        { key: 'doctorName', label: 'Doctor Name' }, { key: 'opNumber', label: 'OP Number' },
        { key: 'billNumber', label: 'Bill Number' }, { key: 'billDate', label: 'Bill Date' },
        { key: 'dueDate', label: 'Due Date' }, { key: 'phone', label: 'Phone' }
    ],
    table: [
        { key: 'slNo', label: 'Sl No' }, { key: 'item', label: 'Item Name' },
        { key: 'uom', label: 'Unit (UOM)' }, { key: 'hsn', label: 'HSN Code' },
        { key: 'qty', label: 'Qty' }, { key: 'rate', label: 'Rate' },
        { key: 'discount', label: 'Discount' }, { key: 'tax', label: 'GST/Tax' }, { key: 'amount', label: 'Amount' }
    ],
    summary: [
        { key: 'subtotal', label: 'Subtotal' }, { key: 'discount', label: 'Discount' },
        { key: 'taxBreakdown', label: 'Tax Breakdown' }, { key: 'roundOff', label: 'Round Off' },
        { key: 'grandTotal', label: 'Grand Total' }, { key: 'amountInWords', label: 'Amount in Words' }
    ],
    payment: [
        { key: 'paymentMode', label: 'Payment Mode' }, { key: 'received', label: 'Received' },
        { key: 'balance', label: 'Balance Due' }, { key: 'upiRef', label: 'UPI Ref No' }
    ],
    footer: [
        { key: 'bankDetails', label: 'Bank Details' }, { key: 'terms', label: 'Terms & Conditions' },
        { key: 'signature', label: 'Signature' }, { key: 'qrCode', label: 'QR Code' }, { key: 'thankYou', label: 'Thank You Note' }
    ],
}

// ─── PREMIUM TEMPLATES ────────────────────────────────────────────────────────

const PREMIUM_TEMPLATES: { name: string; color: string; theme: Partial<Theme> }[] = [
    { name: 'Royal Blue', color: '#1e3a8a', theme: { primaryColor: '#1e3a8a', headerBg: '#1e3a8a', headerText: '#fff', accentColor: '#3b82f6', fontFamily: 'Arial' } },
    { name: 'Emerald', color: '#065f46', theme: { primaryColor: '#065f46', headerBg: '#065f46', headerText: '#fff', accentColor: '#10b981', fontFamily: 'Arial' } },
    { name: 'Minimal', color: '#0f172a', theme: { primaryColor: '#0f172a', headerBg: '#f8fafc', headerText: '#0f172a', accentColor: '#64748b', fontFamily: 'Arial' } },
    { name: 'Crimson', color: '#991b1b', theme: { primaryColor: '#991b1b', headerBg: '#991b1b', headerText: '#fff', accentColor: '#ef4444', fontFamily: 'Arial' } },
    { name: 'Violet', color: '#5b21b6', theme: { primaryColor: '#5b21b6', headerBg: '#5b21b6', headerText: '#fff', accentColor: '#8b5cf6', fontFamily: 'Arial' } },
    { name: 'Corporate', color: '#0c4a6e', theme: { primaryColor: '#0c4a6e', headerBg: '#0c4a6e', headerText: '#fff', accentColor: '#0ea5e9', fontFamily: 'Arial' } },
    { name: 'Gold', color: '#92400e', theme: { primaryColor: '#92400e', headerBg: '#78350f', headerText: '#fef3c7', accentColor: '#f59e0b', fontFamily: 'Georgia' } },
    { name: 'Nature', color: '#14532d', theme: { primaryColor: '#14532d', headerBg: '#14532d', headerText: '#dcfce7', accentColor: '#22c55e', fontFamily: 'Arial' } },
    { name: 'Navy', color: '#1e293b', theme: { primaryColor: '#1e293b', headerBg: '#0f172a', headerText: '#e2e8f0', accentColor: '#475569', fontFamily: 'Arial' } },
    { name: 'Rose', color: '#9f1239', theme: { primaryColor: '#9f1239', headerBg: '#9f1239', headerText: '#fff', accentColor: '#fb7185', fontFamily: 'Arial' } },
]

// ─── CANVAS — BILL RENDERER ───────────────────────────────────────────────────

function BillCanvas({ blocks, theme, selectedId, onSelect }: {
    blocks: Block[]; theme: Theme; selectedId: BlockType | null; onSelect: (id: BlockType) => void
}) {
    const narrow = theme.paperSize === 'roll80'
    const W = narrow ? 240 : theme.paperSize === 'a5' ? 420 : 560
    const ff = theme.fontFamily === 'Georgia' ? 'Georgia, serif' : theme.fontFamily === 'Courier New' ? 'Courier New, monospace' : 'Arial, sans-serif'
    const pc = theme.primaryColor

    const blockWrap = (block: Block, content: React.ReactNode) => {
        const sel = selectedId === block.id
        return (
            <div
                key={block.id}
                onClick={(e) => { e.stopPropagation(); onSelect(block.id) }}
                style={{
                    position: 'relative', cursor: 'pointer',
                    outline: sel ? `2.5px solid ${pc}` : '2px solid transparent',
                    outlineOffset: sel ? -1 : 0,
                    transition: 'outline .15s',
                    borderRadius: block.id === 'header' ? '2px 2px 0 0' : 0,
                }}
            >
                {sel && (
                    <div style={{ position: 'absolute', top: 4, right: 6, background: pc, color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4, zIndex: 5, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        {block.label}
                    </div>
                )}
                {content}
            </div>
        )
    }

    const enabledBlocks = blocks.filter(b => b.enabled)

    return (
        <div style={{ background: '#fff', width: W, fontFamily: ff, fontSize: 11, color: '#1e293b', boxShadow: '0 4px 32px rgba(0,0,0,0.18)', borderRadius: 3 }}>
            {enabledBlocks.map(block => {
                const f = block.fields
                const s = block.style
                const pad = narrow ? Math.max(8, s.padding * 0.6) : s.padding

                if (block.id === 'header') {
                    const headerStyle: React.CSSProperties = { background: theme.headerBg, color: theme.headerText, padding: pad, fontFamily: ff }

                    if (block.variant === 'A') return blockWrap(block,
                        <div style={{ ...headerStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
                            {f.logo && <div style={{ width: narrow ? 36 : 52, height: narrow ? 36 : 52, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>🏥</div>}
                            <div>
                                {f.hospitalName && <div style={{ fontWeight: 900, fontSize: narrow ? 14 : s.fontSize + 6, letterSpacing: -0.3 }}>ELITE MEDICAL CENTER</div>}
                                {f.tagline && <div style={{ fontSize: 10, opacity: 0.75, fontStyle: 'italic', marginTop: 1 }}>Your Health, Our Priority</div>}
                                {f.address && <div style={{ fontSize: narrow ? 8.5 : 10, opacity: 0.85, marginTop: 3 }}>123 Hospital Road, Thrissur, Kerala – 680001</div>}
                                {f.phone && <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>📞 +91 98765 43210{f.email ? '  ✉  info@elite.in' : ''}</div>}
                                {f.gstin && <div style={{ fontSize: 9, opacity: 0.65, marginTop: 1 }}>GSTIN: 32AABCE1234F1Z5</div>}
                            </div>
                        </div>
                    )
                    if (block.variant === 'B') return blockWrap(block,
                        <div style={{ ...headerStyle, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                            {f.logo && <div style={{ width: narrow ? 40 : 60, height: narrow ? 40 : 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏥</div>}
                            {f.hospitalName && <div style={{ fontWeight: 900, fontSize: narrow ? 14 : s.fontSize + 7 }}>ELITE MEDICAL CENTER</div>}
                            {f.tagline && <div style={{ fontSize: 10, opacity: 0.75, fontStyle: 'italic' }}>Your Health, Our Priority</div>}
                            {f.address && <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>123 Hospital Road, Thrissur, Kerala – 680001</div>}
                            {f.phone && <div style={{ fontSize: 10, opacity: 0.7 }}>+91 98765 43210{f.email ? '  ·  info@elite.in' : ''}</div>}
                            {f.gstin && <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>GSTIN: 32AABCE1234F1Z5</div>}
                        </div>
                    )
                    if (block.variant === 'C') return blockWrap(block,
                        <div style={{ ...headerStyle, display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 12, alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {f.logo && <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏥</div>}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                {f.hospitalName && <div style={{ fontWeight: 900, fontSize: s.fontSize + 5 }}>ELITE MEDICAL CENTER</div>}
                                {f.address && <div style={{ fontSize: 9.5, opacity: 0.8, marginTop: 2 }}>123 Hospital Road, Thrissur, Kerala – 680001</div>}
                                {f.phone && <div style={{ fontSize: 9, opacity: 0.7, marginTop: 1 }}>+91 98765 43210</div>}
                            </div>
                            <div style={{ textAlign: 'right', fontSize: 9, opacity: 0.8 }}>
                                {f.gstin && <div>GSTIN: 32AABCE1234F1Z5</div>}
                                {f.phone && <div style={{ marginTop: 3 }}>📞 +91 98765 43210</div>}
                            </div>
                        </div>
                    )
                    if (block.variant === 'D') return blockWrap(block,
                        <div style={{ ...headerStyle, borderBottom: `3px solid ${pc}`, background: '#fff', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 16 }}>
                            {f.logo && <div style={{ width: narrow ? 36 : 48, height: narrow ? 36 : 48, borderRadius: 8, background: `${pc}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>🏥</div>}
                            <div style={{ flex: 1 }}>
                                {f.hospitalName && <div style={{ fontWeight: 900, fontSize: s.fontSize + 6, color: pc }}>ELITE MEDICAL CENTER</div>}
                                {f.address && <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>123 Hospital Road, Thrissur, Kerala – 680001  {f.phone ? '| +91 98765 43210' : ''}</div>}
                                {f.gstin && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>GSTIN: 32AABCE1234F1Z5</div>}
                            </div>
                        </div>
                    )
                }

                if (block.id === 'bill_info') {
                    const bStyle: React.CSSProperties = { padding: pad, borderBottom: `1px solid ${pc}18` }
                    const label: React.CSSProperties = { fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: 0.8, marginBottom: 3 }
                    const val: React.CSSProperties = { fontWeight: s.bold ? 800 : 600, fontSize: s.fontSize, color: '#0f172a' }

                    if (block.variant === 'A') return blockWrap(block,
                        <div style={{ ...bStyle, display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <div style={label}>Bill To</div>
                                {f.patientName && <div style={{ ...val, fontSize: s.fontSize + 3, fontWeight: 900 }}>JOHN DOE</div>}
                                {f.patientId && <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Patient ID: P-900827</div>}
                                {f.phone && <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>📞 +91 98765 43210</div>}
                                {f.doctorName && <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>Dr. Alexander Fleming</div>}
                                {f.opNumber && <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>OP No: OP-2026-00312</div>}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {f.showTaxInvoiceTitle !== false && <div style={{ fontWeight: 900, fontSize: 13, color: pc }}>TAX INVOICE</div>}
                                {f.billNumber && <div style={{ fontWeight: 700, fontSize: 12, marginTop: 4 }}>INV-2026-00142</div>}
                                {f.billDate && <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Date: 10 Jul 2026</div>}
                                {f.dueDate && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 1 }}>Due: 25 Jul 2026</div>}
                            </div>
                        </div>
                    )
                    if (block.variant === 'B') return blockWrap(block,
                        <div style={{ ...bStyle, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            {[
                                { title: 'Patient', lines: [f.patientName && 'JOHN DOE', f.patientId && 'ID: P-900827', f.phone && '+91 98765 43210'].filter(Boolean) },
                                { title: 'Doctor', lines: [f.doctorName && 'Dr. Alexander Fleming', f.opNumber && 'OP: OP-2026-00312'].filter(Boolean) },
                                { title: 'Invoice', lines: [f.billNumber && 'INV-2026-00142', f.billDate && '10 Jul 2026', f.dueDate && 'Due: 25 Jul 2026'].filter(Boolean) },
                            ].map((col, i) => (
                                <div key={i} style={{ background: `${pc}08`, borderRadius: 6, padding: '8px 10px', border: `1px solid ${pc}18` }}>
                                    <div style={{ ...label, color: pc, marginBottom: 4 }}>{col.title}</div>
                                    {col.lines.map((l, j) => <div key={j} style={{ ...val, fontSize: 11 }}>{l}</div>)}
                                </div>
                            ))}
                        </div>
                    )
                    return blockWrap(block,
                        <div style={{ ...bStyle, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 10 }}>
                            {f.showTaxInvoiceTitle !== false && <span style={{ fontWeight: 900, color: pc }}>TAX INVOICE</span>}
                            {f.patientName && <span><strong>Patient:</strong> JOHN DOE</span>}
                            {f.patientId && <span><strong>ID:</strong> P-900827</span>}
                            {f.phone && <span><strong>Phone:</strong> +91 98765 43210</span>}
                            {f.doctorName && <span><strong>Dr:</strong> Dr. Alexander Fleming</span>}
                            {f.billNumber && <span style={{ marginLeft: 'auto', fontWeight: 800, color: pc }}>INV-2026-00142</span>}
                            {f.billDate && <span><strong>Date:</strong> 10 Jul 2026</span>}
                        </div>
                    )
                }

                if (block.id === 'table') {
                    const cols = [
                        f.slNo && { h: '#', w: 28 }, f.item && { h: 'Item / Description', w: null },
                        f.uom && { h: 'Unit', w: 36 }, f.hsn && { h: 'HSN', w: 50 },
                        f.qty && { h: 'Qty', w: 32 }, f.rate && { h: 'Rate', w: 50 },
                        f.discount && { h: 'Disc', w: 40 }, f.tax && { h: 'Tax', w: 40 }, f.amount && { h: 'Amt', w: 60 }
                    ].filter(Boolean) as { h: string; w: number | null }[]

                    const rows = [
                        ['1', 'Consultation Fee', 'Nos', '999311', '1', '₹500', '—', '₹25', '₹525'],
                        ['2', 'Lab Test – CBC', 'Nos', '999312', '1', '₹350', '—', '₹17', '₹367'],
                        ['3', 'Paracetamol 500mg', 'Pcs', '30049099', '10', '₹12', '₹5', '₹6', '₹120'],
                    ]

                    const fieldKeys = ['slNo', 'item', 'uom', 'hsn', 'qty', 'rate', 'discount', 'tax', 'amount']
                    const enabledIndices = fieldKeys.map((k, i) => f[k] ? i : -1).filter(i => i >= 0)

                    return blockWrap(block,
                        <div style={{ padding: `0 ${pad}px` }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: s.fontSize }}>
                                <thead>
                                    <tr style={{ background: `${pc}15` }}>
                                        {cols.map((col, i) => (
                                            <th key={i} style={{ padding: narrow ? '6px 6px' : '8px 10px', textAlign: col.h === 'Amt' || col.h === 'Rate' || col.h === 'Disc' || col.h === 'Tax' || col.h === 'Qty' ? 'right' : 'left', fontWeight: 800, fontSize: 8.5, textTransform: 'uppercase', color: pc, width: col.w || undefined, letterSpacing: 0.5 }}>{col.h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, ri) => (
                                        <tr key={ri} style={{ background: block.variant === 'A' ? (ri % 2 === 0 ? '#f9fafb' : '#fff') : '#fff', borderBottom: block.variant === 'B' ? `1px solid ${pc}20` : '1px solid #f1f5f9', borderTop: block.variant === 'B' ? `1px solid ${pc}10` : 'none' }}>
                                            {enabledIndices.map((ci, i) => (
                                                <td key={i} style={{ padding: narrow ? '5px 6px' : '7px 10px', textAlign: ci >= 4 ? 'right' : 'left', fontWeight: ci === 8 ? 700 : 400 }}>
                                                    {row[ci]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                }

                if (block.id === 'summary') {
                    const f2 = block.fields
                    if (block.variant === 'A') return blockWrap(block,
                        <div style={{ padding: pad, display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ minWidth: 200 }}>
                                {f2.subtotal && <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, padding: '4px 0', fontSize: s.fontSize, borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>Subtotal</span><span>₹ 1,012</span></div>}
                                {f2.discount && <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, padding: '4px 0', fontSize: s.fontSize, borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#16a34a' }}>Discount</span><span style={{ color: '#16a34a' }}>– ₹ 5</span></div>}
                                {f2.taxBreakdown && <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, padding: '4px 0', fontSize: s.fontSize, borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>GST (18%)</span><span>₹ 48</span></div>}
                                {f2.roundOff && <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, padding: '4px 0', fontSize: 9, borderBottom: '1px solid #f1f5f9', color: '#94a3b8' }}><span>Round Off</span><span>+ ₹ 0.00</span></div>}
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, padding: '10px 0 4px', borderTop: `2px solid ${pc}` }}>
                                    <span style={{ fontWeight: 900, fontSize: s.fontSize + 1, textTransform: 'uppercase', color: pc }}>Grand Total</span>
                                    <span style={{ fontWeight: 900, fontSize: narrow ? 16 : 22, color: pc }}>₹ 1,060</span>
                                </div>
                                {f2.amountInWords && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' }}>One Thousand Sixty Rupees Only</div>}
                            </div>
                        </div>
                    )
                    return blockWrap(block,
                        <div style={{ padding: pad, background: `${pc}06` }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                                {[['Subtotal', '₹ 1,012'], ['GST (IGST 18%)', '₹ 48'], ['Discount', '– ₹ 5']].map(([l, v]) => (
                                    <div key={l} style={{ background: 'white', border: `1px solid ${pc}20`, borderRadius: 6, padding: '8px 12px' }}>
                                        <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 3 }}>{l}</div>
                                        <div style={{ fontWeight: 800, fontSize: 13 }}>{v}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: pc, color: 'white', borderRadius: 8 }}>
                                <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Grand Total</span>
                                <span style={{ fontWeight: 900, fontSize: 22 }}>₹ 1,060</span>
                            </div>
                            {f2.amountInWords && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 8, fontStyle: 'italic', textAlign: 'center' }}>One Thousand Sixty Rupees Only</div>}
                        </div>
                    )
                }

                if (block.id === 'payment') {
                    const f3 = block.fields
                    return blockWrap(block,
                        <div style={{ padding: pad, background: '#f0fdf4', borderTop: '1px solid #bbf7d0', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: s.fontSize }}>
                            {f3.paymentMode && <span><strong>Mode:</strong> UPI</span>}
                            {f3.received && <span><strong>Received:</strong> ₹ 1,060</span>}
                            {f3.balance && <span style={{ color: '#16a34a' }}><strong>Balance:</strong> NIL</span>}
                            {f3.upiRef && <span style={{ color: '#64748b' }}><strong>Ref:</strong> UPI123456789</span>}
                        </div>
                    )
                }

                if (block.id === 'footer') {
                    const f4 = block.fields
                    if (block.variant === 'A') return blockWrap(block,
                        <div style={{ padding: pad, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
                            <div>
                                {f4.bankDetails && (
                                    <div style={{ fontSize: 9.5, color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: 800, marginBottom: 2 }}>Bank Details</div>
                                        <div>A/C: 1234567890  IFSC: SBIN001234</div>
                                        <div>State Bank of India, Thrissur</div>
                                    </div>
                                )}
                                {f4.thankYou && <div style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginTop: f4.bankDetails ? 6 : 0 }}>Thank you for choosing us! 🙏</div>}
                                {f4.terms && <div style={{ fontSize: 8.5, color: '#94a3b8', marginTop: 4, maxWidth: 280 }}>Payment due within 15 days. Subject to Thrissur jurisdiction.</div>}
                            </div>
                            {f4.signature && (
                                <div style={{ textAlign: 'center', fontSize: 9, color: '#64748b' }}>
                                    <div style={{ borderTop: '1px solid #334155', width: 130, marginBottom: 5 }} />
                                    Authorized Signatory
                                </div>
                            )}
                        </div>
                    )
                    if (block.variant === 'B') return blockWrap(block,
                        <div style={{ padding: pad, borderTop: '1px solid #e2e8f0' }}>
                            {f4.terms && <div style={{ fontSize: 8.5, color: '#64748b', background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                                <strong>Terms & Conditions:</strong> Payment due within 15 days. Goods once sold are non-refundable. Subject to Thrissur jurisdiction.
                            </div>}
                            {f4.thankYou && <div style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginBottom: 12 }}>Thank you for choosing us! 🙏</div>}
                            {f4.signature && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <div style={{ textAlign: 'center', fontSize: 9, color: '#64748b' }}>
                                        <div style={{ borderTop: '1px solid #334155', width: 130, marginBottom: 5 }} />
                                        Authorized Signatory
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                    return blockWrap(block,
                        <div style={{ padding: pad, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
                            {f4.qrCode && (
                                <div style={{ width: 70, height: 70, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#94a3b8' }}>QR</div>
                            )}
                            {f4.thankYou && <div style={{ fontSize: 9, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>Thank you!<br />Scan to pay</div>}
                            {f4.signature && (
                                <div style={{ textAlign: 'center', fontSize: 9, color: '#64748b' }}>
                                    <div style={{ borderTop: '1px solid #334155', width: 130, marginBottom: 5 }} />
                                    Authorized Signatory
                                </div>
                            )}
                        </div>
                    )
                }

                return null
            })}
        </div>
    )
}

// ─── TOGGLE ───────────────────────────────────────────────────────────────────

function Tog({ on, set }: { on: boolean; set: (v: boolean) => void }) {
    return (
        <button onClick={() => set(!on)} style={{ width: 34, height: 20, borderRadius: 10, padding: 2, border: 'none', cursor: 'pointer', background: on ? '#4f46e5' : '#e2e8f0', transition: 'background .2s', flexShrink: 0 }}>
            <span style={{ display: 'block', width: 16, height: 16, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transform: on ? 'translateX(14px)' : 'none', transition: 'transform .2s' }} />
        </button>
    )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface Props { 
    usage: string; 
    label: string; 
    initialTemplates: any[];
    initialTemplateId?: string;
    isExplicitNew?: boolean;
}

const layoutToConfig = (blocks: Block[], theme: Theme) => ({
    blocks, theme, source: 'print_studio_v2',
    // legacy compat
    brand: { primaryColor: theme.primaryColor, accentColor: theme.accentColor, headerBg: theme.headerBg, headerText: theme.headerText, fontFamily: theme.fontFamily },
    pageSizeSettings: { format: theme.paperSize },
})

const configToLayout = (config: any): { blocks: Block[]; theme: Theme } => ({
    blocks: config?.blocks || DEFAULT_BLOCKS,
    theme: config?.theme || { ...DEFAULT_THEME, ...(config?.brand || {}), paperSize: config?.pageSizeSettings?.format || 'a4' }
})

export function FullScreenStudio({ usage, label, initialTemplates, initialTemplateId, isExplicitNew }: Props) {
    const initialTarget = (initialTemplateId ? initialTemplates.find(t => t.id === initialTemplateId) : null)
        || (!isExplicitNew && initialTemplates.length > 0 ? (initialTemplates.find(t => t.is_default) || initialTemplates[0]) : null)

    const initialLayout = initialTarget ? configToLayout(initialTarget.config) : null

    const [templates, setTemplates] = useState<any[]>(initialTemplates)
    const [saving, setSaving] = useState(false)
    const [name, setName] = useState(initialTarget?.name || '')
    const [activeId, setActiveId] = useState<string | null>(initialTarget?.id || null)
    const [isNew, setIsNew] = useState(initialTarget ? false : true)

    const [blocks, setBlocks] = useState<Block[]>(initialLayout ? initialLayout.blocks : DEFAULT_BLOCKS.map(b => ({ ...b, fields: { ...b.fields } })))
    const [theme, setTheme] = useState<Theme>(initialLayout ? initialLayout.theme : { ...DEFAULT_THEME })
    const [selectedBlockId, setSelectedBlockId] = useState<BlockType | null>('header')
    const [roles, setRoles] = useState<string[]>((initialTarget?.metadata as any)?.defaultForRoles || [])

    // Drag state
    const dragIdx = useRef<number | null>(null)

    const refresh = async () => {
        const r = await getPrintTemplates()
        if (r.success && r.data) setTemplates((r.data as any)[usage] || [])
    }

    const loadTpl = (t: any) => {
        setActiveId(t.id); setIsNew(false); setName(t.name || '')
        const { blocks: b, theme: th } = configToLayout(t.config)
        setBlocks(b); setTheme(th)
        setRoles((t.metadata as any)?.defaultForRoles || [])
        setSelectedBlockId('header')
    }

    useEffect(() => {
        const init = async () => {
            const r = await getPrintTemplates()
            if (r.success && r.data) {
                const list = (r.data as any)[usage] || []
                setTemplates(list)

                const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
                const reqId = initialTemplateId || urlParams?.get('templateId')

                if (reqId) {
                    const match = list.find((t: any) => t.id === reqId)
                    if (match) loadTpl(match)
                } else if (!isExplicitNew && list.length > 0) {
                    const def = list.find((t: any) => t.is_default) || list[0]
                    if (def) loadTpl(def)
                }
            }
        }
        init()
    }, [usage, initialTemplateId, isExplicitNew])

    const startNew = () => {
        setActiveId(null); setIsNew(true); setName('')
        setBlocks(DEFAULT_BLOCKS.map(b => ({ ...b, fields: { ...b.fields } }))); setTheme({ ...DEFAULT_THEME }); setRoles([])
    }

    const applyTemplate = (tpl: typeof PREMIUM_TEMPLATES[0]) => {
        setTheme(t => ({ ...t, ...tpl.theme }))
        if (!name) setName(tpl.name)
    }

    const save = async () => {
        const effectiveName = name.trim() || (!isNew && activeId ? templates.find(t => t.id === activeId)?.name : '')
        if (!effectiveName) { toast.error('❌ Enter a template name'); return }
        setSaving(true)
        try {
            const config = layoutToConfig(blocks, theme)
            const metadata = { defaultForRoles: roles }
            if (!isNew && activeId) {
                const r = await updatePrintTemplateConfig(activeId, config, metadata)
                if (!r.success) throw new Error(r.error)
                toast.success('✅ Updated!')
            } else {
                const r = await createPrintTemplate({ name: effectiveName, usage, config, metadata })
                if (!r.success) throw new Error(r.error)
                setActiveId(r.id ?? null); setIsNew(false)
                toast.success('✅ Saved! Click "Set Default" to activate.')
            }
            await refresh()
        } catch (e: any) { toast.error('Error', { description: e.message }) }
        finally { setSaving(false) }
    }

    const setDefault = async (id: string) => {
        await setPrintTemplateActive(id, usage)
        toast.success('⚡ Set as Default!'); await refresh()
    }

    const del = async (id: string) => {
        if (!confirm('Delete this template?')) return
        const r = await deletePrintTemplate(id)
        if (r.success) { toast.success('Deleted'); startNew(); await refresh() }
    }

    const updateBlock = (id: BlockType, update: Partial<Block>) =>
        setBlocks(bs => bs.map(b => b.id === id ? { ...b, ...update } : b))

    const updateBlockField = (id: BlockType, field: string, val: boolean) =>
        setBlocks(bs => bs.map(b => b.id === id ? { ...b, fields: { ...b.fields, [field]: val } } : b))

    const updateBlockStyle = (id: BlockType, key: keyof BlockStyle, val: any) =>
        setBlocks(bs => bs.map(b => b.id === id ? { ...b, style: { ...b.style, [key]: val } } : b))

    const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null

    const onDragStart = (i: number) => { dragIdx.current = i }
    const onDrop = (i: number) => {
        if (dragIdx.current === null || dragIdx.current === i) return
        const reordered = [...blocks]
        const [removed] = reordered.splice(dragIdx.current, 1)
        reordered.splice(i, 0, removed)
        setBlocks(reordered)
        dragIdx.current = null
    }

    const ROLES = ['ADMIN', 'RECEPTION', 'PHARMACIST', 'DOCTOR', 'NURSE', 'LAB', 'CASHIER', 'ACCOUNTANT']
    const PAPER_OPTIONS = [{ v: 'a4', l: 'A4', i: '📄' }, { v: 'a5', l: 'A5', i: '📃' }, { v: 'roll80', l: '80mm', i: '🧾' }]
    const FONT_OPTIONS = [{ v: 'Arial', l: 'Sans' }, { v: 'Georgia', l: 'Serif' }, { v: 'Courier New', l: 'Mono' }]

    const activeData = templates.find(t => t.id === activeId)

    return (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'Arial, sans-serif', zIndex: 9999 }}>

            {/* ── TOP BAR ── */}
            <div style={{ height: 54, background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button onClick={() => window.location.href = '/hms/settings/print'} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        ← Back
                    </button>
                    <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />
                    <div>
                        <span style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>🖨 Print Studio</span>
                        <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>— {label}</span>
                    </div>
                </div>

                {/* Template name input — center */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="Template name (required before saving)…"
                        style={{ width: 280, padding: '8px 14px', fontSize: 13, fontWeight: 700, border: `2px solid ${!name.trim() ? '#fca5a5' : '#c7d2fe'}`, borderRadius: 8, outline: 'none', background: !name.trim() ? '#fff7f7' : '#f5f3ff', color: '#0f172a' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{templates.length} saved</span>
                    <button onClick={save} disabled={saving || (isNew && !name.trim())} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: saving || (isNew && !name.trim()) ? 'not-allowed' : 'pointer', background: saving || (isNew && !name.trim()) ? '#e2e8f0' : '#4f46e5', color: saving || (isNew && !name.trim()) ? '#94a3b8' : 'white', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {saving && <Loader2 style={{ width: 13, height: 13 }} />}
                        {saving ? 'Saving…' : isNew ? '💾 Save Template' : '💾 Update'}
                    </button>
                    {activeId && !isNew && (
                        activeData?.is_default
                            ? <span style={{ padding: '8px 14px', borderRadius: 8, background: '#d1fae5', color: '#065f46', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Check style={{ width: 13, height: 13 }} />Default</span>
                            : <button onClick={() => setDefault(activeId)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#059669', color: 'white', fontWeight: 800, fontSize: 12 }}>⭐ Set Default</button>
                    )}
                    {activeId && !isNew && (
                        <button onClick={() => del(activeId)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #fecaca', background: 'white', cursor: 'pointer', color: '#ef4444' }}>
                            <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                    )}
                </div>
            </div>

            {/* ── 3-PANEL BODY ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ══ LEFT PANEL ══ */}
                <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ flex: 1, overflowY: 'auto' }}>

                        {/* Saved templates */}
                        <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Saved Templates</span>
                                <button onClick={startNew} style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Plus style={{ width: 12, height: 12 }} />New
                                </button>
                            </div>
                            {templates.length === 0
                                ? <div style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'center', padding: '8px 0' }}>No templates yet</div>
                                : templates.map(t => {
                                    const active = activeId === t.id
                                    const c = (t.config as any)?.theme?.primaryColor || (t.config as any)?.brand?.primaryColor || '#4f46e5'
                                    return (
                                        <button key={t.id} onClick={() => loadTpl(t)} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 8, marginBottom: 2, border: 'none', cursor: 'pointer', background: active ? '#4f46e5' : 'transparent' }}>
                                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
                                            <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'white' : '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                                            {t.is_default && <Star style={{ width: 11, height: 11, color: active ? '#fcd34d' : '#10b981', flexShrink: 0 }} />}
                                        </button>
                                    )
                                })
                            }
                        </div>

                        {/* Blocks — drag to reorder */}
                        <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Sections — Drag to Reorder</div>
                            {blocks.map((block, i) => {
                                const sel = selectedBlockId === block.id
                                return (
                                    <div
                                        key={block.id}
                                        draggable
                                        onDragStart={() => onDragStart(i)}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={() => onDrop(i)}
                                        onClick={() => setSelectedBlockId(block.id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, marginBottom: 3, cursor: 'pointer', background: sel ? `${theme.primaryColor}15` : 'transparent', border: sel ? `1.5px solid ${theme.primaryColor}40` : '1.5px solid transparent', transition: 'all .15s', userSelect: 'none' }}
                                    >
                                        <GripVertical style={{ width: 14, height: 14, color: '#94a3b8', cursor: 'grab', flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, flex: 1, fontWeight: sel ? 800 : 500, color: sel ? theme.primaryColor : block.enabled ? '#334155' : '#94a3b8' }}>{block.label}</span>
                                        <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>{block.variant}</span>
                                        <button onClick={e => { e.stopPropagation(); updateBlock(block.id, { enabled: !block.enabled }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: block.enabled ? '#10b981' : '#cbd5e1', flexShrink: 0 }}>
                                            {block.enabled ? <Eye style={{ width: 14, height: 14 }} /> : <EyeOff style={{ width: 14, height: 14 }} />}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Theme */}
                        <div style={{ padding: '12px 14px' }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Theme</div>

                            {/* Templates */}
                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>Presets</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                                {PREMIUM_TEMPLATES.map(t => (
                                    <button key={t.name} title={t.name} onClick={() => applyTemplate(t)} style={{ width: 26, height: 26, borderRadius: '50%', background: t.color, border: `3px solid ${theme.primaryColor === t.color ? '#0f172a' : 'transparent'}`, cursor: 'pointer', transition: 'transform .1s' }} />
                                ))}
                            </div>

                            {/* Colors */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Primary</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 10px' }}>
                                        <input type="color" value={theme.primaryColor} onChange={e => setTheme(t => ({ ...t, primaryColor: e.target.value, headerBg: e.target.value }))} style={{ width: 22, height: 22, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }} />
                                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b' }}>{theme.primaryColor}</span>
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Header Text</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 10px' }}>
                                        <input type="color" value={theme.headerText} onChange={e => setTheme(t => ({ ...t, headerText: e.target.value }))} style={{ width: 22, height: 22, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }} />
                                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b' }}>{theme.headerText}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Font */}
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6, fontWeight: 700 }}>Font</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {FONT_OPTIONS.map(f => (
                                        <button key={f.v} onClick={() => setTheme(t => ({ ...t, fontFamily: f.v }))} style={{ flex: 1, border: `2px solid ${theme.fontFamily === f.v ? '#4f46e5' : '#e2e8f0'}`, borderRadius: 7, padding: '6px 4px', cursor: 'pointer', background: theme.fontFamily === f.v ? '#eef2ff' : 'white', textAlign: 'center' }}>
                                            <div style={{ fontSize: 16, fontFamily: f.v, fontWeight: 800 }}>Aa</div>
                                            <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 2 }}>{f.l}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Paper */}
                            <div>
                                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6, fontWeight: 700 }}>Paper Size</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {PAPER_OPTIONS.map(o => (
                                        <button key={o.v} onClick={() => setTheme(t => ({ ...t, paperSize: o.v as PaperSize }))} style={{ flex: 1, border: `2px solid ${theme.paperSize === o.v ? '#4f46e5' : '#e2e8f0'}`, borderRadius: 7, padding: '6px 4px', cursor: 'pointer', background: theme.paperSize === o.v ? '#eef2ff' : 'white', textAlign: 'center' }}>
                                            <div style={{ fontSize: 18 }}>{o.i}</div>
                                            <div style={{ fontSize: 9, fontWeight: 700, color: '#334155', marginTop: 2 }}>{o.l}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══ CENTER: CANVAS ══ */}
                <div style={{ flex: 1, overflow: 'auto', background: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32, gap: 12 }}>
                    <div style={{ fontSize: 11, color: '#64748b', background: 'white', padding: '6px 16px', borderRadius: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', marginBottom: 8 }}>
                        👆 Click any section on the bill to edit it · Drag sections on the left to reorder
                    </div>
                    <BillCanvas
                        blocks={blocks}
                        theme={theme}
                        selectedId={selectedBlockId}
                        onSelect={id => setSelectedBlockId(id)}
                    />
                </div>

                {/* ══ RIGHT: PROPERTIES ══ */}
                <div style={{ width: 300, flexShrink: 0, borderLeft: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {selectedBlock ? (
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {/* Header */}
                            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: 11, fontWeight: 900, color: '#0f172a', marginBottom: 2 }}>{selectedBlock.label}</div>
                                <div style={{ fontSize: 10, color: '#94a3b8' }}>Click properties below to customize this section</div>
                            </div>

                            {/* Enable/Disable */}
                            <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Show this section</span>
                                <Tog on={selectedBlock.enabled} set={v => updateBlock(selectedBlock.id, { enabled: v })} />
                            </div>

                            {/* Layout Variants */}
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Layout Style</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {BLOCK_VARIANTS[selectedBlock.id].map(v => {
                                        const sel = selectedBlock.variant === v.id
                                        return (
                                            <button key={v.id} onClick={() => updateBlock(selectedBlock.id, { variant: v.id })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: `2px solid ${sel ? theme.primaryColor : '#e2e8f0'}`, cursor: 'pointer', background: sel ? `${theme.primaryColor}10` : 'white', textAlign: 'left', transition: 'all .15s' }}>
                                                <div style={{ width: 28, height: 28, borderRadius: 6, background: sel ? theme.primaryColor : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: sel ? 'white' : '#64748b', flexShrink: 0 }}>{v.id}</div>
                                                <div>
                                                    <div style={{ fontSize: 12, fontWeight: sel ? 800 : 600, color: sel ? theme.primaryColor : '#334155' }}>{v.label}</div>
                                                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{v.desc}</div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Fields */}
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Show / Hide Fields</div>
                                {BLOCK_FIELDS[selectedBlock.id].map(field => (
                                    <div key={field.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                                        <span style={{ fontSize: 12, color: '#334155', cursor: 'pointer' }} onClick={() => updateBlockField(selectedBlock.id, field.key, !selectedBlock.fields[field.key])}>{field.label}</span>
                                        <Tog on={selectedBlock.fields[field.key] ?? false} set={v => updateBlockField(selectedBlock.id, field.key, v)} />
                                    </div>
                                ))}
                            </div>

                            {/* Typography */}
                            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Typography</div>

                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: 11, color: '#334155', fontWeight: 700 }}>Font Size</span>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: '#4f46e5', minWidth: 32, textAlign: 'right' }}>{selectedBlock.style.fontSize}px</span>
                                    </div>
                                    <input type="range" min={8} max={20} value={selectedBlock.style.fontSize} onChange={e => updateBlockStyle(selectedBlock.id, 'fontSize', +e.target.value)} style={{ width: '100%', accentColor: theme.primaryColor }} />
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: 11, color: '#334155', fontWeight: 700 }}>Section Padding</span>
                                        <span style={{ fontSize: 13, fontWeight: 800, color: '#4f46e5', minWidth: 32, textAlign: 'right' }}>{selectedBlock.style.padding}px</span>
                                    </div>
                                    <input type="range" min={8} max={40} value={selectedBlock.style.padding} onChange={e => updateBlockStyle(selectedBlock.id, 'padding', +e.target.value)} style={{ width: '100%', accentColor: theme.primaryColor }} />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ fontSize: 11, color: '#334155', fontWeight: 700 }}>Bold Text</span>
                                    <Tog on={selectedBlock.style.bold} set={v => updateBlockStyle(selectedBlock.id, 'bold', v)} />
                                </div>

                                <div>
                                    <div style={{ fontSize: 11, color: '#334155', fontWeight: 700, marginBottom: 6 }}>Alignment</div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {(['left', 'center', 'right'] as const).map(a => (
                                            <button key={a} onClick={() => updateBlockStyle(selectedBlock.id, 'align', a)} style={{ flex: 1, padding: '7px', border: `2px solid ${selectedBlock.style.align === a ? theme.primaryColor : '#e2e8f0'}`, borderRadius: 7, cursor: 'pointer', background: selectedBlock.style.align === a ? `${theme.primaryColor}15` : 'white', fontSize: 16 }}>
                                                {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Roles */}
                            <div style={{ padding: '14px 16px' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Role Access (Template Level)</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {ROLES.map(role => {
                                        const on = roles.includes(role)
                                        return (
                                            <button key={role} onClick={() => setRoles(r => on ? r.filter(x => x !== role) : [...r, role])} style={{ padding: '5px 10px', borderRadius: 6, border: `1.5px solid ${on ? theme.primaryColor : '#e2e8f0'}`, cursor: 'pointer', background: on ? `${theme.primaryColor}15` : 'white', fontSize: 10, fontWeight: on ? 800 : 600, color: on ? theme.primaryColor : '#64748b' }}>
                                                {role}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#94a3b8' }}>
                            <div style={{ fontSize: 32 }}>👆</div>
                            <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'center' }}>Click any section<br />on the bill to edit it</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
