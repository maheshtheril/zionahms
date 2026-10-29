'use server'

import { auth } from "@/auth"
import { jsPDF } from "jspdf"

export async function generateHMSWorkflowGuidePDF() {
    const session = await auth()
    if (!session) throw new Error("Unauthorized")

    const doc = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4"
    })

    // --- COLORS ---
    const primary = [15, 23, 42] // Slate 900
    const accent = [79, 70, 229] // Indigo 600
    const emerald = [5, 150, 105] // Emerald 600
    const text = [51, 65, 85] // Slate 700

    // --- COVER PAGE ---
    doc.setFillColor(primary[0], primary[1], primary[2])
    doc.rect(0, 0, 595, 842, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(40)
    doc.text('TACTICAL MANUAL', 50, 300)
    doc.setFontSize(24)
    doc.text('Enterprise ERP Ecosystem', 50, 340)

    doc.setDrawColor(accent[0], accent[1], accent[2])
    doc.setLineWidth(5)
    doc.line(50, 370, 200, 370)

    doc.setFontSize(12)
    doc.setTextColor(148, 163, 184)
    doc.text('Institutional Workflow & Operations Guide', 50, 400)
    doc.text('VERSION 2026.01 | ENTERPRISE EDITION', 50, 420)

    // --- CONTENT PAGES ---
    let y = 50
    const margin = 50
    const pageWidth = 495 // 595 - 100

    const addNewPage = () => {
        doc.addPage()

        // Header on sub-pages
        doc.setFillColor(primary[0], primary[1], primary[2])
        doc.rect(0, 0, 595, 40, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.text('ENTERPRISE OPERATIONAL STANDARDS', margin, 25)

        y = 80
    }

    const addSection = (title: string, content: string[], roleColor: number[]) => {
        if (y > 650) addNewPage()

        doc.setDrawColor(roleColor[0], roleColor[1], roleColor[2])
        doc.setLineWidth(2)
        doc.line(margin, y - 5, margin + 50, y - 5)

        doc.setTextColor(roleColor[0], roleColor[1], roleColor[2])
        doc.setFont("helvetica", "bold")
        doc.setFontSize(16)
        doc.text(title.toUpperCase(), margin, y + 15)
        y += 40

        content.forEach(line => {
            doc.setTextColor(text[0], text[1], text[2])
            doc.setFont("helvetica", "normal")
            doc.setFontSize(10)
            const splitLines = doc.splitTextToSize(line, pageWidth)
            doc.text(splitLines, margin + 10, y)
            y += (splitLines.length * 14) + 5

            if (y > 780) addNewPage()
        })
        y += 20
    }

    addNewPage()

    addSection('1. RECEPTION & CASHIER (Revenue Frontier)', [
        '• PATIENT ONBOARDING: Register walk-in patients or refer from appointments. Ensure "UHID" is generated for tracking.',
        '• BILLING TERMINAL: Use /hms/billing/new. Add services (Consultations, Procedures) and Items (Medicines, Consumables).',
        '• ZERO-TAX POLICY: Services like consultations are automatically set to 0% Tax to maintain clinical compliance.',
        '• SETTLEMENT: Record payments (Cash, Card, UPI). For partial payments, the system maintains an "Outstanding" balance.',
        '• PREMIUM PRINTS: Generate high-fidelity receipts. Select "Save as PDF" for soft copies or standard A4 for hard copies.',
        '• END-OF-DAY: Review the "Invoices" list to reconcile collected cash with system records.'
    ], accent)

    addSection('2. NURSING UNIT (Clinical Operations)', [
        '• VITALS RECORDING: Capture Blood Pressure, Heart Rate, and SpO2 immediately upon arrival. This data flows to the Doctor in real-time.',
        '• ITEM CONSUMPTION: Use the "Record Usage" feature to scan and log medicines/consumables used for a patient. This links directly to billing.',
        '• ORDER MANAGEMENT: Monitor lab orders and sample collections. Mark status as "Sample Collected" once the hand-off is complete.'
    ], emerald)

    addSection('3. DOCTOR / CONSULTANT (The EMR Core)', [
        '• CLINICAL DASHBOARD: View patient history, allergy alerts, and previous vitals before the session.',
        '• ELECTRONIC PRESCRIPTION (Rx): Search for medicines by brand or generic name. Specify dosage (Morning-Afternoon-Night) and duration.',
        '• INVESTIGATIONS: One-click ordering of Lab Tests. Orders are instantly visible to the Lab and Nursing departments.',
        '• DIAGNOSIS: Record ICD-compliant diagnosis notes. These stay pinned to the patient profile for future continuity.'
    ], [101, 119, 134]) // Slate 500

    addSection('4. ACCOUNTANT (Institutional ERP)', [
        '• CLASSIC ERP MODE: Use /hms/accounting/payments/new for high-speed terminal entry. Designed for professional accountants.',
        '• KEYBOARD MACROS: Use Ctrl+A to Save, Esc to Quit, and Enter to navigate fields. The system is optimized for zero-mouse interaction.',
        '• VOUCHER ENTRIES: Record against bills (Suppliers/Vendors) or lead direct expense entries for miscellaneous items.',
        '• RECONCILIATION: Automatic clearing of forms after every successful save allows for endless, high-speed data entry.'
    ], [22, 101, 52]) // Forest Green (Classic ERP)

    addSection('5. LABORATORY & RADIOLOGY', [
        '• ORDER PIPELINE: View pending investigations sorted by urgency.',
        '• RESULT RECORDING: Input numerical values or text-based observations. Critical values are highlighted for immediate doctor attention.',
        '• REPORT UPLOAD: Attach signed scan reports or PDF summaries directly to the patient record.',
        '• VERIFICATION: Multi-level verification ensures no report is released to the patient without medical approval.'
    ], [190, 18, 60]) // Rose 600

    addNewPage()
    doc.setTextColor(accent[0], accent[1], accent[2])
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.text('6. SYSTEM ADMINISTRATION & SECURITY', margin, 100)

    y = 140
    addSection('Configuration Standards', [
        '• PERMISSIONS: Strict RBAC (Role Based Access Control). A Nurse cannot see account ledgers, and a Cashier cannot modify prescriptions.',
        '• DATA ARCHIVING: Every transaction generates a persistent record. Deletion is restricted to site administrators to prevent financial fraud.',
        '• AUDIT TRAILS: Every PDF print and every billing update is time-stamped with the user ID for absolute accountability.'
    ], primary)

    // --- FOOTER FOR ALL ---
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(`Page ${i} of ${pageCount} | INSTITUTIONAL CONFIDENTIAL`, 297, 820, { align: 'center' })
    }

    const pdfOutput = doc.output('arraybuffer')
    return Buffer.from(pdfOutput)
}
