/**
 * V2 HTML Print Renderer
 * Converts Print Studio v2 template (blocks + theme) + real invoice data → print-ready HTML
 */

function fmt(n: number): string {
    return '₹ ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: any): string {
    if (!d) return ''
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
    catch { return String(d) }
}

function esc(s: any): string {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ─── DATA EXTRACTION ──────────────────────────────────────────────────────────

function extractCompanyData(company: any) {
    const meta = company?.metadata || {}
    return {
        name: company?.name || meta.hospital_name || 'Hospital',
        address: company?.address || meta.address || '',
        phone: company?.phone || meta.phone || meta.mobile || '',
        email: company?.email || meta.email || '',
        gstin: meta.gstin || meta.GSTIN || meta.tax_id || '',
        tagline: meta.tagline || '',
        logoUrl: company?.logo_url || meta.logo_url || '',
        bankName: meta.bank_name || '',
        bankAccount: meta.bank_account || '',
        bankIfsc: meta.bank_ifsc || '',
        terms: meta.payment_terms || '',
    }
}

function extractBillData(data: any) {
    const patient = data?.hms_patient || {}
    const apt = data?.hms_appointment || {}
    const doctor = apt?.hms_clinician || {}

    let rawLines = data?.hms_invoice_lines || data?.items || []
    if (!rawLines || rawLines.length === 0) {
        let jsonLines = data?.line_items
        if (typeof jsonLines === 'string') {
            try { jsonLines = JSON.parse(jsonLines) } catch (_) { jsonLines = [] }
        }
        if (Array.isArray(jsonLines) && jsonLines.length > 0) rawLines = jsonLines
        else if (Array.isArray(data?.metadata?.items)) rawLines = data.metadata.items
        else if (Array.isArray(data?.metadata?.lines)) rawLines = data.metadata.lines
        else if (Array.isArray(data?.billing_metadata?.items)) rawLines = data.billing_metadata.items
        else if (typeof data?.billing_metadata === 'string') {
            try {
                const parsed = JSON.parse(data.billing_metadata)
                if (Array.isArray(parsed?.items)) rawLines = parsed.items
                else if (Array.isArray(parsed?.line_items)) rawLines = parsed.line_items
            } catch (_) {}
        }
    }

    const grandTotal = Number(data?.total || data?.total_amount || 0)
    const subtotal = Number(data?.subtotal || 0)
    const taxTotal = Number(data?.tax_amount || data?.tax || 0)
    const discountTotal = Number(data?.discount_amount || data?.discount || 0)

    // Fallback: If no line items exist in DB but total > 0, generate a single line item
    if ((!rawLines || rawLines.length === 0) && grandTotal > 0) {
        rawLines = [{
            description: 'Hospital / Medical Services',
            quantity: 1,
            unit_price: grandTotal,
            net_amount: grandTotal,
            total: grandTotal
        }]
    }

    return {
        patientName: patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(' ') || 'Patient',
        patientId: data?.patient_id || patient.patient_id || patient.op_number || '',
        doctorName: doctor.name || [doctor.first_name, doctor.last_name].filter(Boolean).join(' ') || '',
        opNumber: apt?.token_number || apt?.op_number || data?.op_number || '',
        patientPhone: patient.phone || patient.mobile || '',
        billNumber: data?.invoice_number || data?.bill_number || data?.id?.split('-')[0]?.toUpperCase() || '',
        billDate: fmtDate(data?.invoice_date || data?.created_at),
        paymentMode: data?.payment_mode || (data?.metadata as any)?.paymentMode || '',
        received: Number(data?.paid_amount || data?.received_amount || data?.total || 0),
        balance: Number(data?.balance_due || 0),
        lines: rawLines,
        subtotal: subtotal || (grandTotal - taxTotal + discountTotal),
        discountTotal,
        taxTotal,
        grandTotal,
    }
}

// ─── BLOCK RENDERERS ──────────────────────────────────────────────────────────

function headerBlock(block: any, co: ReturnType<typeof extractCompanyData>, pc: string, headerBg: string, headerText: string, narrow: boolean): string {
    const f = block.fields || {}
    const pad = narrow ? 12 : (block.style?.padding || 24)
    const nameSz = narrow ? 14 : 20
    const logoHtml = f.logo && co.logoUrl
        ? `<img src="${esc(co.logoUrl)}" style="width:${narrow ? 36 : 52}px;height:${narrow ? 36 : 52}px;object-fit:contain;border-radius:6px;flex-shrink:0;" />`
        : f.logo
            ? `<div style="width:${narrow ? 36 : 52}px;height:${narrow ? 36 : 52}px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🏥</div>`
            : ''

    const infoHtml = `
        ${f.hospitalName ? `<div style="font-weight:900;font-size:${nameSz}px;letter-spacing:-0.3px;">${esc(co.name)}</div>` : ''}
        ${f.tagline && co.tagline ? `<div style="font-size:10px;opacity:0.75;font-style:italic;margin-top:2px;">${esc(co.tagline)}</div>` : ''}
        ${f.address && co.address ? `<div style="font-size:${narrow ? 8.5 : 10}px;opacity:0.85;margin-top:3px;">${esc(co.address)}</div>` : ''}
        ${f.phone && co.phone ? `<div style="font-size:10px;opacity:0.75;margin-top:2px;">📞 ${esc(co.phone)}${f.email && co.email ? `  ✉  ${esc(co.email)}` : ''}</div>` : ''}
        ${f.gstin && co.gstin ? `<div style="font-size:9px;opacity:0.65;margin-top:1px;">GSTIN: ${esc(co.gstin)}</div>` : ''}
    `

    const v = block.variant || 'A'
    const base = `background:${headerBg};color:${headerText};padding:${pad}px;`

    if (v === 'A') return `<div style="${base}display:flex;align-items:center;gap:16px;">${logoHtml}<div>${infoHtml}</div></div>`
    if (v === 'B') return `<div style="${base}text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;">${logoHtml}<div>${infoHtml}</div></div>`
    if (v === 'C') return `<div style="${base}display:grid;grid-template-columns:1fr 2fr 1fr;gap:12px;align-items:center;">
        <div>${logoHtml}</div>
        <div style="text-align:center;">${infoHtml}</div>
        <div style="text-align:right;font-size:9px;opacity:0.8;">
            ${f.gstin && co.gstin ? `<div>GSTIN: ${esc(co.gstin)}</div>` : ''}
            ${f.phone && co.phone ? `<div style="margin-top:3px;">📞 ${esc(co.phone)}</div>` : ''}
        </div>
    </div>`
    // D — minimal (now supports logo alongside text)
    return `<div style="padding:${pad}px;border-bottom:3px solid ${pc};display:flex;align-items:center;gap:16px;">
        ${logoHtml}
        <div style="flex:1;">
            ${f.hospitalName ? `<div style="font-weight:900;font-size:${nameSz}px;color:${pc};">${esc(co.name)}</div>` : ''}
            ${f.address && co.address ? `<div style="font-size:10px;color:#64748b;margin-top:3px;">${esc(co.address)}${f.phone && co.phone ? ` | ${esc(co.phone)}` : ''}</div>` : ''}
            ${f.gstin && co.gstin ? `<div style="font-size:9px;color:#94a3b8;margin-top:1px;">GSTIN: ${esc(co.gstin)}</div>` : ''}
        </div>
    </div>`
}

function billInfoBlock(block: any, bill: ReturnType<typeof extractBillData>, pc: string, narrow: boolean): string {
    const f = block.fields || {}
    const pad = narrow ? 10 : (block.style?.padding || 18)
    const v = block.variant || 'A'

    const patientHtml = `
        ${f.patientName ? `<div style="font-weight:900;font-size:15px;">${esc(bill.patientName)}</div>` : ''}
        ${f.patientId && bill.patientId ? `<div style="font-size:10px;color:#64748b;margin-top:2px;">Patient ID: ${esc(bill.patientId)}</div>` : ''}
        ${f.doctorName && bill.doctorName ? `<div style="font-size:10px;color:#64748b;margin-top:1px;">Dr. ${esc(bill.doctorName)}</div>` : ''}
        ${f.opNumber && bill.opNumber ? `<div style="font-size:10px;color:#64748b;margin-top:1px;">OP No: ${esc(bill.opNumber)}</div>` : ''}
    `
    const billHtml = `
        ${f.billNumber && bill.billNumber ? `<div style="font-weight:900;font-size:13px;color:${pc};">TAX INVOICE</div><div style="font-weight:700;font-size:12px;margin-top:4px;">${esc(bill.billNumber)}</div>` : `<div style="font-weight:900;font-size:13px;color:${pc};">TAX INVOICE</div>`}
        ${f.billDate && bill.billDate ? `<div style="font-size:10px;color:#64748b;margin-top:2px;">Date: ${esc(bill.billDate)}</div>` : ''}
    `

    if (v === 'A') return `<div style="padding:${pad}px;display:flex;justify-content:space-between;border-bottom:1px solid ${pc}18;">
        <div><div style="font-size:8.5px;font-weight:800;text-transform:uppercase;color:#94a3b8;letter-spacing:0.8px;margin-bottom:3px;">Bill To</div>${patientHtml}</div>
        <div style="text-align:right;">${billHtml}</div>
    </div>`

    if (v === 'B') return `<div style="padding:${pad}px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;border-bottom:1px solid ${pc}18;">
        ${[
            { title: 'Patient', html: patientHtml },
            { title: 'Doctor', html: `${f.doctorName && bill.doctorName ? `<div style="font-weight:800;font-size:11px;">${esc(bill.doctorName)}</div>` : '—'}${f.opNumber && bill.opNumber ? `<div style="font-size:10px;color:#64748b;">OP: ${esc(bill.opNumber)}</div>` : ''}` },
            { title: 'Invoice', html: billHtml },
        ].map(col => `<div style="background:${pc}08;border-radius:6px;padding:10px 12px;border:1px solid ${pc}18;"><div style="font-size:8.5px;font-weight:800;color:${pc};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">${col.title}</div>${col.html}</div>`).join('')}
    </div>`

    // C — compact
    return `<div style="padding:${pad}px;display:flex;gap:20px;flex-wrap:wrap;font-size:10px;border-bottom:1px solid ${pc}18;">
        ${f.patientName ? `<span><strong>Patient:</strong> ${esc(bill.patientName)}</span>` : ''}
        ${f.patientId && bill.patientId ? `<span><strong>ID:</strong> ${esc(bill.patientId)}</span>` : ''}
        ${f.doctorName && bill.doctorName ? `<span><strong>Dr:</strong> ${esc(bill.doctorName)}</span>` : ''}
        ${f.billNumber && bill.billNumber ? `<span style="margin-left:auto;font-weight:800;color:${pc};">${esc(bill.billNumber)}</span>` : ''}
        ${f.billDate && bill.billDate ? `<span><strong>Date:</strong> ${esc(bill.billDate)}</span>` : ''}
    </div>`
}

function tableBlock(block: any, bill: ReturnType<typeof extractBillData>, pc: string, narrow: boolean): string {
    const f = block.fields || {}
    const pad = narrow ? 8 : 16
    const v = block.variant || 'A'
    const fs = block.style?.fontSize || 10

    const cols = [
        { key: 'slNo', h: '#', right: false },
        { key: 'item', h: 'Description', right: false },
        { key: 'uom', h: 'Unit', right: false },
        { key: 'hsn', h: 'HSN', right: false },
        { key: 'qty', h: 'Qty', right: true },
        { key: 'rate', h: 'Rate', right: true },
        { key: 'discount', h: 'Disc', right: true },
        { key: 'tax', h: 'Tax', right: true },
        { key: 'amount', h: 'Amt', right: true },
    ].filter(c => f[c.key] !== false && f[c.key] !== undefined ? f[c.key] : ['item', 'qty', 'rate', 'amount'].includes(c.key))

    const thStyle = `padding:${narrow ? '6px 6px' : '8px 10px'};font-weight:800;font-size:8.5px;text-transform:uppercase;color:${pc};letter-spacing:0.5px;background:${pc}15;`
    const bordered = v === 'B'

    const headerRow = `<tr>${cols.map(c => `<th style="${thStyle}text-align:${c.right ? 'right' : 'left'};${bordered ? `border:1px solid ${pc}20;` : ''}">${c.h}</th>`).join('')}</tr>`

    const lines = bill.lines || []
    const dataRows = lines.map((line: any, i: number) => {
        const product = line.hms_product || {}
        const name = line.description || product.name || product.product_name || line.name || 'Item'
        const qty = Number(line.quantity || line.qty || 0)
        const rate = Number(line.unit_price || line.rate || line.price || 0)
        const disc = Number(line.discount || line.discount_amount || 0)
        const tax = Number(line.tax_amount || line.gst_amount || 0)
        const amount = Number(line.total || line.amount || (qty * rate - disc + tax) || 0)
        const uom = product.uom || line.uom || ''
        const hsn = product.hsn_code || line.hsn || ''

        const rowBg = v === 'A' ? (i % 2 === 0 ? '#f9fafb' : '#fff') : '#fff'
        const tdStyle = `padding:${narrow ? '5px 6px' : '7px 10px'};font-size:${fs}px;${bordered ? `border:1px solid ${pc}15;` : 'border-bottom:1px solid #f1f5f9;'}`

        const cells: Record<string, string> = {
            slNo: String(i + 1),
            item: esc(name),
            uom: esc(uom),
            hsn: esc(hsn),
            qty: String(qty),
            rate: fmt(rate),
            discount: disc > 0 ? fmt(disc) : '—',
            tax: fmt(tax),
            amount: fmt(amount),
        }

        return `<tr style="background:${rowBg};">${cols.map(c => `<td style="${tdStyle}text-align:${c.right ? 'right' : 'left'};${c.key === 'amount' ? 'font-weight:700;' : ''}">${cells[c.key]}</td>`).join('')}</tr>`
    }).join('')

    return `<div style="padding:0 ${pad}px;">
        <table style="width:100%;border-collapse:collapse;font-size:${fs}px;">
            <thead>${headerRow}</thead>
            <tbody>${dataRows || `<tr><td colspan="${cols.length}" style="padding:20px;text-align:center;color:#94a3b8;">No items</td></tr>`}</tbody>
        </table>
    </div>`
}

function summaryBlock(block: any, bill: ReturnType<typeof extractBillData>, pc: string): string {
    const f = block.fields || {}
    const pad = block.style?.padding || 16
    const fs = block.style?.fontSize || 11
    const v = block.variant || 'A'

    const subtotalCalc = bill.subtotal || (bill.grandTotal - bill.taxTotal + bill.discountTotal)
    const rows = [
        { key: 'subtotal', label: 'Subtotal', val: fmt(subtotalCalc), show: f.subtotal !== false },
        { key: 'discount', label: 'Discount', val: `− ${fmt(bill.discountTotal)}`, show: f.discount !== false && bill.discountTotal > 0, color: '#16a34a' },
        { key: 'taxBreakdown', label: 'GST / Tax', val: fmt(bill.taxTotal), show: f.taxBreakdown !== false && bill.taxTotal > 0 },
        { key: 'roundOff', label: 'Round Off', val: '₹ 0.00', show: f.roundOff === true },
    ].filter(r => r.show)

    if (v === 'A') return `<div style="padding:${pad}px;display:flex;justify-content:flex-end;">
        <div style="min-width:220px;">
            ${rows.map(r => `<div style="display:flex;justify-content:space-between;gap:32px;padding:4px 0;font-size:${fs}px;border-bottom:1px solid #f1f5f9;">
                <span style="color:${r.color || '#64748b'};">${r.label}</span>
                <span style="color:${r.color || 'inherit'};">${r.val}</span>
            </div>`).join('')}
            ${f.grandTotal !== false ? `<div style="display:flex;justify-content:space-between;gap:32px;padding:10px 0 4px;border-top:2px solid ${pc};">
                <span style="font-weight:900;font-size:${fs + 1}px;text-transform:uppercase;color:${pc};">Grand Total</span>
                <span style="font-weight:900;font-size:22px;color:${pc};">${fmt(bill.grandTotal)}</span>
            </div>` : ''}
        </div>
    </div>`

    // B — full width cards
    return `<div style="padding:${pad}px;background:${pc}06;">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;">
            ${rows.map(r => `<div style="background:white;border:1px solid ${pc}20;border-radius:6px;padding:8px 12px;">
                <div style="font-size:9px;color:#94a3b8;margin-bottom:3px;">${r.label}</div>
                <div style="font-weight:800;font-size:13px;color:${r.color || '#0f172a'};">${r.val}</div>
            </div>`).join('')}
        </div>
        ${f.grandTotal !== false ? `<div style="display:flex;justify-content:space-between;padding:10px 16px;background:${pc};color:white;border-radius:8px;">
            <span style="font-weight:800;text-transform:uppercase;letter-spacing:0.5px;">Grand Total</span>
            <span style="font-weight:900;font-size:22px;">${fmt(bill.grandTotal)}</span>
        </div>` : ''}
    </div>`
}

function paymentBlock(block: any, bill: ReturnType<typeof extractBillData>, pc: string): string {
    const f = block.fields || {}
    const pad = block.style?.padding || 14
    const fs = block.style?.fontSize || 11

    return `<div style="padding:${pad}px;background:#f0fdf4;border-top:1px solid #bbf7d0;display:flex;gap:16px;flex-wrap:wrap;font-size:${fs}px;">
        ${f.paymentMode && bill.paymentMode ? `<span><strong>Mode:</strong> ${esc(bill.paymentMode)}</span>` : ''}
        ${f.received !== false ? `<span><strong>Received:</strong> ${fmt(bill.received)}</span>` : ''}
        ${f.balance !== false ? `<span style="color:${bill.balance > 0 ? '#ef4444' : '#16a34a'};"><strong>Balance:</strong> ${bill.balance > 0 ? fmt(bill.balance) : 'NIL'}</span>` : ''}
    </div>`
}

function footerBlock(block: any, co: ReturnType<typeof extractCompanyData>, pc: string): string {
    const f = block.fields || {}
    const pad = block.style?.padding || 16
    const v = block.variant || 'A'

    const bankHtml = f.bankDetails && (co.bankAccount || co.bankName) ? `<div style="font-size:9.5px;color:#64748b;background:#f8fafc;padding:10px 12px;border-radius:6px;border:1px solid #e2e8f0;">
        <div style="font-weight:800;margin-bottom:2px;">Bank Details</div>
        ${co.bankAccount ? `<div>A/C: ${esc(co.bankAccount)}${co.bankIfsc ? `  IFSC: ${esc(co.bankIfsc)}` : ''}</div>` : ''}
        ${co.bankName ? `<div>${esc(co.bankName)}</div>` : ''}
    </div>` : ''

    const thankYouHtml = f.thankYou ? `<div style="font-size:10px;color:#94a3b8;font-style:italic;margin-top:6px;">Thank you for choosing us! 🙏</div>` : ''

    const termsHtml = f.terms && co.terms ? `<div style="font-size:8.5px;color:#94a3b8;margin-top:4px;max-width:280px;">${esc(co.terms)}</div>` : ''

    const signatureHtml = f.signature ? `<div style="text-align:center;font-size:9px;color:#64748b;">
        <div style="border-top:1px solid #334155;width:130px;margin-bottom:5px;"></div>
        Authorized Signatory
    </div>` : ''

    const qrHtml = f.qrCode ? `<div style="width:70px;height:70px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#94a3b8;">QR</div>` : ''

    if (v === 'A') return `<div style="padding:${pad}px;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #e2e8f0;">
        <div>${bankHtml}${thankYouHtml}${termsHtml}</div>
        ${signatureHtml}
    </div>`

    if (v === 'B') return `<div style="padding:${pad}px;border-top:1px solid #e2e8f0;">
        ${f.terms && co.terms ? `<div style="font-size:8.5px;color:#64748b;background:#f8fafc;padding:8px 12px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:12px;"><strong>Terms & Conditions:</strong> ${esc(co.terms)}</div>` : ''}
        ${thankYouHtml}
        <div style="display:flex;justify-content:flex-end;margin-top:12px;">${signatureHtml}</div>
    </div>`

    return `<div style="padding:${pad}px;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #e2e8f0;">
        <div style="display:flex;align-items:center;gap:12px;">${qrHtml}${thankYouHtml}</div>
        ${signatureHtml}
    </div>`
}

// ─── OP SLIP DATA EXTRACTION ──────────────────────────────────────────────────

function extractOPSlipData(data: any) {
    const patient = data?.hms_patient || {}
    const doctor  = data?.hms_clinician || {}
    return {
        tokenNumber:     data?.token_number || data?.token || '',
        patientName:     patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(' ') || 'Patient',
        patientId:       patient.patient_id || patient.op_number || data?.patient_id || '',
        doctorName:      doctor.name || [doctor.first_name, doctor.last_name].filter(Boolean).join(' ') || '',
        appointmentDate: fmtDate(data?.appointment_date || data?.created_at),
        appointmentTime: data?.appointment_time || '',
        notes:           data?.notes || '',
    }
}

// ─── OP SLIP RENDERER ─────────────────────────────────────────────────────────

/**
 * Renders a standalone OP (Out-Patient) appointment slip.
 * Uses the same blocks/theme system as generateV2HTML so the header
 * and footer blocks are honoured from the Print Studio template.
 * The central content (patient info + large token number) is always
 * rendered regardless of which blocks are enabled in the template.
 */
export function generateOPSlipHTML(
    blocks: any[],
    theme: any,
    data: any,
    company: any,
    autoPrint: boolean = false
): string {
    const narrow      = theme?.paperSize === 'roll80'
    const W           = narrow ? '80mm' : theme?.paperSize === 'a5' ? '148mm' : '210mm'
    const pc          = theme?.primaryColor || '#1e3a8a'
    const headerBg    = theme?.headerBg    || pc
    const headerText  = theme?.headerText  || '#ffffff'
    const fontFamily  = theme?.fontFamily === 'Georgia'
        ? 'Georgia, serif'
        : theme?.fontFamily === 'Courier New'
            ? 'Courier New, monospace'
            : 'Arial, sans-serif'

    const co   = extractCompanyData(company)
    const slip = extractOPSlipData(data)

    const enabledBlocks = (blocks || []).filter((b: any) => b.enabled !== false)

    // Render header/footer blocks from the template; ignore bill-specific blocks
    function renderTemplateBlock(block: any): string {
        switch (block.id) {
            case 'header': return headerBlock(block, co, pc, headerBg, headerText, narrow)
            case 'footer': return footerBlock(block, co, pc)
            default:       return ''
        }
    }

    const headerBlocks = enabledBlocks.filter(b => b.id === 'header').map(renderTemplateBlock).join('\n')
    const footerBlocks = enabledBlocks.filter(b => b.id === 'footer').map(renderTemplateBlock).join('\n')

    const pad = narrow ? 10 : 20

    const slipBody = `
    <!-- OP Slip Body -->
    <div style="padding:${pad}px;border-bottom:2px dashed ${pc}40;">

        <!-- TOKEN — large prominent display -->
        <div style="
            text-align:center;
            background:${pc};
            color:#fff;
            border-radius:${narrow ? 8 : 12}px;
            padding:${narrow ? '12px 8px' : '20px 16px'};
            margin-bottom:${narrow ? 10 : 16}px;
        ">
            <div style="font-size:${narrow ? 9 : 11}px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:0.8;margin-bottom:4px;">
                Token Number
            </div>
            <div style="font-size:${narrow ? 52 : 72}px;font-weight:900;line-height:1;letter-spacing:-2px;">
                ${esc(slip.tokenNumber || '—')}
            </div>
        </div>

        <!-- Patient Info -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:${narrow ? 8 : 12}px;">
            <div>
                <div style="font-size:${narrow ? 8 : 9}px;font-weight:800;text-transform:uppercase;color:#94a3b8;letter-spacing:0.8px;margin-bottom:2px;">Patient</div>
                <div style="font-weight:900;font-size:${narrow ? 12 : 15}px;">${esc(slip.patientName)}</div>
                ${slip.patientId ? `<div style="font-size:${narrow ? 9 : 10}px;color:#64748b;margin-top:1px;">ID: ${esc(slip.patientId)}</div>` : ''}
            </div>
            <div style="text-align:right;">
                <div style="font-size:${narrow ? 8 : 9}px;font-weight:800;text-transform:uppercase;color:#94a3b8;letter-spacing:0.8px;margin-bottom:2px;">Consulting</div>
                <div style="font-weight:700;font-size:${narrow ? 10 : 12}px;">${slip.doctorName ? `Dr. ${esc(slip.doctorName)}` : '—'}</div>
            </div>
        </div>

        <!-- Date / Time row -->
        <div style="display:flex;gap:${narrow ? 10 : 20}px;flex-wrap:wrap;font-size:${narrow ? 9 : 10}px;color:#475569;padding:${narrow ? '5px 0' : '8px 0'};border-top:1px solid ${pc}18;border-bottom:1px solid ${pc}18;">
            ${slip.appointmentDate ? `<span>📅 <strong>Date:</strong> ${esc(slip.appointmentDate)}</span>` : ''}
            ${slip.appointmentTime ? `<span>🕐 <strong>Time:</strong> ${esc(slip.appointmentTime)}</span>` : ''}
        </div>

        ${slip.notes ? `
        <!-- Notes -->
        <div style="margin-top:${narrow ? 6 : 10}px;font-size:${narrow ? 8.5 : 9.5}px;color:#64748b;">
            <strong>Notes:</strong> ${esc(slip.notes)}
        </div>` : ''}
    </div>`

    const autoPrintScript = autoPrint
        ? `<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},400);});</script>`
        : ''

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OP Slip</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: white; font-family: ${fontFamily}; font-size: 11pt; color: #1e293b; }
@page { size: ${W} auto; margin: 0; }
@media print {
    html, body { width: ${W}; }
    .slip-wrapper { box-shadow: none !important; }
}
img { max-width: 100%; }
table { border-collapse: collapse; }
</style>
${autoPrintScript}
</head>
<body>
<div class="slip-wrapper" style="width:${W};background:white;margin:0 auto;font-family:${fontFamily};">
${headerBlocks}
${slipBody}
${footerBlocks}
</div>
</body>
</html>`
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function generateV2HTML(
    blocks: any[],
    theme: any,
    data: any,
    company: any,
    autoPrint: boolean = false
): string {
    const narrow = theme?.paperSize === 'roll80'
    const W = narrow ? '80mm' : theme?.paperSize === 'a5' ? '148mm' : '210mm'
    const pc = theme?.primaryColor || '#1e3a8a'
    const headerBg = theme?.headerBg || pc
    const headerText = theme?.headerText || '#ffffff'
    const fontFamily = theme?.fontFamily === 'Georgia'
        ? 'Georgia, serif'
        : theme?.fontFamily === 'Courier New'
            ? 'Courier New, monospace'
            : 'Arial, sans-serif'

    const co = extractCompanyData(company)
    const bill = extractBillData(data)

    const enabledBlocks = (blocks || []).filter((b: any) => b.enabled !== false)

    const blocksHTML = enabledBlocks.map((block: any) => {
        switch (block.id) {
            case 'header':  return headerBlock(block, co, pc, headerBg, headerText, narrow)
            case 'bill_info': return billInfoBlock(block, bill, pc, narrow)
            case 'table':   return tableBlock(block, bill, pc, narrow)
            case 'summary': return summaryBlock(block, bill, pc)
            case 'payment': return paymentBlock(block, bill, pc)
            case 'footer':  return footerBlock(block, co, pc)
            default: return ''
        }
    }).join('\n')

    const autoPrintScript = autoPrint
        ? `<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},400);});</script>`
        : ''

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Print Preview</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: white; font-family: ${fontFamily}; font-size: 11pt; color: #1e293b; }
@page { size: ${W} auto; margin: 0; }
@media print {
    html, body { width: ${W}; }
    .bill-wrapper { box-shadow: none !important; }
}
img { max-width: 100%; }
table { border-collapse: collapse; }
</style>
${autoPrintScript}
</head>
<body>
<div class="bill-wrapper" style="width:${W};min-height:${narrow ? 'auto' : '297mm'};background:white;margin:0 auto;font-family:${fontFamily};">
${blocksHTML}
</div>
</body>
</html>`
}
