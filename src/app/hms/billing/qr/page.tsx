'use client'

import { useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Zap, Clock, ShieldCheck } from 'lucide-react'
import { Suspense } from 'react'
import { useLocalization } from "@/contexts/localization-context";

function CustomerDisplayContent() {
    const { currencySymbol } = useLocalization();
    const searchParams = useSearchParams()
    const qrUrl = searchParams.get('url')
    const amount = searchParams.get('amount')
    const businessName = searchParams.get('bn') || 'Our Facility'

    if (!qrUrl) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Zap className="h-8 w-8 text-slate-700" />
                </div>
                <h1 className="text-2xl font-black text-slate-500 uppercase tracking-widest">Waiting for Payment Request</h1>
                <p className="text-slate-700 mt-4 max-w-xs text-sm">Please keep this window open on the patient facing monitor.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-12 overflow-hidden relative">
            {/* Background Aesthetics */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/10 blur-[150px] rounded-full -ml-64 -mb-64" />

            <div className="z-10 w-full max-w-lg">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-3 bg-indigo-600 text-white px-5 py-2 rounded-full mb-8 shadow-xl shadow-indigo-600/20">
                        <Zap className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Secure Dynamic Payment</span>
                    </div>
                    <h1 className="text-6xl font-black text-white italic tracking-tighter mb-4 uppercase">Scan to Pay</h1>
                    <p className="text-slate-400 text-lg font-medium opacity-80 uppercase tracking-widest leading-none">To: {businessName}</p>
                </div>

                <div className="bg-white p-12 rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-col items-center mb-12 scale-110 lg:scale-125 transition-transform">
                    <div className="p-4 bg-slate-50 rounded-[2.5rem] border-8 border-slate-100 mb-8">
                        <QRCodeSVG value={qrUrl} size={280} level="H" />
                    </div>
                    <div className="text-center">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 leading-none">Exact Amount Required</p>
                        <h2 className="text-6xl font-black text-slate-900 tracking-tighter italic">{currencySymbol}{Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4">
                        <div className="bg-emerald-500/20 p-3 rounded-2xl">
                            <ShieldCheck className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verified</p>
                            <p className="text-sm font-bold text-white uppercase tracking-tight">SSL Secured</p>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-4">
                        <div className="bg-indigo-500/20 p-3 rounded-2xl">
                            <Clock className="h-6 w-6 text-indigo-500 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Status</p>
                            <p className="text-sm font-bold text-white uppercase tracking-tight">Waiting...</p>
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em]">Institutional Payment Node | Professional Suite</p>
                </div>
            </div>
        </div>
    )
}

export default function CustomerDisplayPage() {
    const { currencySymbol } = useLocalization();
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Zap className="h-10 w-10 text-indigo-600 animate-pulse" /></div>}>
            <CustomerDisplayContent />
        </Suspense>
    )
}
