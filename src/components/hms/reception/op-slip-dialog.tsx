'use client'

import React from "react"
import { Button } from "@/components/ui/button"
import { Printer, Eye } from "lucide-react"
import { toast } from "sonner"

interface OpSlipDialogProps {
    appointment: any
    trigger?: React.ReactNode
    hospitalInfo?: any
    initialTab?: 'voucher' | 'invoice'
    directPrint?: boolean
    defaultPrintMode?: 'standard' | 'label'
}

function safeOpen(url: string) {
    try {
        const win = window.open(url, '_blank')
        if (!win || win.closed || typeof win.closed === 'undefined') {
            const a = document.createElement('a')
            a.href = url
            a.target = '_blank'
            a.rel = 'noopener,noreferrer'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        }
    } catch {
        window.location.href = url
    }
}

/**
 * CLINICAL PRINT WRAPPER
 * Printer Icon = Direct OS print dialog (raw PDF, autoPrint embedded by jsPDF)
 * Eye Icon     = Full preview page
 */
export function OpSlipDialog({
    appointment: initialApt,
    trigger,
    initialTab = 'voucher',
    directPrint = false,
    defaultPrintMode = 'standard'
}: OpSlipDialogProps) {

    const actualApt = initialApt?.appointment || initialApt
    const isInvoice = initialTab === 'invoice'
    const docType = isInvoice ? 'sale_bill' : 'appointment'
    const docId = isInvoice
        ? (actualApt?.invoice_id || actualApt?.hms_invoice?.[0]?.id || actualApt?.invoices?.[0]?.id || actualApt?.id)
        : actualApt?.id

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!docId || docId === 'null' || docId === 'undefined') {
            toast.error("Cannot Print", { description: "Missing appointment or invoice ID." })
            return
        }

        if (directPrint) {
            safeOpen(`/api/print/${docType}/${docId}?autoPrint=true`)
        } else {
            const searchParams = new URLSearchParams({ type: docType, mode: defaultPrintMode || 'standard' })
            safeOpen(`/hms/billing/${docId}/print?${searchParams.toString()}`)
        }
    }

    if (trigger && React.isValidElement(trigger)) {
        return React.cloneElement(trigger as React.ReactElement<any>, {
            onClick: handleClick,
        })
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className={`h-8 w-8 ${directPrint ? 'text-indigo-500 hover:bg-indigo-50' : 'text-slate-400 hover:bg-slate-100'}`}
            title={directPrint ? "Print (OS Dialog)" : "Preview"}
        >
            {directPrint ? <Printer className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
    )
}
