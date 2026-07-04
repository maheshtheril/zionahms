'use client'

import { useState, useMemo } from 'react'
import { Search, Save, Settings2, CheckCircle2, AlertCircle, Calculator, Plus, Trash2, X, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { bulkUpsertSalary, BulkSalaryInput } from '@/app/actions/payroll-bulk'
import { useLocalization } from "@/contexts/localization-context";

type StaffUser = {
    id: string
    name: string
    email: string
    role?: string
}

type StaffSalaryMap = Record<string, BulkSalaryInput>

interface Props {
    users: StaffUser[]
    initialSalaries: StaffSalaryMap
}

export function BulkSalaryGrid({ users, initialSalaries }: Props) {
    const { currencySymbol } = useLocalization();
    const [search, setSearch] = useState('')
    const [salaries, setSalaries] = useState<StaffSalaryMap>(initialSalaries)
    const [isSaving, setIsSaving] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

    // Modal State
    const [editingUserId, setEditingUserId] = useState<string | null>(null)
    const [editingType, setEditingType] = useState<'allowances' | 'deductions' | null>(null)
    const [tempItems, setTempItems] = useState<{key: string, value: number}[]>([])

    const filteredUsers = useMemo(() => {
        if (!search.trim()) return users
        const s = search.toLowerCase()
        return users.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s))
    }, [users, search])

    const handleBaseSalaryChange = (userId: string, value: string) => {
        const num = parseFloat(value) || 0
        setSalaries(prev => ({
            ...prev,
            [userId]: {
                ...(prev[userId] || { userId, hourlyRate: 0, allowances: {}, deductions: {} }),
                baseSalary: num
            }
        }))
        setStatus('idle')
    }

    const calculateGross = (userId: string) => {
        const s = salaries[userId]
        if (!s) return 0
        const allow = Object.values(s.allowances || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) as number
        return Number(s.baseSalary || 0) + (allow as number)
    }

    const handleSave = async () => {
        setIsSaving(true)
        setStatus('idle')
        const payload = Object.values(salaries)
        const res = await bulkUpsertSalary(payload)
        setIsSaving(false)
        if (res.success) {
            setStatus('success')
            setTimeout(() => setStatus('idle'), 3000)
        } else {
            setStatus('error')
            alert("Failed to save: " + res.error)
        }
    }

    const openEditor = (userId: string, type: 'allowances' | 'deductions') => {
        const currentData = salaries[userId]?.[type] || {}
        const items = Object.entries(currentData).map(([k, v]) => ({ key: k, value: Number(v) }))
        if (items.length === 0) items.push({ key: '', value: 0 }) // Add empty row by default
        setTempItems(items)
        setEditingUserId(userId)
        setEditingType(type)
    }

    const saveEditor = () => {
        if (!editingUserId || !editingType) return
        
        const newObj: Record<string, number> = {}
        tempItems.forEach(item => {
            if (item.key.trim() && item.value > 0) {
                newObj[item.key.trim()] = item.value
            }
        })

        setSalaries(prev => ({
            ...prev,
            [editingUserId]: {
                ...(prev[editingUserId] || { userId: editingUserId, baseSalary: 0, hourlyRate: 0, allowances: {}, deductions: {} }),
                [editingType]: newObj
            }
        }))
        setStatus('idle')
        setEditingUserId(null)
        setEditingType(null)
    }

    return (
        <div className="space-y-4 relative">
            {/* Modal Overlay */}
            {editingUserId && editingType && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                            <h3 className="font-bold text-lg capitalize">{editingType} Editor</h3>
                            <button onClick={() => setEditingUserId(null)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-3 flex-1">
                            {tempItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="e.g. HRA, Tax" 
                                        value={item.key}
                                        onChange={(e) => {
                                            const newItems = [...tempItems]; newItems[idx].key = e.target.value; setTempItems(newItems)
                                        }}
                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-lg text-sm"
                                    />
                                    <div className="relative w-32">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                        <input 
                                            type="number" 
                                            value={item.value || ''}
                                            onChange={(e) => {
                                                const newItems = [...tempItems]; newItems[idx].value = parseFloat(e.target.value) || 0; setTempItems(newItems)
                                            }}
                                            className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-lg text-sm"
                                        />
                                    </div>
                                    <button onClick={() => {
                                        const newItems = tempItems.filter((_, i) => i !== idx);
                                        setTempItems(newItems.length ? newItems : [{key: '', value: 0}])
                                    }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            <Button 
                                variant="outline" 
                                onClick={() => setTempItems([...tempItems, {key: '', value: 0}])}
                                className="w-full mt-2 border-dashed"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add Item
                            </Button>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setEditingUserId(null)}>Cancel</Button>
                            <Button onClick={saveEditor} className="bg-indigo-600 hover:bg-indigo-700 text-white">Save {editingType}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input 
                        type="text"
                        placeholder="Search employees by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {status === 'success' && <span className="text-emerald-600 text-sm font-semibold flex items-center"><CheckCircle2 className="h-4 w-4 mr-1"/> Saved</span>}
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-6 rounded-lg shadow-sm"
                    >
                        {isSaving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Bulk Save Changes</>}
                    </Button>
                </div>
            </div>

            {/* Grid */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-zinc-950 dark:text-slate-400 border-b border-slate-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Employee</th>
                                <th className="px-4 py-3 font-semibold w-48">Base Salary (Monthly)</th>
                                <th className="px-4 py-3 font-semibold w-32">Allowances</th>
                                <th className="px-4 py-3 font-semibold w-32">Deductions</th>
                                <th className="px-4 py-3 font-semibold w-40 text-right">Gross Pay</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                            {filteredUsers.map(user => {
                                const { currencySymbol } = useLocalization();
                                const currentSalary = salaries[user.id] || { baseSalary: 0, allowances: {}, deductions: {} }
                                const allowCount = Object.keys(currentSalary.allowances || {}).length
                                const dedCount = Object.keys(currentSalary.deductions || {}).length
                                const gross = calculateGross(user.id)

                                return (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                                <input 
                                                    type="number"
                                                    value={currentSalary.baseSalary || ''}
                                                    onChange={(e) => handleBaseSalaryChange(user.id, e.target.value)}
                                                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-md text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            <button 
                                                onClick={() => openEditor(user.id, 'allowances')}
                                                className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 p-1.5 rounded transition-colors group"
                                            >
                                                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded text-xs font-bold">
                                                    {allowCount} Items
                                                </span>
                                                <Edit2 className="h-3 w-3 text-slate-400 group-hover:text-indigo-500" />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            <button 
                                                onClick={() => openEditor(user.id, 'deductions')}
                                                className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800 p-1.5 rounded transition-colors group"
                                            >
                                                <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-0.5 rounded text-xs font-bold">
                                                    {dedCount} Items
                                                </span>
                                                <Edit2 className="h-3 w-3 text-slate-400 group-hover:text-indigo-500" />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <p className="font-black text-slate-900 dark:text-white">{currencySymbol}{gross.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                                        </td>
                                    </tr>
                                )
                            })}
                            
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                        <p className="font-semibold">No employees found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <p className="text-xs text-slate-500 flex items-center">
                <Calculator className="h-4 w-4 mr-1 inline" /> 
                Click the "Edit" pencil icons next to Allowances or Deductions to instantly manage advanced breakdowns like HRA, PF, or Taxes without leaving the grid.
            </p>
        </div>
    )
}
