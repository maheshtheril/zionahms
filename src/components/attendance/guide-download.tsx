'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { generateGuidePDF } from '@/app/actions/guide-pdf'
import { toast } from 'sonner'

export function DownloadGuidePDF() {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        setLoading(true)
        try {
            const buffer = await generateGuidePDF() as Buffer
            const blob = new Blob([buffer as any], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `HMS_Staff_Systems_Guide.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success("Guide Generated", { description: "The Tactical Systems Guide has been downloaded." })
        } catch (error) {
            console.error("Guide generation failed:", error)
            toast.error("Download Failed", { description: "The system could not synchronize the documentation stream." })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleDownload}
            disabled={loading}
            className="group relative flex items-center gap-3 px-6 h-12 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl transition-all duration-300"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            ) : (
                <FileText className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            )}
            <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">System Docs</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Download Manual</p>
            </div>
        </Button>
    )
}
