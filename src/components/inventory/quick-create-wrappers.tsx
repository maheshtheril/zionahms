'use client'

import { useActionState } from "react"
import { createCategory, createManufacturer, createUOM, createLocation } from "@/app/actions/inventory"
import { useEffect } from "react"

const initialState = {
    error: ""
}

export function QuickCategoryForm({ onSuccess }: { onSuccess: () => void }) {
    const [state, action, isPending] = useActionState(createCategory, initialState)

    useEffect(() => {
        if (state && !('error' in state)) {
            onSuccess();
        }
    }, [state, onSuccess]);

    return (
        <form action={action} className="space-y-4">
            {state && 'error' in state && state.error && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{state.error}</div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input name="name" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" />
            </div>
            {/* Simplified for quick create - typically we might want tax rate too but keep it simple for modal */}
            <input type="hidden" name="taxRateId" value="" />

            <button type="submit" disabled={isPending} className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
                {isPending ? 'Creating...' : 'Create Category'}
            </button>
        </form>
    )
}

export function QuickManufacturerForm({ onSuccess }: { onSuccess: () => void }) {
    const [state, action, isPending] = useActionState(createManufacturer, initialState)

    useEffect(() => {
        if (state && !('error' in state)) {
            onSuccess();
        }
    }, [state, onSuccess]);

    return (
        <form action={action} className="space-y-4">
            {state && 'error' in state && state.error && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{state.error}</div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer Name</label>
                <input name="name" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" />
            </div>
            <button type="submit" disabled={isPending} className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
                {isPending ? 'Creating...' : 'Create Manufacturer'}
            </button>
        </form>
    )
}

export function QuickLocationForm({ onSuccess }: { onSuccess: () => void }) {
    const [state, action, isPending] = useActionState(createLocation, initialState)

    useEffect(() => {
        if (state && !('error' in state)) {
            onSuccess();
        }
    }, [state, onSuccess]);

    return (
        <form action={action} className="space-y-4">
            {state && 'error' in state && state.error && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{state.error}</div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Store / Godown Name <span className="text-red-500">*</span></label>
                <input name="name" required placeholder="e.g. ICU Pharmacy, Central Medical Store" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Code</label>
                <input name="code" placeholder="e.g. ICU-PHARM, CMS-02" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none uppercase text-sm font-mono" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Type</label>
                <select name="type" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white">
                    <option value="internal">Internal Warehouse / Godown</option>
                    <option value="dispensary">Dispensing Counter</option>
                    <option value="emergency">Emergency / Crash Cart</option>
                    <option value="transit">Transit / Transfer</option>
                    <option value="scrap">Scrap / Quarantine</option>
                </select>
            </div>
            <button type="submit" disabled={isPending} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 font-bold text-sm shadow-sm flex items-center justify-center gap-2">
                {isPending ? 'Saving Store Master...' : 'Save Store to Master'}
            </button>
        </form>
    )
}
