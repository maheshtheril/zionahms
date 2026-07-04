
import { auth } from "@/auth"
import { getAccountLedger } from "@/app/actions/accounting/ledger"
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Calendar, Filter } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function LedgerPage(props: { params: Promise<any> }) {
    const params = await props.params;
    const session = await auth()

    // Default to last 365 days? Or all time?
    const { data: lines, account, error } = await getAccountLedger(params.accountId);

    if (error || !account) {
        return <div className="p-8 text-red-500">Error: {error || "Account not found"}</div>
    }

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    }

    const totalDebit = (lines ?? []).reduce((acc: number, curr: any) => acc + (Number(curr.debit) || 0), 0);
    const totalCredit = (lines ?? []).reduce((acc: number, curr: any) => acc + (Number(curr.credit) || 0), 0);
    const netBalance = totalDebit - totalCredit;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/accounting/coa" className="flex items-center text-sm text-slate-500 hover:text-blue-600 mb-2 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to COA
                    </Link>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <span className="font-mono text-slate-500 bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-xl">
                            {account.code}
                        </span>
                        {account.name}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {account.type} • General Ledger View
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="flex gap-4">
                    <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 min-w-[160px]">
                        <div className="text-xs text-slate-500 uppercase font-semibold">Net Balance</div>
                        <div className={`text-xl font-bold mt-1 ${netBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-600'}`}>
                            {formatMoney(netBalance)}
                            <span className="text-xs text-slate-400 font-normal ml-1">
                                {netBalance > 0 ? 'Dr' : 'Cr'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 py-2">
                <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="w-4 h-4" /> Date Range
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" /> Filters
                </Button>
            </div>

            {/* Ledger Table */}
            <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-zinc-900/50 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-zinc-800">
                        <tr>
                            <th className="px-6 py-3 text-left">Date</th>
                            <th className="px-6 py-3 text-left">Journal / Ref</th>
                            <th className="px-6 py-3 text-left">Description</th>
                            <th className="px-6 py-3 text-right text-emerald-600">Debit</th>
                            <th className="px-6 py-3 text-right text-red-600">Credit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                        {lines?.map((line: any) => (
                            <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <td className="px-6 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                    {(line as any).journal_entries?.date ? new Date((line as any).journal_entries.date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-6 py-3">
                                    <div className="font-medium text-slate-900 dark:text-white">
                                        {(line as any).journal_entries?.ref || "No Ref"}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {(line as any).journal_entries?.journals?.code}
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                                    {line.description || '-'}
                                </td>
                                <td className="px-6 py-3 text-right font-medium text-slate-700 dark:text-slate-200">
                                    {Number(line.debit) ? formatMoney(Number(line.debit)) : '-'}
                                </td>
                                <td className="px-6 py-3 text-right font-medium text-slate-700 dark:text-slate-200">
                                    {Number(line.credit) ? formatMoney(Number(line.credit)) : '-'}
                                </td>
                            </tr>
                        ))}
                        {/* Empty State */}
                        {(!lines || lines.length === 0) && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-400">
                                    No transactions found for this period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-zinc-900/50 font-bold text-slate-700 dark:text-slate-200 border-t border-slate-200 dark:border-zinc-800">
                        <tr>
                            <td colSpan={3} className="px-6 py-3 text-right">Totals</td>
                            <td className="px-6 py-3 text-right text-emerald-700">{formatMoney(totalDebit)}</td>
                            <td className="px-6 py-3 text-right text-red-700">{formatMoney(totalCredit)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    )

}
