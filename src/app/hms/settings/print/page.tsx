import { getPrintTemplates } from "@/app/actions/print-settings"
import { PrintSettingsClient } from "./print-settings-client"
import { Printer } from "lucide-react"

export default async function PrintSettingsPage() {
    const res = await getPrintTemplates();
    const templates = res.success ? res.data : { sale_bill: [], pos_bill: [] };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <Printer className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    Print & Billing Configuration
                </h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                    Manage active print templates for different ERP modules
                </p>
            </div>

            <PrintSettingsClient templates={templates} />
        </div>
    )
}
