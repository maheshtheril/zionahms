'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { generateAttendancePDF } from '@/app/actions/attendance-pdf'
import { toast } from 'sonner'

export function ExportAttendancePDF() {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        setLoading(true)
        try {
            const buffer = await generateAttendancePDF() as Buffer
            const blob = new Blob([buffer as any], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Workforce_Audit_${new Date().getTime()}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success("Report Generated", { description: "The Workforce Performance Audit has been downloaded." })
        } catch (error) {
            console.error("PDF Export failed:", error)
            toast.error("Export Failed", { description: "The system could not synchronize the PDF stream." })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleExport}
            disabled={loading}
            variant="outline"
            className="h-14 bg-white/5 border-white/10 text-white rounded-2xl px-6 font-black text-xs tracking-widest hover:bg-white/10"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
                <Download className="h-4 w-4 mr-2" />
            )}
            {loading ? 'PROCESSING...' : 'EXPORT PERFORMANCE AUDIT'}
        </Button>
    )
}
