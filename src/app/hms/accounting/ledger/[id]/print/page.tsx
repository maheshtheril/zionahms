import { getAccountLedger } from "@/app/actions/accounting/reports";
import { getCurrentCompany } from "@/app/actions/company";
import { format } from "date-fns";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function GeneralLedgerPrintPage(props: { params: Promise<any> }) {
    const params = await props.params;
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const { id } = await params;
    const companyRes = await getCurrentCompany();
    const ledgerRes = await getAccountLedger(id);

    if (!companyRes || !ledgerRes.success) {
        return <div className="p-10 font-bold text-red-500">Failed to load ledger data.</div>;
    }

    const company = companyRes;
    const accountInfo = ledgerRes.account;
    const entries = ledgerRes.lines || [];
    const openingBalance = ledgerRes.openingBalance || 0;

    let currentBalance = openingBalance;
    const ledgerWithBalance = entries.map((entry: any) => {
        const debit = Number(entry.debit || 0);
        const credit = Number(entry.credit || 0);
        
        const type = accountInfo?.type || 'Asset';
        const isNaturalDebit = ['Asset', 'Expense'].includes(type);
        
        if (isNaturalDebit) {
            currentBalance += (debit - credit);
        } else {
            currentBalance += (credit - debit);
        }
        
        return { ...entry, runningBalance: currentBalance };
    });

    const totalDebit = entries.reduce((sum: number, e: any) => sum + Number(e.debit || 0), 0);
    const totalCredit = entries.reduce((sum: number, e: any) => sum + Number(e.credit || 0), 0);

    const formatCurrency = (val: number) => {
        return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="bg-white min-h-screen text-black font-sans p-8 print:p-0 max-w-5xl mx-auto">
            {/* --- HEADER --- */}
            <div className="border-b-2 border-black pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">{company.name || company.metadata?.hospital_name || 'Hospital Name'}</h1>
                        <p className="text-sm mt-1 max-w-sm">{company.address || company.metadata?.address || ''}</p>
                        <p className="text-sm mt-1">Phone: {company.phone || company.metadata?.phone || company.metadata?.mobile || 'N/A'}</p>
                        <p className="text-sm">Email: {company.email || company.metadata?.email || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-black uppercase tracking-widest text-slate-800">General Ledger</h2>
                        <p className="text-sm font-bold mt-2">Date Printed: {format(new Date(), 'dd-MMM-yyyy HH:mm')}</p>
                    </div>
                </div>
            </div>

            {/* --- ACCOUNT INFO & SUMMARY --- */}
            <div className="flex justify-between items-start mb-8 border border-slate-300 rounded-lg p-4 bg-slate-50 print:bg-transparent">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Account Particulars</p>
                    <h3 className="text-xl font-black uppercase mt-1">{accountInfo?.name}</h3>
                    <p className="text-sm font-bold text-slate-700">Code: {accountInfo?.code} | Type: {accountInfo?.type}</p>
                </div>
                <div className="text-right grid grid-cols-2 gap-x-8 gap-y-2">
                    <p className="text-xs font-bold uppercase text-slate-500">Opening Balance:</p>
                    <p className="text-sm font-black">{formatCurrency(openingBalance)}</p>
                    
                    <p className="text-xs font-bold uppercase text-slate-500">Total Debit:</p>
                    <p className="text-sm font-black text-slate-700">{formatCurrency(totalDebit)}</p>
                    
                    <p className="text-xs font-bold uppercase text-slate-500">Total Credit:</p>
                    <p className="text-sm font-black text-slate-700">{formatCurrency(totalCredit)}</p>
                    
                    <p className="text-xs font-bold uppercase text-slate-800 border-t border-slate-300 pt-1 mt-1">Closing Balance:</p>
                    <p className="text-sm font-black border-t border-slate-300 pt-1 mt-1">{formatCurrency(Math.abs(currentBalance))} {currentBalance >= 0 ? 'Dr' : 'Cr'}</p>
                </div>
            </div>

            {/* --- LEDGER TABLE --- */}
            <table className="w-full text-left text-sm border-collapse">
                <thead>
                    <tr className="border-y-2 border-black">
                        <th className="py-3 px-2 font-black uppercase text-xs">Date</th>
                        <th className="py-3 px-2 font-black uppercase text-xs">Voucher</th>
                        <th className="py-3 px-2 font-black uppercase text-xs">Particulars</th>
                        <th className="py-3 px-2 font-black uppercase text-xs text-right">Debit</th>
                        <th className="py-3 px-2 font-black uppercase text-xs text-right">Credit</th>
                        <th className="py-3 px-2 font-black uppercase text-xs text-right">Balance</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {/* Opening Balance Row */}
                    <tr>
                        <td className="py-2 px-2 font-medium">--</td>
                        <td className="py-2 px-2">--</td>
                        <td className="py-2 px-2 font-bold italic">Opening Balance B/F</td>
                        <td className="py-2 px-2 text-right"></td>
                        <td className="py-2 px-2 text-right"></td>
                        <td className="py-2 px-2 text-right font-black">{formatCurrency(Math.abs(openingBalance))} {openingBalance >= 0 ? 'Dr' : 'Cr'}</td>
                    </tr>
                    
                    {ledgerWithBalance.map((entry: any) => (
                        <tr key={entry.id} className="break-inside-avoid">
                            <td className="py-2 px-2">
                                {entry.journal_entries?.date ? format(new Date(entry.journal_entries.date), 'dd-MM-yyyy') : 'N/A'}
                            </td>
                            <td className="py-2 px-2">
                                <span className="font-bold">{entry.journal_entries?.ref || 'AUTO'}</span>
                            </td>
                            <td className="py-2 px-2">
                                <span className="font-medium">{entry.description || 'Institutional Posting'}</span>
                                {entry.partner_name && (
                                    <span className="block text-xs font-bold text-slate-600">[{entry.partner_name}]</span>
                                )}
                            </td>
                            <td className="py-2 px-2 text-right">
                                {Number(entry.debit) > 0 ? formatCurrency(Number(entry.debit)) : '-'}
                            </td>
                            <td className="py-2 px-2 text-right">
                                {Number(entry.credit) > 0 ? formatCurrency(Number(entry.credit)) : '-'}
                            </td>
                            <td className="py-2 px-2 text-right font-bold">
                                {formatCurrency(Math.abs(entry.runningBalance))} <span className="text-xs opacity-70">{entry.runningBalance >= 0 ? 'Dr' : 'Cr'}</span>
                            </td>
                        </tr>
                    ))}

                    {ledgerWithBalance.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-8 text-center italic text-slate-500">No transactions found for this ledger.</td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr className="border-y-2 border-black font-black">
                        <td colSpan={3} className="py-3 px-2 text-right uppercase tracking-widest text-xs">Total Transacted:</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(totalDebit)}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(totalCredit)}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(Math.abs(currentBalance))} {currentBalance >= 0 ? 'Dr' : 'Cr'}</td>
                    </tr>
                </tfoot>
            </table>

            {/* --- FOOTER --- */}
            <div className="mt-16 pt-8 border-t border-slate-300 flex justify-between text-xs text-slate-500 font-bold uppercase tracking-widest break-inside-avoid">
                <div className="text-center">
                    <p className="border-t border-slate-400 w-48 pt-2 mx-auto">Prepared By</p>
                </div>
                <div className="text-center">
                    <p className="border-t border-slate-400 w-48 pt-2 mx-auto">Authorized Signatory</p>
                </div>
            </div>

            {/* Auto Print Script */}
            <script dangerouslySetInnerHTML={{ __html: `window.onload = function() { setTimeout(() => window.print(), 500); }` }} />
        </div>
    );
}
