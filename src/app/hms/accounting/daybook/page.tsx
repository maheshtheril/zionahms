import { auth } from "@/auth"
import { DetailedLedgerReport } from "@/components/accounting/detailed-ledger-report"
import { Metadata } from "next"
import { SYSTEM_DEFAULT_CURRENCY_CODE, SYSTEM_DEFAULT_CURRENCY_SYMBOL } from "@/lib/currency"

export const metadata: Metadata = {
    title: "Daybook | Accounting Oversight",
    description: "Daily transaction register and audit log",
}

export default async function DaybookPage() {
    const session = await auth();
    return (
        <DetailedLedgerReport
            type="daybook"
            currencyCode={session?.user?.currencyCode || SYSTEM_DEFAULT_CURRENCY_CODE}
            currencySymbol={session?.user?.currencySymbol || SYSTEM_DEFAULT_CURRENCY_SYMBOL}
        />
    )
}
