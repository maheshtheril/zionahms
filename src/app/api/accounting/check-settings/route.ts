import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.companyId) {
            return NextResponse.json({ missing: [] })
        }

        const companyId = session.user.companyId

        const settings = await prisma.company_accounting_settings.findUnique({
            where: { company_id: companyId }
        })

        const paymentMapping = await prisma.hms_settings.findFirst({
            where: { company_id: companyId, key: 'payment_method_mapping' }
        })

        const missing: string[] = []

        if (!settings) {
            return NextResponse.json({ missing: ['All accounting accounts (not configured)'] })
        }

        if (!settings.ar_account_id) missing.push('Accounts Receivable (AR)')
        if (!settings.sales_account_id) missing.push('Sales Revenue')
        if (!settings.ap_account_id) missing.push('Accounts Payable (AP)')
        if (!settings.purchase_account_id) missing.push('Purchase Account')
        if (!settings.output_tax_account_id) missing.push('Output Tax / GST')

        const mapping = (paymentMapping?.value as any) || {}
        if (!mapping.cash) missing.push('Cash Payment Account')
        if (!mapping.upi && !mapping.bank_transfer) missing.push('Bank/UPI Payment Account')

        return NextResponse.json({ missing, configured: missing.length === 0 })
    } catch (e) {
        return NextResponse.json({ missing: [] })
    }
}
