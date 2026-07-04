'use client'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getLabOrderForReporting } from "@/app/actions/lab"
import { getCompanyDetails } from "@/app/actions/purchase" // Using existing action for company info
import { 
    Printer, ArrowLeft, Loader2, FlaskConical,
    Activity, Clock, User, Phone, MapPin, Globe, Mail
} from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LabReportPrintPage() {
    const { id } = useParams()
    const router = useRouter()
    const [order, setOrder] = useState<any>(null)
    const [company, setCompany] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const [orderRes, companyDetails] = await Promise.all([
                getLabOrderForReporting(id as string),
                getCompanyDetails()
            ])
            
            if (orderRes.success && orderRes.data) {
                setOrder(orderRes.data)
            }
            if (companyDetails) {
                setCompany(companyDetails)
            }
            setLoading(false)
        }
        loadData()
    }, [id])

    const pdfSrc = `/api/print/lab_report/${id}`;

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="font-bold text-xl animate-pulse tracking-wide">Compiling Diagnostics Report...</p>
        </div>
    )

    if (!order) return <div>Order not found</div>

    const patientAge = order.hms_patient?.dob ? 
        new Date().getFullYear() - new Date(order.hms_patient.dob).getFullYear() : 
        '—';

    const handlePrint = () => {
        if (pdfSrc) {
            window.open(pdfSrc, '_blank');
        } else {
            window.print();
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col selection:bg-indigo-500/30">
            {/* Header / Actions */}
            <div className="w-full bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center shadow-xl z-10">
                <div className="flex gap-4">
                    <Link href="/hms/lab/pending">
                        <Button variant="ghost" className="rounded-2xl gap-2 font-bold px-6 bg-slate-800 hover:bg-slate-700 text-slate-200">
                            <ArrowLeft className="w-4 h-4" />
                            Back to queue
                        </Button>
                    </Link>
                </div>
                
                <div className="flex gap-4">
                    {pdfSrc ? (
                        <a href={pdfSrc} target="_blank" rel="noopener noreferrer">
                            <Button 
                                className="bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 text-white rounded-2xl px-10 font-black gap-2 transition-all"
                            >
                                <Printer className="w-5 h-5" />
                                Print / Download Report
                            </Button>
                        </a>
                    ) : (
                        <Button 
                            disabled
                            className="bg-indigo-600 shadow-xl shadow-indigo-600/20 text-white rounded-2xl px-10 font-black gap-2 transition-all"
                        >
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating PDF...
                        </Button>
                    )}
                </div>
            </div>

            {/* PDF Viewer Area */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
                <iframe 
                    src={pdfSrc} 
                    className="w-full max-w-[1000px] h-[85vh] bg-white rounded-xl shadow-2xl border-4 border-slate-800"
                    title="Lab Report PDF Preview"
                />
            </div>
        </div>
    )
}
