'use client'

import { useActionState } from "react"
import { createLocation } from "@/app/actions/inventory"
import { Plus } from "lucide-react"

const initialState = {
    error: ""
}

export function CreateLocationForm() {
    const [state, action, isPending] = useActionState(createLocation, initialState)

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit sticky top-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Godown / Store Location
            </h2>
            <form action={action} className="space-y-4">
                {state && 'error' in state && state.error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                        {state.error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store / Godown Name <span className="text-red-500">*</span></label>
                    <input
                        name="name"
                        required
                        placeholder="e.g. Pharmacy Main Store, Central Medical Store"
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store Code</label>
                    <input
                        name="code"
                        placeholder="e.g. PHARM-01, CMS-01"
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all uppercase font-mono"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Store / Location Type</label>
                    <select
                        name="type"
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
                    >
                        <option value="internal">Internal Warehouse / Godown</option>
                        <option value="dispensary">Pharmacy Dispensary / Counter</option>
                        <option value="emergency">Emergency / Crash Cart</option>
                        <option value="transit">Transit / Transfer Location</option>
                        <option value="supplier">Vendor Location</option>
                        <option value="customer">Customer Location</option>
                        <option value="scrap">Scrap / Quarantine</option>
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    {isPending ? (
                        <>Saving Location...</>
                    ) : (
                        <>
                            <Plus className="h-4 w-4" />
                            Add Store to Master
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}
