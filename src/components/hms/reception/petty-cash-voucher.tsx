'use client'

import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { useLocalization } from "@/contexts/localization-context";

interface PettyCashVoucherProps {
    payment: any
    onClose: () => void
}

function numberToWords(amount: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (amount === 0) return 'Zero';

    function convert(n: number): string {
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
        return n.toString();
    }

    return convert(Math.floor(amount)) + (amount % 1 !== 0 ? ' Point ' + convert(Math.round((amount % 1) * 100)) : '') + ' Only';
}

export function PettyCashVoucher({ payment, onClose }: PettyCashVoucherProps) {
    const { currencySymbol } = useLocalization();
    const handlePrint = () => {
        window.print();
    };

    // Helper to safely get fields
    const getPayee = () => {
        if (payment.payee_name) return payment.payee_name;
        if (payment.payeeName) return payment.payeeName;
        if (payment.partner_name) return payment.partner_name;
        if (payment.metadata?.payee_name) return payment.metadata.payee_name;
        return "Bearer";
    };

    const getDate = () => {
        if (payment.date) return new Date(payment.date);
        if (payment.payment_date) return new Date(payment.payment_date);
        if (payment.created_at) return new Date(payment.created_at);
        if (payment.metadata?.date) return new Date(payment.metadata.date);
        return new Date();
    };

    const getMemo = () => {
        if (payment.memo) return payment.memo;
        if (payment.description) return payment.description;
        if (payment.metadata?.memo) return payment.metadata.memo;
        if (payment.metadata?.description) return payment.metadata.description;
        return "Petty Cash Expense";
    };

    const getCategory = () => {
        if (payment.metadata?.category_name) return payment.metadata.category_name;
        if (payment.payment_lines?.[0]?.metadata?.account_name) return payment.payment_lines[0].metadata.account_name;
        return "General Expense";
    };

    return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
            <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #printable-voucher, #printable-voucher * {
                            visibility: visible;
                        }
                        #printable-voucher {
                            position: fixed;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: 100%;
                            z-index: 9999;
                            background: white;
                            padding: 20px;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}</style>

            <div id="printable-voucher" className="w-[800px] border-2 border-slate-800 p-8 bg-white text-slate-900 mx-auto shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-wider text-slate-900 uppercase">Petty Cash Voucher</h1>
                        <p className="text-sm font-medium mt-1 text-slate-600">Official Payment Receipt</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                            <span className="font-bold text-slate-600 uppercase text-xs">Voucher No:</span>
                            <span className="font-mono font-bold text-lg">{payment.payment_number || 'PENDING'}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                            <span className="font-bold text-slate-600 uppercase text-xs">Date:</span>
                            <span className="font-medium">{format(getDate(), 'dd MMM, yyyy')}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                    <div className="flex gap-4 items-end">
                        <span className="font-bold text-slate-700 w-24 uppercase text-sm pb-1">Paid To:</span>
                        <div className="flex-1 border-b border-slate-400 border-dashed pb-1 font-medium text-lg px-2 text-slate-900">
                            {getPayee()}
                        </div>
                    </div>

                    <div className="flex gap-4 items-end">
                        <span className="font-bold text-slate-700 w-24 uppercase text-sm pb-1">The Sum of:</span>
                        <div className="flex-1 border-b border-slate-400 border-dashed pb-1 font-medium text-lg px-2 capitalize italic text-slate-900">
                            {numberToWords(Number(payment.amount))}
                        </div>
                    </div>

                    <div className="flex gap-4 items-end">
                        <span className="font-bold text-slate-700 w-24 uppercase text-sm pb-1">On A/C of:</span>
                        <div className="flex-1 border-b border-slate-400 border-dashed pb-1 font-medium text-lg px-2 text-slate-900">
                            {getMemo()}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mt-4">
                        <div className="border border-slate-300 rounded p-4 bg-slate-50">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Expense Category</p>
                            <p className="font-medium text-slate-900 capitalize">
                                {getCategory()}
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-4 bg-slate-100 rounded border border-slate-200">
                            <span className="font-bold text-slate-600 uppercase">Total Amount</span>
                            <span className="text-2xl font-bold font-mono text-slate-900">
                                {currencySymbol}{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer / Signatures */}
                <div className="grid grid-cols-3 gap-8 mt-16 pt-8">
                    <div className="text-center">
                        <div className="border-t border-slate-400 w-3/4 mx-auto mb-2"></div>
                        <p className="text-xs font-bold uppercase text-slate-500">Prepared By</p>
                    </div>
                    <div className="text-center">
                        <div className="border-t border-slate-400 w-3/4 mx-auto mb-2"></div>
                        <p className="text-xs font-bold uppercase text-slate-500">Authorised By</p>
                    </div>
                    <div className="text-center">
                        <div className="border-t-2 border-slate-800 w-3/4 mx-auto mb-2"></div>
                        <p className="text-sm font-extrabold uppercase text-slate-900">Receiver's Signature</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mt-8 no-print slide-in-from-bottom-5 animate-in">
                <Button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white min-w-[150px] shadow-lg">
                    <Printer className="mr-2 h-4 w-4" /> Print Voucher
                </Button>
                <Button variant="outline" onClick={onClose} className="min-w-[100px]">
                    Close
                </Button>
            </div>
        </div>
    )
}
