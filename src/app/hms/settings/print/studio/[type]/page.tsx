import { getPrintTemplates } from "@/app/actions/print-settings"
import { FullScreenStudio } from "./studio-page-client"
import { notFound } from "next/navigation"

const VALID_TYPES = ['sale_bill', 'pos_bill', 'purchase_receipt', 'op_slip', 'lab_report', 'prescription', 'payment_voucher', 'shift_close', 'sales_return', 'purchase_return']

const TYPE_LABELS: Record<string, string> = {
    sale_bill: 'Sale Invoice',
    pos_bill: 'POS Receipt',
    purchase_receipt: 'Purchase Bill (GRN)',
    op_slip: 'OP Slip / Token',
    lab_report: 'Lab Report',
    prescription: 'Prescription',
    payment_voucher: 'Payment Voucher',
    shift_close: 'Shift Z-Report',
    sales_return: 'Sales Return',
    purchase_return: 'Purchase Return',
}

export default async function PrintStudioPage({ params }: { params: { type: string } }) {
    const { type } = params
    if (!VALID_TYPES.includes(type)) notFound()

    const res = await getPrintTemplates()
    const data = (res.success && res.data) ? res.data as Record<string, any[]> : {}
    const templates = data[type] || []

    return (
        <FullScreenStudio
            usage={type}
            label={TYPE_LABELS[type] || type}
            initialTemplates={templates}
        />
    )
}
