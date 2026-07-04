'use client'

import { useState } from 'react'
import { generateMonthlyPayslip, setStaffSalary } from '@/app/actions/payroll'
import { FileText, Loader2, DollarSign } from 'lucide-react'

export function PayrollActions({ userId, monthYear, currentSalary }: { userId: string, monthYear: string, currentSalary?: number }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSetting, setIsSetting] = useState(false)
    const [baseSalary, setBaseSalary] = useState(currentSalary?.toString() || '')

    async function handleGenerate() {
        if (!currentSalary) {
            alert("Please set a base salary first.")
            return
        }
        setIsLoading(true)
        try {
            const res = await generateMonthlyPayslip(userId, monthYear)
            if (res?.error) alert(res.error)
        } catch (error) {
            console.error(error)
            alert("Failed to generate payslip")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSetSalary() {
        setIsSetting(true)
        try {
            const res = await setStaffSalary(userId, Number(baseSalary))
            if (res?.error) alert(res.error)
            else alert("Salary updated successfully")
        } catch (error) {
            console.error(error)
        } finally {
            setIsSetting(false)
        }
    }

    return (
        <div className="flex items-center justify-end gap-4">
            <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    value={baseSalary} 
                    onChange={e => setBaseSalary(e.target.value)} 
                    placeholder="Base Salary" 
                    className="w-32 bg-background border border-border rounded-lg px-3 py-1.5 text-sm"
                />
                <button 
                    onClick={handleSetSalary}
                    disabled={isSetting}
                    className="p-1.5 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Set Base Salary"
                >
                    {isSetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                </button>
            </div>
            <button 
                onClick={handleGenerate}
                disabled={isLoading || !currentSalary}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate Slip
            </button>
        </div>
    )
}
