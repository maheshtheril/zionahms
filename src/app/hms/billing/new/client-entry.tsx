'use client';

import dynamic from 'next/dynamic';

/**
 * [ISOMORPHIC-SAFETY]
 * This client-side entry point isolates the heavy billing terminal from SSR,
 * conforming to Next.js 15+ Server Component requirements.
 */
const DynamicEditor = dynamic(
    () => import("@/components/billing/invoice-editor-compact").then(mod => mod.CompactInvoiceEditor),
    { 
        ssr: false,
        loading: () => (
            <div className="h-screen bg-slate-950 flex flex-col items-center justify-center font-mono text-indigo-400 gap-6">
                <div className="relative h-1 w-64 bg-slate-800 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-500 animate-pulse"></div>
                </div>
                <p className="uppercase tracking-[0.3em] text-[10px] font-black animate-pulse">Initializing Terminal Architecture...</p>
            </div>
        )
    }
);

import { AccountingWarningBanner } from "@/components/accounting/accounting-warning-banner";

export default function BillingClientEntry(props: any) {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <div className="shrink-0 z-50">
                <AccountingWarningBanner />
            </div>
            <div className="flex-1 overflow-hidden">
                <DynamicEditor {...props} />
            </div>
        </div>
    );
}
