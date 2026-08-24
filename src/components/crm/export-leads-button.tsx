'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { exportLeadsAction } from '@/app/actions/crm/export-leads'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export function ExportLeadsButton() {
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)

    const handleExport = async () => {
        setIsLoading(true)
        try {
            // Convert URLSearchParams to object
            const params: any = {}
            searchParams.forEach((value, key) => {
                params[key] = value
            })

            const result = await exportLeadsAction(params)

            if (result.success && result.data && result.data.length > 0) {
                // Convert JSON to CSV
                const headers = Object.keys(result.data[0])
                const csvContent = [
                    headers.join(','),
                    ...result.data.map((row: any) =>
                        headers.map(fieldName => {
                            const val = row[fieldName] || ''
                            return `"${String(val).replace(/"/g, '""')}"`
                        }).join(',')
                    )
                ].join('\n')

                // Create download link
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.setAttribute('href', url)
                link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`)
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                toast.success("Export Successful", { description: `Exported ${result.data.length} leads to CSV.` })
            } else if (result.success && result.data?.length === 0) {
                toast.success("Export Empty", { description: "No leads found to export." })
            } else {
                console.error("Export failed:", result.error)
                toast.error("Export Failed", { description: result.error || "Unknown error occurred." })
            }
        } catch (error) {
            console.error("Export error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleExport}
            disabled={isLoading}
            variant="outline"
            className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
            <Download className={`w-4 h-4 mr-2 ${isLoading ? 'animate-bounce' : ''}`} />
            {isLoading ? 'Exporting...' : 'Export CSV'}
        </Button>
    )
}
