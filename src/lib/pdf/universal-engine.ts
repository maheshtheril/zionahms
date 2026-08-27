import { jsPDF } from 'jspdf';
import { getPDFConfig, getHMSSettings } from '@/app/actions/settings';
import { compileTemplate, WORLD_STANDARD_DEFAULTS } from '@/lib/utils/pdf-defaults';
import { formatDate, DEFAULT_DATE_FORMAT, DEFAULT_TIME_FORMAT } from '@/lib/format-utils';

export type PDFUsage = 'op_slip' | 'sale_bill' | 'pos_bill' | 'sales_return' | 'purchase_return' | 'purchase_receipt' | 'prescription' | 'lab_report' | 'doctor_note' | 'payment_voucher' | 'shift_close' | 'lab_catalog';

/**
 * WORLD-CLASS UNIFIED PDF ENGINE (v4 - Server-Safe)
 */
export async function generateUniversalPDF(
    usage: PDFUsage,
    data: any,
    company: any,
    branchId?: string,
    autoPrint: boolean = false,
    configOverride?: any,
    templateId?: string
): Promise<string> {
    try {
        // ============================================================
        // [LAB CATALOG] Completely standalone PDF - no invoice template
        // ============================================================
        if ((usage as any) === 'lab_catalog') {
            const doc = new jsPDF('p', 'pt', 'a4');
            const pw = doc.internal.pageSize.getWidth();
            const ph = doc.internal.pageSize.getHeight();
            const margin = 40;
            let y = margin;

            // ---- HEADER ----
            const companyMeta = company?.metadata || {};
            const logoUrl = company?.logo_url;

            // Try to draw logo
            if (logoUrl) {
                try {
                    const res = await fetch(logoUrl);
                    const buf = await res.arrayBuffer();
                    const b64 = `data:image/png;base64,${Buffer.from(buf).toString('base64')}`;
                    doc.addImage(b64, 'PNG', margin, y, 50, 50);
                } catch (_) {}
            }

            const nameX = margin + 60;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text(company?.name || 'Hospital', nameX, y + 14);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(80, 80, 80);
            const addrParts = [companyMeta?.address, company?.phone, company?.email].filter(Boolean).join('  |  ');
            if (addrParts) doc.text(addrParts, nameX, y + 28);
            y += 60;

            // Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(0, 0, 0);
            doc.text('LABORATORY TEST CATALOG', pw / 2, y, { align: 'center' });
            y += 8;

            // Underline
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.8);
            doc.line(margin, y, pw - margin, y);
            y += 14;

            // Date line
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Printed on: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`, pw - margin, y, { align: 'right' });
            y += 14;

            // ---- TABLE HEADER ----
            const cols = [
                { title: '#',               w: 24,  align: 'center' },
                { title: 'INVESTIGATION',   w: 190, align: 'left'   },
                { title: 'METHOD',          w: 80,  align: 'left'   },
                { title: 'UNIT',            w: 50,  align: 'center' },
                { title: 'REF. RANGE',      w: 90,  align: 'center' },
                { title: 'PRICE (Rs.)',     w: 70,  align: 'right'  },
            ];
            const totalW = cols.reduce((s, c) => s + c.w, 0);
            const startX = (pw - totalW) / 2;
            const rowH = 18;
            const headerH = 20;

            const drawRow = (row: string[], isHeader: boolean, isChild: boolean, isPanel: boolean) => {
                if (y + rowH > ph - margin) {
                    doc.addPage();
                    y = margin + 10;
                }

                if (isHeader) {
                    doc.setFillColor(40, 40, 40);
                    doc.rect(startX, y, totalW, headerH, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                } else if (isPanel) {
                    doc.setFillColor(235, 240, 255);
                    doc.rect(startX, y, totalW, rowH, 'F');
                    doc.setTextColor(30, 30, 120);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(8);
                } else if (isChild) {
                    doc.setFillColor(250, 250, 250);
                    doc.rect(startX, y, totalW, rowH, 'F');
                    doc.setTextColor(60, 60, 60);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7.5);
                } else {
                    doc.setFillColor(255, 255, 255);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                }

                let cx = startX;
                const h = isHeader ? headerH : rowH;
                const cellY = y + h - 5;

                row.forEach((cell, i) => {
                    const col = cols[i];
                    const align = col.align as any;
                    const textX = align === 'right' ? cx + col.w - 3 : align === 'center' ? cx + col.w / 2 : cx + 3;
                    doc.text(cell ?? '', textX, cellY, { align });
                    cx += col.w;
                });

                // bottom border
                doc.setDrawColor(210, 210, 210);
                doc.setLineWidth(0.3);
                doc.line(startX, y + h, startX + totalW, y + h);

                y += h;
            };

            // Helpers
            const resolveRange = (rr: any): string => {
                if (!rr) return '-';
                if (typeof rr === 'string') return rr || '-';
                if (typeof rr === 'object') {
                    // Common shapes: { range }, { normal }, { min, max }, { low, high }, { text }
                    return rr.range || rr.normal || rr.text ||
                        (rr.min !== undefined && rr.max !== undefined ? `${rr.min} - ${rr.max}` : null) ||
                        (rr.low !== undefined && rr.high !== undefined ? `${rr.low} - ${rr.high}` : null) ||
                        Object.values(rr).filter(v => typeof v === 'string').join(' ') || '-';
                }
                return '-';
            };

            const resolvePrice = (p: any): string => {
                if (p === null || p === undefined) return '0.00';
                const n = Number(p);
                return isNaN(n) ? '0.00' : n.toFixed(2);
            };

            // Draw header row
            drawRow(['#', ...cols.slice(1).map(c => c.title)], true, false, false);

            // ---- DATA ROWS ----
            const tests: any[] = Array.isArray(data) ? data : [];
            let sno = 1;

            tests.forEach((test: any) => {
                if (test.is_panel) {
                    drawRow([
                        String(sno++),
                        test.name || '-',
                        test.method || '-',
                        test.units || '-',
                        resolveRange(test.reference_range),
                        resolvePrice(test.price)
                    ], false, false, true);

                    const members = test.hms_lab_test_panel_member_hms_lab_test_panel_member_panel_idTohms_lab_test || [];
                    members.forEach((m: any) => {
                        const child = m.hms_lab_test_hms_lab_test_panel_member_member_test_idTohms_lab_test;
                        if (child) {
                            drawRow([
                                '',
                                `    \u2022 ${child.name}`,
                                child.method || '-',
                                child.units || '-',
                                resolveRange(child.reference_range),
                                '-'
                            ], false, true, false);
                        }
                    });
                } else {
                    drawRow([
                        String(sno++),
                        test.name || '-',
                        test.method || '-',
                        test.units || '-',
                        resolveRange(test.reference_range),
                        resolvePrice(test.price)
                    ], false, false, false);
                }
            });

            // Footer line
            y += 6;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.line(margin, y, pw - margin, y);
            y += 10;
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7);
            doc.setTextColor(120, 120, 120);
            doc.text(`Total: ${sno - 1} investigations listed`, margin, y);
            doc.text('Prices subject to change without prior notice.', pw - margin, y, { align: 'right' });

            if (autoPrint) {
                doc.autoPrint();
            }
            return doc.output('datauristring').split(',')[1];
        }
        // ============================================================

        console.log(`[ENGINE] Generating ${usage} for ${data.id || 'new document'}`);
        let config = configOverride || await getPDFConfig(data.company_id || company.id, data.tenant_id || company.tenant_id, usage, branchId, templateId);
        const hmsSettingsRes = await getHMSSettings();
        const hmsSettings = hmsSettingsRes?.success ? hmsSettingsRes.settings : null;

        // [ENGINE] Template Audit: Ensuring source-of-truth configuration
        const hasDbCoords = config?.coordinates && Object.keys(config.coordinates).length > 0;
        const isRecovery = !!config?.recoveryMode;
        console.log(`[PDF-RADAR] Usage: ${usage} | Source: ${isRecovery ? 'RECOVERY (Hardcoded)' : (hasDbCoords ? 'DATABASE ✓' : 'EMPTY ✗')} | Template: ${config?.name || 'N/A'}`);
        // -----------------------

        const requestedSize = config?.pageSizeSettings?.format || 'a4';
        const finalPageSize = requestedSize;

        const doc = new jsPDF('p', 'pt', finalPageSize === 'a5' ? 'a5' : 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Calibration: 1:1 points mapping (Standard A4 is 595.28 pts wide)
        const scale = pageWidth / 595.28;

        const coords = config?.coordinates || {};
        const companyData = company || {};
        const meta = companyData.metadata || {};
        const patientData = data.hms_patient || data.patient || {};
        let clinicianData = data.hms_clinician || data.clinician || data.doctor || data.hms_doctor || data.hms_appointment?.hms_clinician || data.appointment?.clinician || {};

        // Secondary discovery for sparse data cases
        if (!clinicianData?.id && (data.metadata as any)?.clinician_id) {
            console.log("[ENGINE] Attempting clinician recovery from metadata...");
        }

        const appointmentData = data.hms_appointment || data.appointment || (data.starts_at ? data : {});

        // WORLD-CLASS TAX & TOTALS LOGIC
        const invoiceLines = data.hms_invoice_lines || data.items || [];
        const subtotalValue = invoiceLines.reduce((acc: number, item: any) => acc + Number(item.net_amount || item.total || 0), 0);
        const taxValue = Number(data.tax_amount || 0);
        const grandTotal = Number(data.total_amount || data.net_amount || data.total || subtotalValue + taxValue);

        // Setting Awareness: default to showing tax if not explicitly disabled
        const showTaxDetails = config?.showTaxOnBill !== false;

        const bMeta = (() => {
            let m = data.billing_metadata;
            if (typeof m === 'string') {
                try { m = JSON.parse(m); } catch (e) { m = {}; }
            }
            
            let genMeta = data.metadata;
            if (typeof genMeta === 'string') {
                try { genMeta = JSON.parse(genMeta); } catch (e) { genMeta = {}; }
            }
            
            return {
                ...(m || {}),
                ...(genMeta?.walkin_details || {})
            };
        })();

        const resolvedPatientName = (() => {
            // 1. Metadata Discovery (Deep Search - HIGHEST PRIORITY for Walk-ins)
            const meta = bMeta || {};
            if (meta.patient_name) return meta.patient_name;
            if (meta.name) return meta.name;
            if (meta.customer_name) return meta.customer_name;

            // 2. Registered Patient Check
            const fromProfile = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim();
            if (fromProfile && fromProfile.length > 1) return fromProfile;

            // 3. Top-Level Discovery (Failsafe)
            const d = (data as any) || {};
            if (d.patient_name) return d.patient_name;
            if (d.customer_name) return d.customer_name;
            if (d.customer) return d.customer;
            if (d.name) return d.name;
            
            return "Walk-in Patient";
        })();

        const resolvedPatientMobile = (() => {
            // 1. Metadata Discovery (Deep Search - HIGHEST PRIORITY for Walk-ins)
            const meta = bMeta || {};
            if (meta.patient_phone) return meta.patient_phone;
            if (meta.phone) return meta.phone;
            if (meta.mobile) return meta.mobile;
            if (meta.contact) return meta.contact;

            // 2. Registered Patient Check
            const fromProfile = (patientData.contact as any)?.phone || patientData.phone || (patientData.contact as any)?.mobile;
            if (fromProfile) return fromProfile;

            // 3. Top-Level Discovery (Failsafe)
            const d = (data as any) || {};
            if (d.patient_phone) return d.patient_phone;
            if (d.customer_phone) return d.customer_phone;
            if (d.phone) return d.phone;
            if (d.mobile) return d.mobile;
            
            return "N/A";
        })();

        const context = {
            ...companyData,
            ...meta,
            ...data,
            show_tax: showTaxDetails,
            bill_header_label: ((usage as any) === 'shift_close') ? "END OF SHIFT REPORT" : ((usage as any) === 'payment_voucher') ? "PAYMENT VOUCHER" : ((usage as any) === 'sales_return' || (usage as any) === 'purchase_return') ? ((usage as any) === 'purchase_return' ? "DEBIT NOTE / RETURN" : "CREDIT NOTE") : ((usage as any) === 'purchase_receipt' ? "GOODS RECEIVED NOTE (GRN)" : ((usage as any) === 'lab_catalog' ? "LABORATORY TEST CATALOG" : (showTaxDetails ? "TAX INVOICE" : "INVOICE"))),
            // [FORCE-CLEANUP] Use currency code for PDF rendering to avoid Unicode font issues (e.g. INR instead of ₹)
            currency_symbol: meta.currency_code || "INR",
            subtotal: `${meta.currency_code || "INR"} ${subtotalValue.toFixed(2)}`,
            tax_amount: `${meta.currency_code || "INR"} ${taxValue.toFixed(2)}`,
            total_discount: `${meta.currency_code || "INR"} ${Number(data.total_discount || 0).toFixed(2)}`,
            total_amount: `${meta.currency_code || "INR"} ${Number(data.total_amount || data.total || 0).toFixed(2)}`,
            grand_total_label: ((usage as any) === 'sales_return' || (usage as any) === 'purchase_return') ? ((usage as any) === 'purchase_return' ? `DEBIT TOTAL (${meta.currency_code || "INR"})` : `REFUND TOTAL (${meta.currency_code || "INR"})`) : ((usage as any) === 'purchase_receipt' ? `RECEIPT TOTAL (${meta.currency_code || "INR"})` : `GRAND TOTAL (${meta.currency_code || "INR"})`),
            doc_number: ((usage as any) === 'sales_return' || (usage as any) === 'purchase_return') ? (data.return_number || data.id?.slice(0, 8)) : ((usage as any) === 'purchase_receipt' ? (data.receipt_number || data.id?.slice(0, 8)) : (data.invoice_number || data.order_number || data.id?.slice(0, 8) || "N/A")),
            formatted_date: formatDate(
                data.created_at || Date.now(), 
                `${company.metadata?.date_format || DEFAULT_DATE_FORMAT} ${company.metadata?.time_format || DEFAULT_TIME_FORMAT}`
            ),
            company: {
                ...companyData,
                logo: companyData.logo_url || "",
                name: companyData.name || meta.hospital_name || "Hospital Name",
                address: companyData.address || meta.address || "",
                phone: companyData.phone || meta.phone || meta.mobile || "",
                email: companyData.email || meta.email || "",
                gstin: meta.gstin || meta.GSTIN || meta.tax_id || "",
                tax_id: meta.gstin || meta.GSTIN || meta.tax_id || "",
            },
            patient: {
                ...patientData,
                name: resolvedPatientName,
                phone: resolvedPatientMobile,
                id: patientData.patient_number || patientData.id,
                age: (() => {
                    const meta = bMeta || {};
                    if (meta.age) return meta.age;
                    
                    if (patientData.age) return patientData.age;
                    if (patientData.dob) {
                        const birth = new Date(patientData.dob);
                        const today = new Date();
                        let age = today.getFullYear() - birth.getFullYear();
                        const m = today.getMonth() - birth.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                        return age;
                    }
                    return "N/A";
                })(),
                gender: (() => {
                    const meta = bMeta || {};
                    if (meta.gender) return meta.gender;
                    
                    if (patientData.gender) return patientData.gender;
                    return "N/A";
                })(),
                renew_date: (() => {
                    const storedExpiry = patientData.metadata?.registration_expiry;
                    if (!storedExpiry || isNaN(new Date(storedExpiry).getTime())) return "N/A";
                    
                    const d = new Date(storedExpiry);
                    return formatDate(d, company.metadata?.date_format || DEFAULT_DATE_FORMAT);
                })(),
                mobile: (() => {
                    if (resolvedPatientMobile && String(resolvedPatientMobile).trim() !== "") {
                        return resolvedPatientMobile;
                    }
                    return "N/A";
                })(),
                address: (() => {
                    const rawAddr = patientData.address || (typeof patientData.contact === 'object' ? (patientData.contact as any)?.address : null);
                    if (typeof rawAddr === 'string') return rawAddr;
                    if (rawAddr && typeof rawAddr === 'object') {
                        const parts = [(rawAddr as any).line1, (rawAddr as any).line2, (rawAddr as any).city, (rawAddr as any).state, (rawAddr as any).pincode].filter(Boolean);
                        if (parts.length > 0) return parts.join(', ');
                        return Object.values(rawAddr).filter(v => typeof v === 'string').join(', ');
                    }
                    return "Address Not Recorded";
                })(),
            },
        };
        // [FINAL-AUTHORITY-INJECTION] 
        // Ensure that resolved identity always wins, preventing "Walk-in Patient" placeholders
        context.patient_name = resolvedPatientName;
        context.patient_mobile = resolvedPatientMobile;
        context.customer_name = resolvedPatientName;
        context.customer_phone = resolvedPatientMobile;
        context.patient = {
            ...context.patient,
            name: resolvedPatientName,
            phone: resolvedPatientMobile,
            age: context.patient.age,
            gender: context.patient.gender
        };

        const rawDocFirst = clinicianData.first_name || (clinicianData.user as any)?.name || clinicianData.name || "";
        const rawDocLast = clinicianData.last_name || "";
        const resolvedDocName = bMeta.doctor_name || (rawDocFirst ? `${clinicianData.salutation || 'Dr.'} ${rawDocFirst} ${rawDocLast}`.trim() : "Consulting Physician / Medical Officer");

        // --- WORLD-CLASS SMART SEAL FALLBACK ---
        const qual = clinicianData.qualification ? clinicianData.qualification.trim() : "";
        const desig = clinicianData.designation ? clinicianData.designation.trim() : "";
        const regNo = clinicianData.license_no || clinicianData.registration_number || (clinicianData.metadata as any)?.registration_number || "";
        
        let smartFallback = "";
        if (qual && desig) {
            smartFallback = `${qual} | ${desig}`;
        } else if (qual) {
            smartFallback = qual;
        } else if (desig) {
            smartFallback = desig;
        }

        if (regNo && regNo !== "REG-PENDING" && regNo.trim() !== "") {
            if (smartFallback) {
                smartFallback += `\nReg No: ${regNo}`;
            } else {
                smartFallback = `Reg No: ${regNo}`;
            }
        }

        context.doctor = {
            ...clinicianData,
            registration_number: regNo || "REG-PENDING",
            department: (clinicianData.hms_specializations as any)?.name || (clinicianData.metadata as any)?.department || "General Practice",
            designation: desig || "Consultant",
            qualification: qual || "",
            doctor_name: resolvedDocName,
            doctor_notes: clinicianData.notes || smartFallback,
            footer_text: clinicianData.notes || smartFallback,
            digital_print_footer: clinicianData.notes || ""
        };
        context.visit = {
            starts_at: appointmentData.starts_at ? formatDate(
                appointmentData.starts_at, 
                `${company.metadata?.date_format || DEFAULT_DATE_FORMAT} ${company.metadata?.time_format || DEFAULT_TIME_FORMAT}`
            ) : "TBD"
        };
        context.token_number = appointmentData.token_number ? String(appointmentData.token_number).padStart(2, '0') : "01";
        context.doctor_name = resolvedDocName;

        const logoUrl = companyData.logo_url || meta.logo_url;

        const hexToRgb = (hex: string) => {
            if (!hex || hex === 'transparent' || hex === 'None') return null;
            const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return res ? { r: parseInt(res[1], 16), g: parseInt(res[2], 16), b: parseInt(res[3], 16) } : null;
        };

        const fetchAsset = async (url: string): Promise<string | null> => {
            try {
                if (!url) return null;
                if (url.startsWith('data:')) return url;
                const res = await fetch(url);
                const arrayBuffer = await res.arrayBuffer();
                return `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
            } catch (err) {
                console.error("[ENGINE] Asset Load Fail:", url, err);
                return null;
            }
        };

        const fetchQr = async (text: string) => {
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
            return await fetchAsset(url);
        };

        // 1. Process Elements (SORTED BY Y-POSITION FOR LOGICAL FLOW)
        const elements = Object.entries(coords).sort((a: any, b: any) => (a[1]?.y || 0) - (b[1]?.y || 0));

        // [SURGICAL RENDER LOOP]
        let tableStartY = 0;
        let tableEndOfTableY = 0;
        const tableCfg = (coords.table || coords.hms_table);
        if (tableCfg) tableStartY = (tableCfg.y || 0) * scale;
        
        let hasRenderedIdentity = false;

        for (const [key, val] of elements as [string, any][]) {
            try {
                if (val.showSection === false) continue;

                // [REFINED SUPPRESSION] ONLY block the specific fields we've hardcoded to prevent overlap
                const isIdentityElement = (key === 'patient_id' || key === 'patient_name' || key === 'patient_age' || key === 'mobile_number' || key === 'patient_addr' || key === 'age_gender' || key === 'renew_date' || key === 'patient_mob');

                if ((usage as any) === 'lab_catalog' && (isIdentityElement || key === 'bill_to' || key === 'inv_data_lbl')) {
                    continue;
                }

                if ((usage as any) === 'op_slip' && isIdentityElement) {
                    if (key === 'patient_id' || key === 'patient_name' || key.includes('id')) {
                        // [WALK-IN-RECOVERY-LOGIC] Robustly resolve walk-in status from initial invoice data
                        const resolvedWalkInData = (() => {
                          const inv = data || {};
                          if (!inv || Object.keys(inv).length === 0) return { isWalkIn: false, name: '', phone: '' };
                          const hasPatientLink = inv.patient_id && String(inv.patient_id).length > 5;
                          if (hasPatientLink) return { isWalkIn: false, name: '', phone: '' };
                          try {
                              const m = inv.billing_metadata;
                              const bMeta = typeof m === 'string' ? JSON.parse(m) : (m || {});
                              const name = bMeta.patient_name || bMeta.name || inv.patient_name || '';
                              const phone = bMeta.patient_phone || bMeta.phone || inv.patient_phone || '';
                              const isWalkIn = Boolean(bMeta.is_walk_in || name || phone);
                              return { isWalkIn, name, phone };
                          } catch (e) {
                              return { isWalkIn: false, name: '', phone: '' };
                          }
                        })();

                        const isWalkIn = resolvedWalkInData.isWalkIn;
                        // Handled once at the core identity block...
                    }
                }

                // [LOCKED-FORMAT: 2026-04-22] - CLINICAL FIDELITY GUARD
                // This block hardcodes the patient identity to prevent accidental Branding Studio shifts.
                if ((usage as any) === 'op_slip' && isIdentityElement) {
                    if (!hasRenderedIdentity) {
                        const defaults = WORLD_STANDARD_DEFAULTS.op_slip;

                        // 1. Patient Name
                        doc.setFont("Helvetica", "bold");
                        doc.setFontSize(12 * scale); 
                        doc.setTextColor(0, 0, 0);
                        doc.text(context.patient_name, defaults.patient_name.x * scale, 115 * scale);

                        // 2. Patient Age & Gender
                        doc.setFontSize(11 * scale);
                        doc.text(`${context.patient.age || "N/A"} / ${context.patient.gender || "N/A"}`, (defaults.age_gender?.x || 40) * scale, 128 * scale);

                        // 3. Row 2: Patient ID | Renew Date
                        doc.setFontSize(11 * scale);
                        doc.text(`ID: ${patientData.patient_number || patientData.id}`, (defaults.patient_id?.x || 40) * scale, 148 * scale);
                        
                        doc.setFontSize(9 * scale);
                        doc.text(`Renew Date: ${context.patient.renew_date}`, (defaults.renew_date?.x || 160) * scale, 148 * scale);

                        // 4. Row 3: Mobile Number | Address
                        const mobY = 158 * scale;
                        const mobX = (defaults.patient_mob?.x || 40) * scale;

                        doc.setTextColor(0, 0, 0);
                        doc.setFontSize(11 * scale);
                        const rawPhone = (context.patient_mobile && context.patient_mobile !== "N/A") ? context.patient_mobile : "N/A";
                        doc.text(`Mob: ${rawPhone}`, mobX, mobY);

                        if (context.patient.address) {
                            const addrX = (defaults.patient_addr?.x || 160) * scale;
                            doc.setFontSize(7.5 * scale);
                            doc.text(`Addr: ${context.patient.address}`, addrX, mobY, { maxWidth: 200 * scale });
                        }
                        
                        hasRenderedIdentity = true;
                    }
                    continue; 
                }

                // [FORCE-FIDELITY] Move Clinical Line to appropriate vertical anchor
                if ((usage as any) === 'op_slip' && key === 'line_1_btm') {
                    val.y = 185;
                }

                // [FORCE-FIDELITY] Move Vitals to Vertical Right Sidebar
                if ((usage as any) === 'op_slip' && (key === 'notes_hdr' || key === 'vitals_row')) {
                    if (key === 'notes_hdr') {
                        doc.setFont("Helvetica", "bold");
                        doc.setFontSize(8 * scale);
                        doc.setTextColor(148, 163, 184); 
                        doc.text("CLINICAL VITALS", 470 * scale, 195 * scale);
                    }
                    
                    if (key === 'vitals_row') {
                        doc.setFont("Helvetica", "bold");
                        doc.setFontSize(9 * scale);
                        doc.setTextColor(0, 0, 0);
                        const vitals = ["BP:", "SPO2:", "PR:", "RR:", "GRBS:", "WT:", "TEMP:"];
                        let vY = 212;
                        vitals.forEach(v => {
                            doc.text(v, 470 * scale, vY * scale);
                            // Draw entry line next to label
                            doc.setDrawColor(203, 213, 225); // slate-200
                            doc.setLineWidth(0.5 * scale);
                            doc.line(505 * scale, vY * scale, 560 * scale, vY * scale);
                            vY += 35; // Significantly increased vertical spacing for maximum writing room
                        });
                    }
                    continue;
                }


                const x = (val.x || 0) * scale;
                let y = (val.y || 0) * scale;

                // DYNAMIC POSITIONING: If this element started below the table, shift it by the table's actual growth
                const isBottomElement = key.toLowerCase().includes('footer') || key.toLowerCase().includes('sign') || key.toLowerCase().includes('signature') || key.toLowerCase().includes('notes') || key.toLowerCase().includes('terms');
                const isTotalElement = key === 'total_lbl' || key === 'total_val' || key === 'line_btm';
                
                if ((usage as any) === 'sale_bill' || (usage as any) === 'pos_bill') {
                    // Check World-Standard Advanced overrides
                    const adv = config?.advanced || {};
                    let suppress = isBottomElement;
                    if (adv.showSignature && (key.toLowerCase().includes('sign') || key.toLowerCase().includes('signature'))) suppress = false;
                    if (adv.showTerms && (key.toLowerCase().includes('terms') || key.toLowerCase().includes('notes'))) suppress = false;
                    if (suppress) continue;
                } else if (((usage as any) === 'payment_voucher' || (usage as any) === 'shift_close') && isBottomElement) {
                    continue;
                }
                
                // Shift close uses custom ledger tally, suppress default totals
                if ((usage as any) === 'shift_close' && isTotalElement) {
                    continue;
                }

                if (key === 'footer' || key === 'footer_line') {
                    // Position footer relative to page bottom safely above physical unprintable printer margin
                    y = pageHeight - (75 * scale);
                    if (key === 'footer_line') y -= (10 * scale);
                }
                
                const isFooterElement = key.toLowerCase().includes('footer') || key.toLowerCase().includes('qr') || key.toLowerCase().includes('notes_box');

                if (tableEndOfTableY > 0 && (val.y * scale) > tableStartY && !isFooterElement) {
                    const originalGap = (val.y * scale) - tableStartY;
                    y = tableEndOfTableY + originalGap - (20 * scale); // Maintain relative relationship
                }

                // INTELLIGENT WRAP PROTECTION: Only add page if we are EXCEEDING the current page boundary
                const pageThreshold = isFooterElement ? (835 * scale) : (785 * scale);

                if (y > pageThreshold && !isFooterElement) {
                    doc.addPage();
                    y = (60 * scale); // Top margin
                    tableEndOfTableY = (60 * scale); // Anchor future elements to this new top
                    tableStartY = 0; // Prevent runaway offsets on the new page
                }

                // A. LOGO
                if (key === 'logo' || val.type === 'logo') {
                    const img = await fetchAsset(logoUrl);
                    if (img) {
                        const w = (val.width || val.size || config.logoSize || 80) * scale;
                        doc.addImage(img, 'PNG', x, y, w, w);
                    }
                    continue; // Fix: Prevent double rendering as text
                }
                // B. QR CODE
                else if (val.type === 'qr' || key.startsWith('qr_') || key === 'qr') {
                    const qrText = compileTemplate(val.label || data.id, context);
                    const qrImg = await fetchQr(qrText);
                    if (qrImg) {
                        const w = (val.width || 60) * scale;
                        doc.addImage(qrImg, 'PNG', x, y, w, w);
                    }
                    continue; // Fix: Prevent double rendering as text
                }
                // C. LINE / DIVIDER
                else if (val.type === 'line' || key.startsWith('line_')) {
                    const x2 = (val.x2 || 555) * scale;
                    let y2 = (val.y2 || val.y || 0) * scale;

                    // Shift the line if it was originally below the table
                    if (tableEndOfTableY > 0 && (val.y * scale) > tableStartY) {
                        const effectiveY2 = (val.y2 || val.y || 0);
                        const originalGap2 = (effectiveY2 * scale) - tableStartY;
                        y2 = tableEndOfTableY + originalGap2 - (20 * scale);
                    }

                    const color = hexToRgb(val.color || (key === 'footer_line' ? '#64748b' : '#cbd5e1'));
                    const thick = (val.thickness || 0.5) * scale;

                    if (color) doc.setDrawColor(color.r, color.g, color.b);
                    doc.setLineWidth(thick);
                    doc.line(x, y, x2, y2);
                    continue; // Fix: Prevent double rendering as text
                }
                // D. TABLE (Dynamic Lists)
                else if (key === 'table' || val.type === 'table') {
                    let yOffsetForTable = val.y * scale;

                    // --- SHIFT REPORT CUSTOM SUMMARY BLOCK (Z-REPORT STANDARD)                    // --- SHIFT REPORT CUSTOM SUMMARY BLOCK (WORLD-STANDARD Z-REPORT) ---
                    if ((usage as any) === 'shift_close' && data.shift_summary) {
                        const s = data.shift_summary;
                        
                        // Draw Main Header Background Box
                        doc.setFillColor(241, 245, 249); // slate-100
                        doc.setDrawColor(203, 213, 225); // slate-200
                        doc.setLineWidth(0.5 * scale);
                        doc.rect(40 * scale, yOffsetForTable - (10 * scale), 515 * scale, 22 * scale, 'FD');
                        
                        doc.setFont("Helvetica", "bold");
                        doc.setFontSize(11 * scale);
                        doc.setTextColor(15, 23, 42); // slate-900
                        doc.text("END OF SHIFT Z-REPORT & CASH RECONCILIATION", 45 * scale, yOffsetForTable + (4 * scale));
                        
                        // Start & End Timestamps
                        doc.setFont("Helvetica", "normal");
                        doc.setFontSize(8 * scale);
                        doc.setTextColor(100, 116, 139);
                        doc.text(`Started: ${s.startedAt}   |   Ended: ${s.endedAt}`, 545 * scale, yOffsetForTable + (3 * scale), { align: 'right' });
                        
                        yOffsetForTable += 26 * scale;
                        
                        // 3 Balanced Executive Summary Cards
                        // Card 1: Shift Billed Sales (40 to 200)
                        doc.setFillColor(248, 250, 252);
                        doc.setDrawColor(226, 232, 240);
                        doc.rect(40 * scale, yOffsetForTable - (6 * scale), 165 * scale, 48 * scale, 'FD');
                        doc.setFont("Helvetica", "bold"); doc.setFontSize(8.5 * scale); doc.setTextColor(71, 85, 105);
                        doc.text("1. SHIFT BILLED SALES", 46 * scale, yOffsetForTable + (2 * scale));
                        doc.setFont("Helvetica", "normal"); doc.setFontSize(8 * scale); doc.setTextColor(100, 116, 139);
                        doc.text("Gross Billed Sales", 46 * scale, yOffsetForTable + (14 * scale));
                        doc.setFont("Helvetica", "bold"); doc.setTextColor(15, 23, 42);
                        doc.text(`${context.currency_symbol} ${Number(s.revenue).toFixed(2)}`, 198 * scale, yOffsetForTable + (14 * scale), { align: 'right' });
                        doc.setFont("Helvetica", "normal"); doc.setTextColor(100, 116, 139);
                        doc.text("Paid Sales", 46 * scale, yOffsetForTable + (25 * scale));
                        doc.setFont("Helvetica", "bold"); doc.setTextColor(22, 101, 52);
                        doc.text(`${context.currency_symbol} ${(Number(s.revenue) - Number(s.pending)).toFixed(2)}`, 198 * scale, yOffsetForTable + (25 * scale), { align: 'right' });
                        doc.setFont("Helvetica", "normal"); doc.setTextColor(100, 116, 139);
                        doc.text("Pending / Credit Bills", 46 * scale, yOffsetForTable + (36 * scale));
                        doc.setFont("Helvetica", "bold"); doc.setTextColor(185, 28, 28);
                        doc.text(`${context.currency_symbol} ${Number(s.pending).toFixed(2)}`, 198 * scale, yOffsetForTable + (36 * scale), { align: 'right' });

                        // Card 2: Collections by Mode (215 to 375)
                        doc.setFillColor(248, 250, 252);
                        doc.setDrawColor(226, 232, 240);
                        doc.rect(215 * scale, yOffsetForTable - (6 * scale), 165 * scale, 48 * scale, 'FD');
                        doc.setFont("Helvetica", "bold"); doc.setFontSize(8.5 * scale); doc.setTextColor(71, 85, 105);
                        doc.text("2. PAYMENT COLLECTIONS", 221 * scale, yOffsetForTable + (2 * scale));
                        doc.setFont("Helvetica", "normal"); doc.setFontSize(8 * scale); doc.setTextColor(100, 116, 139);
                        doc.text("Cash Collected", 221 * scale, yOffsetForTable + (14 * scale));
                        doc.setFont("Helvetica", "bold"); doc.setTextColor(15, 23, 42);
                        doc.text(`${context.currency_symbol} ${Number(s.cashCollected).toFixed(2)}`, 373 * scale, yOffsetForTable + (14 * scale), { align: 'right' });
                        doc.setFont("Helvetica", "normal"); doc.setTextColor(100, 116, 139);
                        doc.text("UPI / Digital", 221 * scale, yOffsetForTable + (25 * scale));
                        doc.setFont("Helvetica", "bold"); doc.setTextColor(15, 23, 42);
                        doc.text(`${context.currency_symbol} ${Number(s.upi).toFixed(2)}`, 373 * scale, yOffsetForTable + (25 * scale), { align: 'right' });
                        doc.setFont("Helvetica", "normal"); doc.setTextColor(100, 116, 139);
                        doc.text("Card / POS", 221 * scale, yOffsetForTable + (36 * scale));
                        doc.setFont("Helvetica", "bold"); doc.setTextColor(15, 23, 42);
                        doc.text(`${context.currency_symbol} ${Number(s.card).toFixed(2)}`, 373 * scale, yOffsetForTable + (36 * scale), { align: 'right' });

                        // Card 3: Drawer Cash Audit & Reconciliation (390 to 555)
                        doc.setFillColor(248, 250, 252);
                        doc.setDrawColor(226, 232, 240);
                        doc.rect(390 * scale, yOffsetForTable - (6 * scale), 165 * scale, 48 * scale, 'FD');
                        doc.setFont("Helvetica", "bold"); doc.setFontSize(8.5 * scale); doc.setTextColor(71, 85, 105);
                        doc.text("3. DRAWER CASH RECONCILIATION", 396 * scale, yOffsetForTable + (2 * scale));
                        doc.setFont("Helvetica", "normal"); doc.setFontSize(7.5 * scale); doc.setTextColor(100, 116, 139);
                        doc.text("(+) Opening Float", 396 * scale, yOffsetForTable + (13 * scale));
                        doc.setFont("Helvetica", "bold"); doc.setTextColor(15, 23, 42);
                        doc.text(`${context.currency_symbol} ${Number(s.openingFloat || 0).toFixed(2)}`, 548 * scale, yOffsetForTable + (13 * scale), { align: 'right' });
                        doc.setFont("Helvetica", "normal"); doc.setTextColor(100, 116, 139);
                        doc.text("(+) Cash Inflow", 396 * scale, yOffsetForTable + (22 * scale));
                        doc.setFont("Helvetica", "bold"); doc.setTextColor(22, 101, 52);
                        doc.text(`+ ${Number(s.cashCollected).toFixed(2)}`, 548 * scale, yOffsetForTable + (22 * scale), { align: 'right' });
                        doc.setFont("Helvetica", "normal"); doc.setTextColor(100, 116, 139);
                        doc.text("(-) Cash Expenses", 396 * scale, yOffsetForTable + (31 * scale));
                        doc.setFont("Helvetica", "bold"); doc.setTextColor(185, 28, 28);
                        doc.text(`- ${Number(s.cashExpenses || 0).toFixed(2)}`, 548 * scale, yOffsetForTable + (31 * scale), { align: 'right' });
                        doc.setFont("Helvetica", "bold"); doc.setTextColor(15, 23, 42);
                        doc.text("(=) Expected In Drawer", 396 * scale, yOffsetForTable + (40 * scale));
                        doc.text(`${context.currency_symbol} ${Number(s.expectedCash).toFixed(2)}`, 548 * scale, yOffsetForTable + (40 * scale), { align: 'right' });

                        yOffsetForTable += 54 * scale;

                        // Reconciliation Result Bar (Expected vs Declared vs Variance)
                        const vNum = Number(s.variance || 0);
                        const isBalanced = Math.abs(vNum) < 0.01;
                        doc.setFillColor(isBalanced ? 240 : (vNum < 0 ? 254 : 240), isBalanced ? 253 : (vNum < 0 ? 242 : 253), isBalanced ? 244 : (vNum < 0 ? 242 : 250));
                        doc.setDrawColor(isBalanced ? 187 : (vNum < 0 ? 254 : 187), isBalanced ? 247 : (vNum < 0 ? 202 : 247), isBalanced ? 208 : (vNum < 0 ? 202 : 208));
                        doc.rect(40 * scale, yOffsetForTable - (6 * scale), 515 * scale, 20 * scale, 'FD');

                        doc.setFont("Helvetica", "bold"); doc.setFontSize(8.5 * scale); doc.setTextColor(15, 23, 42);
                        doc.text(`EXPECTED: ${context.currency_symbol} ${Number(s.expectedCash).toFixed(2)}`, 48 * scale, yOffsetForTable + (6 * scale));
                        doc.text(`ACTUAL DECLARED: ${context.currency_symbol} ${Number(s.actualCash).toFixed(2)}`, 215 * scale, yOffsetForTable + (6 * scale));
                        
                        doc.setTextColor(isBalanced ? 22 : (vNum < 0 ? 220 : 37), isBalanced ? 101 : (vNum < 0 ? 38 : 99), isBalanced ? 52 : (vNum < 0 ? 38 : 235));
                        const varLabel = isBalanced ? "AUDIT: PERFECTLY BALANCED (0.00)" : (vNum < 0 ? `AUDIT: SHORTAGE (- ${context.currency_symbol}${Math.abs(vNum).toFixed(2)})` : `AUDIT: SURPLUS (+ ${context.currency_symbol}${vNum.toFixed(2)})`);
                        doc.text(varLabel, 545 * scale, yOffsetForTable + (6 * scale), { align: 'right' });

                        yOffsetForTable += 22 * scale;

                        // Physical Denomination Count Grid (if available)
                        const denoms = s.denominations || {};
                        const denomEntries = Object.entries(denoms).filter(([val, qty]) => Number(qty) > 0);
                        if (denomEntries.length > 0) {
                            doc.setFillColor(248, 250, 252);
                            doc.setDrawColor(226, 232, 240);
                            doc.rect(40 * scale, yOffsetForTable - (4 * scale), 515 * scale, 18 * scale, 'FD');
                            doc.setFont("Helvetica", "bold"); doc.setFontSize(7.5 * scale); doc.setTextColor(71, 85, 105);
                            doc.text("PHYSICAL CASH COUNT BREAKDOWN:", 46 * scale, yOffsetForTable + (6 * scale));
                            doc.setFont("Helvetica", "normal"); doc.setFontSize(7.5 * scale); doc.setTextColor(15, 23, 42);
                            const denomStr = denomEntries.map(([v, q]) => `₹${v} × ${q} = ₹${Number(v) * Number(q)}`).join("   |   ");
                            doc.text(denomStr.length > 85 ? denomStr.substring(0, 82) + '...' : denomStr, 205 * scale, yOffsetForTable + (6 * scale));
                            yOffsetForTable += 22 * scale;
                        }

                        // Detailed Ledger Header
                        doc.setFillColor(241, 245, 249);
                        doc.setDrawColor(203, 213, 225);
                        doc.rect(40 * scale, yOffsetForTable - (6 * scale), 515 * scale, 18 * scale, 'FD');
                        doc.setFont("Helvetica", "bold");
                        doc.setFontSize(9.5 * scale);
                        doc.setTextColor(15, 23, 42);
                        doc.text("DETAILED LEDGER & SHIFT TRANSACTIONS AUDIT", 45 * scale, yOffsetForTable + (5 * scale));

                        yOffsetForTable += 14 * scale;
                        let dynamicTableConfig = { ...val, y: yOffsetForTable / scale };

                        tableEndOfTableY = await renderTable(doc, usage, data, dynamicTableConfig, scale, pageWidth, pageHeight, context);
                    } else if ((usage as any) === 'lab_catalog') {
                        const tConfig = {
                            columns: [
                                { key: 'name', title: 'INVESTIGATION NAME', width: 180, align: 'left' },
                                { key: 'method', title: 'METHOD', width: 80, align: 'left' },
                                { key: 'unit', title: 'UNIT', width: 50, align: 'center' },
                                { key: 'range', title: 'REF. RANGE', width: 60, align: 'center' },
                                { key: 'price', title: 'PRICE', width: 60, align: 'right' }
                            ]
                        };

                        const flatCatalog: any[] = [];
                        if (Array.isArray(data)) {
                            data.forEach((test: any) => {
                                flatCatalog.push({
                                    name: test.is_panel ? `[PACKAGE] ${test.name}` : test.name,
                                    method: test.method || '-',
                                    unit: test.units || '-',
                                    range: typeof test.reference_range === 'object' ? (test.reference_range?.range || '-') : (test.reference_range || '-'),
                                    price: Number(test.price || 0).toFixed(2),
                                    is_panel: test.is_panel
                                });
                                
                                if (test.is_panel && test.hms_lab_test_panel_member_hms_lab_test_panel_member_panel_idTohms_lab_test) {
                                    const members = test.hms_lab_test_panel_member_hms_lab_test_panel_member_panel_idTohms_lab_test;
                                    members.forEach((m: any) => {
                                        const child = m.hms_lab_test_hms_lab_test_panel_member_member_test_idTohms_lab_test;
                                        if (child) {
                                            flatCatalog.push({
                                                name: `   • ${child.name}`,
                                                method: child.method || '-',
                                                unit: child.units || '-',
                                                range: typeof child.reference_range === 'object' ? (child.reference_range?.range || '-') : (child.reference_range || '-'),
                                                price: '-',
                                                is_child: true
                                            });
                                        }
                                    });
                                }
                            });
                        }
                        tableEndOfTableY = await renderTable(doc, usage, flatCatalog, tConfig, scale, pageWidth, pageHeight, context);
                    } else {
                        tableEndOfTableY = await renderTable(doc, usage, data, val, scale, pageWidth, pageHeight, context);
                    }

                    continue;
                }
                // E. TEXT & BOX ELEMENTS
                else {
                    const bgColor = hexToRgb(val.backgroundColor);
                    const strokeColor = hexToRgb(val.stroke);

                    if (bgColor || strokeColor || val.height) {
                        if (bgColor) doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
                        if (strokeColor) doc.setDrawColor(strokeColor.r, strokeColor.g, strokeColor.b);

                        const p = (val.padding || 0) * scale;
                        const w = (val.width || 100) * scale;
                        const h = (val.height || ((val.fontSize || 10) + 10)) * scale;

                        const style = (bgColor && strokeColor) ? 'FD' : (bgColor ? 'F' : 'S');
                        doc.rect(x - p, y - p, w, h, style);
                    }

                    const label = val.label || '';
                    if (!label && key !== 'name' && key !== 'hosp_name') continue;

                    let compiledText = compileTemplate(label, context);
                    
                    if ((usage as any) === 'lab_catalog') {
                        if (key === 'bill_to' || key === 'inv_data_lbl') continue;
                    }

                    if ((usage as any) === 'payment_voucher' || (usage as any) === 'shift_close') {
                        if (key === 'bill_to') compiledText = (usage as any) === 'shift_close' ? "SHIFT HANDLED BY:" : "PAID TO / PAYEE:";
                        if (key === 'inv_data_lbl') compiledText = (usage as any) === 'shift_close' ? "SHIFT REPORT DETAILS:" : "VOUCHER DETAILS:";
                        if (key === 'patient_id' || key === 'patient_phone' || key === 'age_gender') continue;
                    }
                    if (!compiledText && !label.includes('Hospital')) continue;

                    const isHospName = key === 'name' || key === 'hosp_name';
                    doc.setFontSize((val.fontSize || 10) * scale);
                    const isBold = val.fontWeight === 'bold' || val.fontWeight === '900' || val.fontWeight === '700';
                    const font = val.fontType || (isHospName ? (config.hospitalNameFont || "times") : "times");
                    doc.setFont(font, isBold ? "bold" : "normal");

                    const color = hexToRgb(val.color || (isHospName ? (config.hospitalNameColor || "#000000") : "#000000"));
                    if (color) doc.setTextColor(color.r, color.g, color.b);

                    const charSpacing = val.letterSpacing || (isHospName ? (config.hospitalNameLetterSpacing || 0) : 0);
                    if (charSpacing) (doc as any).setCharSpace(charSpacing);

                    const options: any = { baseline: 'top' };
                    if (val.align === 'center') options.align = 'center';
                    else if (val.align === 'right') options.align = 'right';

                    if (val.width) {
                        options.maxWidth = val.width * scale;
                    }

                    // --- SMART MULTILINE & ICON RENDERER ---
                    const maxWidth = (val.width || 500) * scale;
                    let currentY = y;

                    // SMART SIGNATURE LAYER: If we are rendering the doctor's footer notes,
                    // we automatically prepend the Doctor's Name in a larger, bold font.
                    const isDoctorNotes = ((usage as any) === 'op_slip' && (key === 'footer' || key === 'signature' || key === 'doc_notes' || key === 'qualification'));
 
                    if (isDoctorNotes) {
                        // Official high-fidelity clinical stamp
                        const boxWidth = 220 * scale; 
                        const centerX = pageWidth - (boxWidth / 2) - (40 * scale);
                        
                        let cleanName = (context.doctor?.doctor_name || "").toUpperCase();
                        if (cleanName.includes("UNDEFINED") || !cleanName || cleanName.trim() === "DR.") {
                            cleanName = "MEDICAL OFFICER";
                        }
                        const qualification = (context.doctor?.digital_print_footer || context.doctor?.footer_text || "").trim();
                        
                        // Split multi-line strings explicitly to ensure perfect rendering of master form data
                        const splitQual = qualification && qualification.toUpperCase() !== cleanName && !qualification.includes("undefined")
                            ? doc.splitTextToSize(qualification, boxWidth)
                            : [];
                        
                        // DYNAMIC LIFT: Calculate the total height of all footer lines
                        // Anchor the entire block so its absolute bottom rests safely at pageHeight - (45 * scale)
                        const totalQualHeight = splitQual.length * (11 * scale);
                        const bottomSafeAnchor = pageHeight - (45 * scale);
                        const stampTopY = Math.min(currentY, bottomSafeAnchor - totalQualHeight - (16 * scale));

                        doc.setFont("helvetica", "bold");
                        doc.setFontSize(10 * scale);
                        doc.text(cleanName, centerX, stampTopY, { align: 'center', baseline: 'top' });
                        
                        if (splitQual.length > 0) {
                            doc.setFont("times", "italic");
                            doc.setFontSize(8 * scale);
                            
                            let qualY = stampTopY + (14 * scale);
                            splitQual.forEach((line: string) => {
                                doc.text(line, centerX, qualY, { align: 'center', baseline: 'top' });
                                qualY += (11 * scale);
                            });
                        }
                        continue; 
                    }

                    // Robust multi-line splitting (Preserves manual \n while handling auto-wrap)
                    const rawLines = compiledText.split('\n');
                    const lines: string[] = [];
                    rawLines.forEach(rl => {
                        lines.push(...doc.splitTextToSize(rl, maxWidth));
                    });

                    const lineHeight = (isDoctorNotes ? 9 : (val.fontSize || 10)) * 1.35 * scale;

                    lines.forEach(line => {
                        if (line.includes('☎') || line.includes('✉') || line.includes('✆')) {
                            let currentX = x;
                            const parts = line.split(/([☎✉✆])/);
                            parts.forEach(part => {
                                if (part === '☎' || part === '✆') {
                                    doc.setTextColor(220, 38, 38); // Signature Red
                                    doc.setFont("helvetica", "bold");
                                    doc.setFontSize((val.fontSize || 11) * scale);
                                    doc.text("(P)", currentX, currentY, options);
                                    currentX += doc.getTextWidth("(P)") + (2 * scale);
                                } else {
                                    if (color) doc.setTextColor(color.r, color.g, color.b);
                                    doc.setFont("helvetica", "bold");
                                    doc.setFontSize((val.fontSize || 11) * scale);
                                    doc.text(part, currentX, currentY, options);
                                    currentX += doc.getTextWidth(part);
                                }
                            });
                        } else {
                            if (color) doc.setTextColor(color.r, color.g, color.b);
                            doc.text(line, x, currentY, options);
                        }
                        currentY += lineHeight;
                    });
                }
            } catch (elemErr) {
                console.error(`[ENGINE] Element Failure [${key}]:`, elemErr);
            }
        }

        if (autoPrint) doc.autoPrint({ variant: 'non-conform' });

        const output = doc.output('datauristring');
        console.log(`[ENGINE] Success. Output length: ${output.length}`);
        return output.split(',')[1];

    } catch (err) {
        console.error("FATAL UNIVERSAL PDF ENGINE FAILURE:", err);
        throw err;
    }
}

