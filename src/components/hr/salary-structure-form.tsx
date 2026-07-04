"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { setStaffSalary } from "@/app/actions/payroll"
import { Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react"
import { useLocalization } from "@/contexts/localization-context";

interface SalaryFormProps {
    userId: string;
    userName: string;
    initialData?: {
        baseSalary: number;
        allowances: Record<string, number>;
        deductions: Record<string, number>;
    };
    onSuccess?: () => void;
}

export function SalaryStructureForm({ userId, userName, initialData, onSuccess }: SalaryFormProps) {
    const { currencySymbol } = useLocalization();
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    
    const [baseSalary, setBaseSalary] = useState(initialData?.baseSalary?.toString() || "0")
    
    // Convert object to array for dynamic form
    const [allowances, setAllowances] = useState<{name: string, amount: string}[]>(
        initialData?.allowances 
            ? Object.entries(initialData.allowances).map(([k, v]) => ({ name: k, amount: v.toString() }))
            : [{ name: "HRA", amount: "0" }]
    )
    
    const [deductions, setDeductions] = useState<{name: string, amount: string}[]>(
        initialData?.deductions
            ? Object.entries(initialData.deductions).map(([k, v]) => ({ name: k, amount: v.toString() }))
            : [{ name: "Professional Tax", amount: "0" }]
    )

    const handleSave = async () => {
        setLoading(true)
        setSuccess(false)
        try {
            // Reconstruct JSON objects
            const allws: Record<string, number> = {}
            allowances.forEach(a => { if (a.name) allws[a.name] = Number(a.amount) })

            const deds: Record<string, number> = {}
            deductions.forEach(d => { if (d.name) deds[d.name] = Number(d.amount) })

            const res = await setStaffSalary(userId, {
                baseSalary: Number(baseSalary),
                allowances: allws,
                deductions: deds
            })

            if (res?.success) {
                setSuccess(true)
                if (onSuccess) onSuccess()
            } else {
                alert("Error: " + res?.error)
            }
        } catch (err: any) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-800 pb-4">
                <CardTitle className="text-lg">Salary Structure: {userName}</CardTitle>
                <CardDescription>Configure fixed base pay, standard allowances, and fixed deductions.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
                
                {/* Base Salary */}
                <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Monthly Base Salary</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400">{currencySymbol}</span>
                        <Input 
                            type="number" 
                            className="pl-8 text-lg font-medium" 
                            value={baseSalary} 
                            onChange={(e) => setBaseSalary(e.target.value)} 
                        />
                    </div>
                </div>

                {/* Allowances */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Fixed Allowances (+)</Label>
                        <Button variant="outline" size="sm" onClick={() => setAllowances([...allowances, {name: '', amount: '0'}])}>
                            <Plus className="h-4 w-4 mr-1"/> Add
                        </Button>
                    </div>
                    {allowances.map((al, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <Input placeholder="e.g. HRA, Transport" value={al.name} onChange={(e) => {
                                const newAl = [...allowances]; newAl[idx].name = e.target.value; setAllowances(newAl);
                            }} />
                            <Input type="number" placeholder="Amount" className="w-32" value={al.amount} onChange={(e) => {
                                const newAl = [...allowances]; newAl[idx].amount = e.target.value; setAllowances(newAl);
                            }} />
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0" onClick={() => {
                                setAllowances(allowances.filter((_, i) => i !== idx))
                            }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Deductions */}
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-red-600 dark:text-red-400">Fixed Deductions (-)</Label>
                        <Button variant="outline" size="sm" onClick={() => setDeductions([...deductions, {name: '', amount: '0'}])}>
                            <Plus className="h-4 w-4 mr-1"/> Add
                        </Button>
                    </div>
                    {deductions.map((ded, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <Input placeholder="e.g. PF, Tax" value={ded.name} onChange={(e) => {
                                const newDed = [...deductions]; newDed[idx].name = e.target.value; setDeductions(newDed);
                            }} />
                            <Input type="number" placeholder="Amount" className="w-32" value={ded.amount} onChange={(e) => {
                                const newDed = [...deductions]; newDed[idx].amount = e.target.value; setDeductions(newDed);
                            }} />
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0" onClick={() => {
                                setDeductions(deductions.filter((_, i) => i !== idx))
                            }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Totals Preview */}
                <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-lg flex justify-between items-center">
                    <div className="text-sm text-slate-500">Estimated Gross Monthly Pay</div>
                    <div className="text-xl font-bold text-slate-900 dark:text-white">
                        {currencySymbol}{Number(baseSalary) + allowances.reduce((acc, a) => acc + (Number(a.amount)||0), 0)}
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Structure"}
                    </Button>
                    {success && <div className="flex items-center text-emerald-600 text-sm font-medium"><CheckCircle2 className="h-4 w-4 mr-1"/> Saved Successfully</div>}
                </div>
            </CardContent>
        </Card>
    )
}
