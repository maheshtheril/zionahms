import { auth } from "@/auth"
import { FinancialDashboard } from "@/components/accounting/financial-dashboard"
import { Metadata } from "next"
import { SYSTEM_DEFAULT_CURRENCY_CODE, SYSTEM_DEFAULT_CURRENCY_SYMBOL } from "@/lib/currency"

export const metadata: Metadata = {
    title: "Financial Dashboard | World Standard Accounting",
    description: "Daily accounting reports, P&L, and Balance Sheet",
}

import { Suspense } from "react"

export default async function AccountingDashboardPage({ searchParams }: { searchParams?: Promise<any> }) {
    const session = await auth();
    const params = searchParams ? (await searchParams) : {};

    return (
        <div className="flex-1 space-y-4">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
                    <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Loading Financial Intelligence...</p>
                </div>
            }>
                <FinancialDashboard
                    currencyCode={session?.user?.currencyCode || SYSTEM_DEFAULT_CURRENCY_CODE}
                    currencySymbol={session?.user?.currencySymbol || SYSTEM_DEFAULT_CURRENCY_SYMBOL}
                    initialView={params?.view === 'classic' ? 'classic' : 'modern'}
                    initialTab={params?.tab === 'bs' ? 'bs' : 'pl'}
                />
            </Suspense>
        </div>
    )
}
