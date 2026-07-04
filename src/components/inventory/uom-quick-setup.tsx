'use client'

import { useState } from 'react'
import { seedPharmacyUOMs } from '@/app/actions/uom'
import { useLocalization } from "@/contexts/localization-context";

export function UOMQuickSetup() {
    const { currencySymbol } = useLocalization();
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const handleSeedUOMs = async () => {
        setLoading(true)
        setMessage('')

        try {
            const result = (await seedPharmacyUOMs()) as any
            if (result.success) {
                setMessage('✅ Default UOMs created successfully!')
            } else {
                setMessage(`❌ ${result.error || result.message}`)
            }
        } catch (error) {
            setMessage('❌ Failed to seed UOMs')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">UOM Quick Setup</h2>

            <div className="space-y-4">
                <div>
                    <h3 className="font-medium mb-2">Step 1: Initialize Default UOMs</h3>
                    <p className="text-sm text-gray-600 mb-3">
                        This will create common UOMs for pharmaceutical products:
                    </p>
                    <ul className="text-sm text-gray-600 mb-4 list-disc list-inside">
                        <li><strong>Count:</strong> Unit, Strip, Box</li>
                        <li><strong>Weight:</strong> mg, g, kg</li>
                        <li><strong>Volume:</strong> ml, Bottle, Liter</li>
                    </ul>
                    <button
                        onClick={handleSeedUOMs}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Setting up...' : 'Initialize UOMs'}
                    </button>
                    {message && (
                        <p className={`mt-2 text-sm ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                            {message}
                        </p>
                    )}
                </div>

                <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Step 2: Configure Product UOMs</h3>
                    <p className="text-sm text-gray-600 mb-3">
                        After initializing, configure specific products:
                    </p>
                    <div className="bg-gray-50 p-4 rounded text-sm">
                        <p className="font-medium mb-2">Example: Paracetamol 500mg</p>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                            <li>Base UOM: <code>Unit</code> (individual tablet)</li>
                            <li>Purchase UOM: <code>Strip</code> (15 tablets)</li>
                            <li>Conversion: 1 Strip = 15 Units</li>
                            <li>Purchase Price: ${currencySymbol}30/strip</li>
                            <li>Sale Price (Strip): ${currencySymbol}45/strip</li>
                            <li>Sale Price (Unit): ${currencySymbol}3/tablet</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Step 3: Use in Purchase & Sales</h3>
                    <div className="text-sm text-gray-600 space-y-2">
                        <p><strong>In Purchase Entry:</strong></p>
                        <ul className="list-disc list-inside ml-4">
                            <li>Select purchase UOM (e.g., Strip)</li>
                            <li>Enter quantity in strips</li>
                            <li>Enter price per strip</li>
                            <li>System calculates unit price automatically</li>
                        </ul>
                        <p className="mt-3"><strong>In Sales Billing:</strong></p>
                        <ul className="list-disc list-inside ml-4">
                            <li>Select product</li>
                            <li>Choose UOM (Strip or Unit)</li>
                            <li>Price adjusts automatically</li>
                            <li>Inventory reduces in base UOM</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
