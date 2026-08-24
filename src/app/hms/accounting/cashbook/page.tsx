import { auth } from "@/auth"
import { DetailedLedgerReport } from "@/components/accounting/detailed-ledger-report"
import { Metadata } from "next"
import { SYSTEM_DEFAULT_CURRENCY_CODE, SYSTEM_DEFAULT_CURRENCY_SYMBOL } from "@/lib/currency"

export const metadata: Metadata = {
    title: "Cashbook | Accounting Oversight",
    description: "Cash account ledger and balance tracking",
}

export default async function CashbookPage() {
    const session = await auth();
    return (
        <DetailedLedgerReport
            type="cashbook"
            currencyCode={session?.user?.currencyCode || SYSTEM_DEFAULT_CURRENCY_CODE}
            currencySymbol={session?.user?.currencySymbol || SYSTEM_DEFAULT_CURRENCY_SYMBOL}
        />
    )
}
