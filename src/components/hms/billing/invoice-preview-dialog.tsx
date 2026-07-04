'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, User, Receipt, Download, Printer, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useLocalization } from "@/contexts/localization-context";

interface InvoicePreviewDialogProps {
    invoice: any
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function InvoicePreviewDialog({ invoice, trigger, open, onOpenChange }: InvoicePreviewDialogProps) {
    const { currencySymbol } = useLocalization();
    if (!invoice) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                <div className="sticky top-0 bg-white z-10 p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Receipt className="h-5 w-5 text-indigo-600" />
                            Invoice #{invoice.invoice_number || invoice.invoice_no}
                        </DialogTitle>
                        <p className="text-sm text-slate-500 mt-1">
                            {new Date(invoice.created_at).toLocaleDateString()} • <span className="capitalize">{invoice.status}</span>
                        </p>
                    </div>
                    <Link href={`/hms/billing/${invoice.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                            View Full Page <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <div className="p-6 space-y-8 bg-slate-50/50 min-h-[50vh]">
                    {/* Status Banner */}
                    <div className={`p-4 rounded-xl flex items-center justify-between ${invoice.status === 'paid' ? 'bg-green-50 text-green-700 border border-green-100' :
                        invoice.status === 'posted' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            'bg-slate-50 text-slate-700 border border-slate-200'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className={`h-2.5 w-2.5 rounded-full ring-4 ring-white ${invoice.status === 'paid' ? 'bg-green-500' :
                                invoice.status === 'posted' ? 'bg-blue-500' : 'bg-slate-500'
                                }`} />
                            <span className="font-bold capitalize">{invoice.status}</span>
                        </div>
                        <div className="font-mono font-bold text-lg">
                            Balance: {currencySymbol}{Number(invoice.outstanding_amount || 0).toFixed(2)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Bill To */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User className="h-3 w-3" /> Bill To
                            </h3>
                            {invoice.hms_patient ? (
                                <div>
                                    <div className="font-bold text-slate-900 text-lg">
                                        {invoice.hms_patient.first_name} {invoice.hms_patient.last_name}
                                    </div>
                                    <div className="text-slate-500 font-mono text-sm mt-1">{invoice.hms_patient.patient_number}</div>
                                </div>
                            ) : (
                                <div className="text-slate-400 italic">Guest Patient</div>
                            )}
                        </div>

                        {/* Invoice Meta */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Details
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Issued</span>
                                    <span className="font-bold text-slate-700">{invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 font-medium">Due</span>
                                    <span className="font-bold text-slate-700">{invoice.due_at ? new Date(invoice.due_at).toLocaleDateString() : '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-slate-500">Item</th>
                                    <th className="px-6 py-3 font-semibold text-slate-500 text-right">Qty</th>
                                    <th className="px-6 py-3 font-semibold text-slate-500 text-right">Price</th>
                                    <th className="px-6 py-3 font-semibold text-slate-500 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoice.hms_invoice_lines?.map((line: any) => (
                                    <tr key={line.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{line.hms_product?.name || line.description || 'Item'}</div>
                                            {line.description && line.description !== 'Auto-created from invoice scan' && line.description !== line.hms_product?.name && (
                                                <div className="text-xs text-slate-500 mt-0.5">{line.description.substring(0, 50)}{line.description.length > 50 ? '...' : ''}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-600 font-medium">{Number(line.quantity)}</td>
                                        <td className="px-6 py-4 text-right text-slate-600">{currencySymbol}{Number(line.unit_price).toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">{currencySymbol}{Number(line.net_amount).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50/80 border-t border-slate-200">
                                <tr>
                                    <td colSpan={3} className="px-6 py-3 text-right font-medium text-slate-500">Subtotal</td>
                                    <td className="px-6 py-3 text-right font-bold text-slate-900">{currencySymbol}{Number(invoice.subtotal).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="px-6 py-3 text-right font-medium text-slate-500">Tax</td>
                                    <td className="px-6 py-3 text-right font-bold text-slate-900">{currencySymbol}{Number(invoice.total_tax).toFixed(2)}</td>
                                </tr>
                                <tr className="bg-slate-100 border-t border-slate-200/50">
                                    <td colSpan={3} className="px-6 py-4 text-right font-black text-slate-900 text-lg">Total</td>
                                    <td className="px-6 py-4 text-right font-black text-indigo-600 text-lg">{currencySymbol}{Number(invoice.total).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
