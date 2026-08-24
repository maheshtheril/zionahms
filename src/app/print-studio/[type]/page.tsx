import { getPrintTemplates } from "@/app/actions/print-settings"
import { FullScreenStudio } from "@/components/print/full-screen-studio"
import { notFound } from "next/navigation"

const VALID = ['sale_bill','pos_bill','purchase_receipt','op_slip','lab_report','prescription','payment_voucher','shift_close','sales_return','purchase_return']
const LABELS: Record<string, string> = {
    sale_bill: 'Sale Invoice', pos_bill: 'POS Receipt', purchase_receipt: 'Purchase Bill (GRN)',
    op_slip: 'OP Slip / Token', lab_report: 'Lab Report', prescription: 'Prescription',
    payment_voucher: 'Payment Voucher', shift_close: 'Shift Z-Report',
    sales_return: 'Sales Return', purchase_return: 'Purchase Return',
}

export default async function PrintStudioPage({ params }: { params: Promise<{ type: string }> }) {
    const { type } = await params  // Next.js 15/16: params must be awaited
    if (!VALID.includes(type)) notFound()

    let initialTemplates: any[] = []
    try {
        const res = await getPrintTemplates()
        if (res.success && res.data) {
            initialTemplates = (res.data as Record<string, any[]>)[type] || []
        }
    } catch (e) {
        console.error('[PrintStudio] Failed to load templates:', e)
    }

    return <FullScreenStudio usage={type} label={LABELS[type] || type} initialTemplates={initialTemplates} />
}