async function renderTable(doc: jsPDF, usage: string, data: any, tableConfig: any, scale: number, pageWidth: number, pageHeight: number, context: any) {
    const margin = (tableConfig.x || 40) * scale;
    const bottomMargin = ((usage as any) === 'sale_bill' ? 80 : 180) * scale; // REDUCED BUFFER FOR SALE BILL (NO FOOTER)
    let currentY = (tableConfig.y || 250) * scale;
    const rowHeight = 22 * scale;
    const fontSize = (tableConfig.fontSize || 9) * scale;

    let rawItems: any[] = ((usage as any) === 'prescription')
        ? (data.medicines || data.prescription?.[0]?.medicines || [])
        : (data.hms_invoice_lines || data.items || data.hms_lab_order_lines || data.hms_lab_order_line || []);

    if ((!rawItems || rawItems.length === 0) && data?.line_items) {
        let jsonLines = data.line_items;
        if (typeof jsonLines === 'string') {
            try { jsonLines = JSON.parse(jsonLines); } catch (_) { jsonLines = []; }
        }
        if (Array.isArray(jsonLines) && jsonLines.length > 0) rawItems = jsonLines;
    }
    if ((!rawItems || rawItems.length === 0) && data?.billing_metadata) {
        const bMeta = typeof data.billing_metadata === 'string' ? JSON.parse(data.billing_metadata || '{}') : (data.billing_metadata || {});
        if (Array.isArray(bMeta.items)) rawItems = bMeta.items;
        else if (Array.isArray(bMeta.line_items)) rawItems = bMeta.line_items;
    }

    // Filter out ghost rows/empty inputs saved by older versions
    const items = (rawItems || []).filter((i: any) => i.hms_product_id || i.product_id || i.description || i.metadata?.account_id || i.medicine_id || i.test_id || (i.name && i.name !== '') || i.category || i.memo);

    const configCols = context.config?.columns || { showTax: true, showDiscount: true, showUOM: true, showHsn: false };
    
    // Dynamic X offsets
    let qtyX = (tableConfig.qtyX || 380) * scale;
    let rateX = (tableConfig.rateX || 470) * scale;
    let taxX = 0;
    let discX = 0;
    let totalX = (tableConfig.totalX || 555) * scale;
    
    if ((usage as any) === 'sale_bill' || (usage as any) === 'pos_bill') {
        const isRoll = pageWidth < 300; 
        if (isRoll) {
            qtyX = pageWidth - (85 * scale);
            rateX = pageWidth - (55 * scale);
            totalX = pageWidth - margin;
        } else {
            totalX = pageWidth - margin - (10 * scale);
            taxX = configCols.showTax ? totalX - (55 * scale) : 0;
            discX = configCols.showDiscount ? (taxX || totalX) - (55 * scale) : 0;
            rateX = (discX || taxX || totalX) - (55 * scale);
            qtyX = rateX - (45 * scale);
        }
    }

    const addPaging = () => {
        if ((usage as any) === 'sale_bill') return; // [USER-REQUEST] No footer/paging for bills
        const pageNum = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(7 * scale);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - (20 * scale), { align: 'right' });
    };

    const renderContinuationHeader = () => {
        const pageNum = (doc as any).internal.getNumberOfPages();
        if (pageNum > 1) {
            doc.setFontSize(7 * scale);
            doc.setTextColor(100, 116, 139);
            const docNum = data.invoice_number || data.doc_number || data.id || "Document";
            const dateStr = data.created_at ? new Date(data.created_at).toLocaleDateString() : "";
            doc.text(`${docNum} | ${dateStr}`, margin, margin - (15 * scale));
            doc.text(`Continuation Sheet`, pageWidth / 2, margin - (15 * scale), { align: 'center' });
        }
    };

    const renderHeader = (y: number) => {
        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(1 * scale);
        doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
        doc.setFontSize(fontSize + 1);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);

        const textY = y + (15 * scale);
        doc.text('#', margin + (5 * scale), textY);

        if ((usage as any) === 'prescription') {
            doc.text('MEDICATION', margin + (35 * scale), textY);
            doc.text('DOSAGE', qtyX, textY, { align: 'center' });
            doc.text('PERIOD', rateX, textY, { align: 'right' });
            doc.text('TIMING', totalX, textY, { align: 'right' });
        } else if ((usage as any) === 'lab_report') {
            doc.text('INVESTIGATION', margin + (35 * scale), textY);
            doc.text('RESULT', qtyX, textY, { align: 'center' });
            doc.text('UNIT', rateX, textY, { align: 'right' });
            doc.text('REF. RANGE', totalX, textY, { align: 'right' });
        } else if ((usage as any) === 'payment_voucher' || (usage as any) === 'shift_close') {
            doc.text((usage as any) === 'shift_close' ? 'DETAILS / PARTICULARS' : 'PARTICULARS (LEDGER)', margin + (35 * scale), textY);
            if ((usage as any) === 'shift_close') {
                doc.text('OUT (DEBIT)', rateX, textY, { align: 'right' });
                doc.text('IN (CREDIT)', totalX, textY, { align: 'right' });
            } else {
                doc.text('AMOUNT', totalX, textY, { align: 'right' });
            }
        } else {
            doc.text('DESCRIPTION', margin + (35 * scale), textY);
            doc.text('QTY', qtyX, textY, { align: 'center' });
            doc.text('RATE', rateX, textY, { align: 'right' });
            if (taxX > 0) doc.text('TAX', taxX, textY, { align: 'right' });
            if (discX > 0) doc.text('DISC', discX, textY, { align: 'right' });
            doc.text('TOTAL', totalX, textY, { align: 'right' });
        }

        return y + rowHeight;
    };

    addPaging();
    currentY = renderHeader(currentY);

    let totalDebit = 0;
    let totalCredit = 0;

    items.forEach((item: any, idx: number) => {
        if (currentY + rowHeight > pageHeight - bottomMargin) {
            // INDICATOR: Continued on next page
            doc.setFontSize(7 * scale);
            doc.setTextColor(148, 163, 184);
            doc.text("Continued on next page...", pageWidth / 2, pageHeight - (bottomMargin - 10 * scale), { align: 'center' });

            doc.addPage();
            addPaging();
            renderContinuationHeader();
            currentY = renderHeader(margin);
        }

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'normal');

        const textY = currentY + (15 * scale);
        doc.text(String(idx + 1), margin + (5 * scale), textY);

        let dynamicRowHeight = rowHeight;
        
        if ((usage as any) === 'prescription') {
            const name = (item.hms_product?.name || item.name || "Generic Medicine").toUpperCase();
            const dosage = item.dosage || `${item.morning || 0}-${item.afternoon || 0}-${item.evening || 0}-${item.night || 0}`;
            doc.text(name, margin + (35 * scale), textY);
            doc.text(dosage, qtyX, textY, { align: 'center' });
            doc.text(`${item.days || item.duration || '-'} Days`, rateX, textY, { align: 'right' });
            doc.text(item.timing || 'Post-Meal', totalX, textY, { align: 'right' });
        } else if ((usage as any) === 'lab_report') {
            const name = (item.hms_lab_test?.name || item.description || "Lab Investigation").toUpperCase();
            const result = item.hms_lab_result?.[0]?.result_value || item.metadata?.result || item.result || "-";
            const unit = item.hms_lab_test?.units || item.hms_lab_result?.[0]?.units || item.unit || "";
                        const range = item.hms_lab_test?.reference_range || item.hms_lab_result?.[0]?.reference_range || item.range || "-";
            
            doc.text(name, margin + (35 * scale), textY);
            doc.text(String(result), qtyX, textY, { align: 'center' });
            doc.text(String(unit), rateX, textY, { align: 'right' });
            doc.text(typeof range === 'string' ? range : JSON.stringify(range), totalX, textY, { align: 'right' });
        } else if ((usage as any) === 'payment_voucher' || (usage as any) === 'shift_close') {
            const description = (item.category?.name || item.metadata?.account_name || item.description || "General Ledger").toUpperCase();
            doc.text(description.length > 50 ? description.substring(0, 47) + '...' : description, margin + (35 * scale), textY);
            if (item.metadata?.description || item.memo) {
                doc.setFontSize(fontSize - 1);
                doc.setTextColor(100, 116, 139);
                const subTxt = item.metadata?.description || item.memo;
                // Move memo text properly below the main description
                doc.text(subTxt.length > 50 ? subTxt.substring(0, 47) + '...' : subTxt, margin + (35 * scale), textY + (10 * scale));
                dynamicRowHeight = rowHeight + (10 * scale);
            }
            doc.setFontSize(fontSize);
            doc.setTextColor(30, 41, 59);
            
            const amtStr = Number(item.amount || item.total || 0).toFixed(2);
            const amtNum = Number(item.amount || item.total || 0);

            if ((usage as any) === 'shift_close') {
                let debitStr = '-';
                let creditStr = '-';
                
                if (item.display_val !== undefined) {
                    debitStr = '';
                    creditStr = item.display_val;
                } else if (description.includes('--- DETAILED LEDGER ---') || description.includes('--- SHIFT SUMMARY ---')) {
                    debitStr = '';
                    creditStr = '';
                } else if (item.type === 'OUTBOUND' || description.includes('PETTY CASH')) {
                    debitStr = amtStr;
                    totalDebit += amtNum;
                } else if (item.type === 'INBOUND' || item.type === 'PENDING') {
                    creditStr = amtStr;
                    totalCredit += amtNum;
                } else {
                    creditStr = amtStr;
                    totalCredit += amtNum;
                }

                doc.text(debitStr, rateX, textY, { align: 'right' });
                doc.text(creditStr, totalX, textY, { align: 'right' });
            } else {
                doc.text(amtStr, totalX, textY, { align: 'right' });
            }
        } else {
            const description = (item.hms_product?.name || item.description || "Medical Service").toUpperCase();
            
            // Sub-text for UOM or HSN if requested
            let subTxt = "";
            if (configCols.showUOM && item.uom) subTxt += `Unit: ${item.uom} `;
            if (configCols.showHsn && item.hms_product?.hsn_code) subTxt += `| HSN: ${item.hms_product.hsn_code}`;
            
            doc.text(description.length > 35 ? description.substring(0, 32) + '...' : description, margin + (35 * scale), textY);
            if (subTxt) {
                doc.setFontSize(fontSize - 1);
                doc.setTextColor(100, 116, 139);
                doc.text(subTxt, margin + (35 * scale), textY + (10 * scale));
                dynamicRowHeight = rowHeight + (10 * scale);
            }
            doc.setFontSize(fontSize);
            doc.setTextColor(30, 41, 59);

            doc.text(String(item.quantity || 1), qtyX, textY, { align: 'center' });
            doc.text(Number(item.unit_price || item.rate || 0).toFixed(2), rateX, textY, { align: 'right' });
            if (taxX > 0) doc.text(Number(item.tax_amount || 0).toFixed(2), taxX, textY, { align: 'right' });
            if (discX > 0) doc.text(Number(item.discount_amount || 0).toFixed(2), discX, textY, { align: 'right' });
            doc.text(Number(item.net_amount || item.total || 0).toFixed(2), totalX, textY, { align: 'right' });
        }

        currentY += dynamicRowHeight;
    });

    // --- FINANCIAL BREAKDOWN (World Class Summary) ---
    if ((usage as any) === 'sale_bill' || (usage as any) === 'sales_return' || (usage as any) === 'purchase_return' || (usage as any) === 'purchase_receipt' || (usage as any) === 'payment_voucher') {
        const totalDiscount = Number(data.total_discount || 0);
        const totalTax = Number(data.total_tax || data.tax_amount || 0);
        const subtotal = Number(data.subtotal || 0);

        if (totalTax > 0 || totalDiscount > 0) {
            currentY += 5 * scale;
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5 * scale);
            doc.line(margin + (200 * scale), currentY, totalX, currentY);
            currentY += 15 * scale;

            doc.setFontSize(fontSize - 1);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);

            // Always show Subtotal if we have either tax or discount to provide "Before" context
            const subtotalLabel = totalDiscount > 0 ? "TOTAL BEFORE DISCOUNT:" : (totalTax > 0 ? "SUBTOTAL (TAXABLE VALUE):" : "SUBTOTAL:");
            doc.text(subtotalLabel, margin + (200 * scale), currentY, { align: 'left' });
            doc.text(`${context.currency_symbol} ${subtotal.toFixed(2)}`, totalX, currentY, { align: 'right' });
            currentY += 15 * scale;

            if (totalTax > 0) {
                doc.text("TOTAL TAX:", margin + (200 * scale), currentY, { align: 'left' });
                doc.text(`${context.currency_symbol} ${totalTax.toFixed(2)}`, totalX, currentY, { align: 'right' });
                currentY += 15 * scale;
            }

            if (totalDiscount > 0) {
                doc.setTextColor(185, 28, 28); // rose-700
                doc.text("TOTAL DISCOUNT:", rateX, currentY, { align: 'right' });
                doc.text(`- ${totalDiscount.toFixed(2)}`, totalX, currentY, { align: 'right' });
                currentY += 15 * scale;
                doc.setTextColor(0, 0, 0);
            }
        }
    }

    // --- LEDGER TALLY (SHIFT REPORT ONLY) ---
    if ((usage as any) === 'shift_close') {
        currentY += 10 * scale;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1 * scale);
        doc.line(margin + (35 * scale), currentY, totalX, currentY); // Top line
        
        currentY += 15 * scale;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontSize);
        doc.text("TOTAL TRANSACTIONS TALLY:", margin + (35 * scale), currentY);
        doc.text(totalDebit.toFixed(2), rateX, currentY, { align: 'right' });
        doc.text(totalCredit.toFixed(2), totalX, currentY, { align: 'right' });
        
        currentY += 5 * scale;
        doc.line(margin + (35 * scale), currentY, totalX, currentY); // Bottom line
        doc.line(margin + (35 * scale), currentY + (2 * scale), totalX, currentY + (2 * scale)); // Double bottom line (Accountant Standard)

        // Dual Verification Signatures Block
        currentY += 45 * scale;
        if (currentY + (35 * scale) > pageHeight - bottomMargin) {
            doc.addPage();
            currentY = margin + (40 * scale);
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8 * scale);
        doc.setTextColor(71, 85, 105);

        // Cashier Line
        doc.line(margin + (40 * scale), currentY, margin + (190 * scale), currentY);
        doc.text(`Cashier / Operator Signature (${data.hms_patient?.name || 'Staff'})`, margin + (40 * scale), currentY + (12 * scale));

        // Supervisor Line
        doc.line(totalX - (150 * scale), currentY, totalX, currentY);
        doc.text("Verified by (Supervisor / Auditor)", totalX - (150 * scale), currentY + (12 * scale));

        currentY += 25 * scale;
    }

    return currentY;
}
