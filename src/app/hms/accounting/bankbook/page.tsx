import { auth } from "@/auth"
import { DetailedLedgerReport } from "@/components/accounting/detailed-ledger-report"
import { Metadata } from "next"
import { SYSTEM_DEFAULT_CURRENCY_CODE, SYSTEM_DEFAULT_CURRENCY_SYMBOL } from "@/lib/currency"

export const metadata: Metadata = {
    title: "Bankbook | Accounting Oversight",
    description: "Bank account ledger and reconciliation register",
}

export default async function BankbookPage() {
    const session = await auth();
    return (
        <DetailedLedgerReport
            type="bankbook"
            currencyCode={session?.user?.currencyCode || SYSTEM_DEFAULT_CURRENCY_CODE}
            currencySymbol={session?.user?.currencySymbol || SYSTEM_DEFAULT_CURRENCY_SYMBOL}
        />
    )
}
