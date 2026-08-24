
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTarget, updateTarget } from '@/app/actions/crm/targets'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectNative } from '@/components/ui/select-native'
import { toast } from 'sonner'
import {
    Loader2, Target, Sparkles, TrendingUp, Zap, Calendar,
    Check, Plus, Trash2, ShieldAlert, BarChart, Activity,
    ChevronDown, ChevronUp, Layers
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useLocalization } from "@/contexts/localization-context";

interface Milestone {
    id?: string;
    name: string;
    metric_type: string;
    target_value: number;
    deadline: string;
    is_blocking: boolean;
    status: string;
}

interface TargetFormProps {
    assignees?: {
        id: string
        email: string
        full_name: string | null
        role: string | null
    }[]
    initialData?: any
}

export function TargetForm(props: TargetFormProps) {
    const { currencySymbol } = useLocalization();
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // State for multi-selection
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
        props.initialData?.assignee_id ? [props.initialData.assignee_id] : []
    )

    // State for Milestones
    const [milestones, setMilestones] = useState<Milestone[]>(
        props.initialData?.milestones?.map((m: any) => ({
            ...m,
            deadline: format(new Date(m.deadline), 'yyyy-MM-dd')
        })) || [
            { name: 'Week 1 Sprint', metric_type: 'activities', target_value: 50, deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), is_blocking: true, status: 'pending' }
        ]
    )

    const toggleAssignee = (id: string) => {
        if (props.initialData) return
        setSelectedAssignees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    const addMilestone = () => {
        setMilestones([...milestones, {
            name: `Gate ${milestones.length + 1}`,
            metric_type: 'revenue',
            target_value: 0,
            deadline: format(new Date(), 'yyyy-MM-dd'),
            is_blocking: false,
            status: 'pending'
        }])
    }

    const removeMilestone = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index))
    }

    const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
        const newMilestones = [...milestones]
        newMilestones[index] = { ...newMilestones[index], [field]: value }
        setMilestones(newMilestones)
    }

    const formatDate = (dateString: string | Date | undefined) => {
        if (!dateString) return ''
        const d = new Date(dateString)
        return d.toISOString().split('T')[0]
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (selectedAssignees.length === 0 && !props.initialData) {
            toast.error("Agent Attribution Required", { description: "You must designate at least one operational asset for this mission." })
            return
        }

        setLoading(true)

        const formData = new FormData(event.currentTarget)
        formData.set('milestones_json', JSON.stringify(milestones))

        let res;
        if (props.initialData) {
            res = await updateTarget(props.initialData.id, formData)
        } else {
            res = await createTarget(formData)
        }

        setLoading(false)

        if (res.error) {
            toast.error("Error", { description: res.error })
        } else {
            toast.success(props.initialData ? "Objective Recalibrated" : "Objective Locked", { description: "Full-scale performance parameters synchronized." })
            router.push('/crm/targets')
            router.refresh()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-12 pb-24">
            {selectedAssignees.map(id => <input key={id} type="hidden" name="assignee_id" value={id} />)}
            <input type="hidden" name="milestones_json" value={JSON.stringify(milestones)} />

            <div className="glass shadow-2xl rounded-[3rem] overflow-hidden border border-white/20 backdrop-blur-xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 p-10 border-b border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <Target className="w-32 h-32 text-indigo-500" />
                    </div>
                    <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-4">
                        <ShieldAlert className="w-5 h-5 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Performance Command Center</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        {props.initialData ? 'Recalibrate Asset Goals' : 'Synchronize New Objectives'}
                    </h2>
                </div>

                <div className="p-10 space-y-12">
                    {/* Assignee Section */}
                    {(props.assignees && props.assignees.length > 0) && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Operation Agents</Label>
                                <span className="text-[10px] font-bold text-indigo-500">{selectedAssignees.length} Active Selectors</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {props.assignees.map(user => {
                                    const { currencySymbol } = useLocalization();
                                    const isSelected = selectedAssignees.includes(user.id)
                                    return (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleAssignee(user.id)}
                                            className={`
                                                relative flex items-center p-4 rounded-3xl border cursor-pointer transition-all duration-500 group
                                                ${isSelected
                                                    ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/20 translate-y-[-2px]'
                                                    : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/50 hover:bg-white hover:border-indigo-300'
                                                }
                                                ${props.initialData ? 'cursor-not-allowed' : ''}
                                            `}
                                        >
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black mr-4 ${isSelected ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                {user.full_name?.charAt(0) || user.email.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                                                    {user.full_name || user.email}
                                                </p>
                                                <p className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${isSelected ? 'text-indigo-200' : 'text-indigo-500'}`}>
                                                    {user.role || 'Sales Agent'}
                                                </p>
                                            </div>
                                            {isSelected && <Check className="w-5 h-5 text-indigo-200" />}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Vector Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-8 rounded-3xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/5">
                        <div className="space-y-4">
                            <Label htmlFor="target_type" className="text-xs font-black uppercase tracking-widest text-slate-500">Metric Vector</Label>
                            <SelectNative
                                id="target_type"
                                name="target_type"
                                required
                                defaultValue={props.initialData?.target_type || "revenue"}
                                className="h-14 bg-white dark:bg-slate-950 border-white/20 rounded-2xl font-bold shadow-sm"
                            >
                                <option value="revenue">Capital: Total Revenue</option>
                                <option value="activities">Operational: Activity Volume</option>
                                <option value="pipeline_value">Strategy: Pipeline Value</option>
                            </SelectNative>
                        </div>
                        <div className="space-y-4">
                            <Label htmlFor="target_value" className="text-xs font-black uppercase tracking-widest text-slate-500">Target Amplitude</Label>
                            <Input
                                id="target_value"
                                name="target_value"
                                type="number"
                                required
                                defaultValue={props.initialData?.target_value}
                                className="h-14 bg-white dark:bg-slate-950 border-white/20 rounded-2xl font-black text-xl shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Milestone Architecture Section (The "Full Fledged" Part) */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-500/10">
                                    <Layers className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Mission Gates</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gated Progression Architecture</p>
                                </div>
                            </div>
                            <Button type="button" onClick={addMilestone} variant="outline" className="h-10 px-4 rounded-xl border-dashed hover:bg-purple-500 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Command Gate
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {milestones.map((m, index) => (
                                <div key={index} className="group relative p-8 rounded-[2rem] bg-white/30 dark:bg-black/20 border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500">
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => updateMilestone(index, 'is_blocking', !m.is_blocking)}
                                            className={`p-2 rounded-xl transition-all ${m.is_blocking ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
                                            title={m.is_blocking ? "Blocking Gate Active" : "Set as Blocking Gate"}
                                        >
                                            <ShieldAlert className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeMilestone(index)}
                                            className="p-2 rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                                        <div className="md:col-span-2 space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gate Name</Label>
                                            <Input
                                                value={m.name}
                                                onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                                                className="h-12 bg-white/50 dark:bg-slate-950 border-none rounded-xl font-bold"
                                                placeholder="e.g. Activity Ramp Up"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metric Type</Label>
                                            <SelectNative
                                                value={m.metric_type}
                                                onChange={(e) => updateMilestone(index, 'metric_type', e.target.value)}
                                                className="h-12 bg-white/50 dark:bg-slate-950 border-none rounded-xl font-bold"
                                            >
                                                <option value="activities">Activities</option>
                                                <option value="revenue">Revenue</option>
                                                <option value="pipeline_value">Pipeline</option>
                                                <option value="calls">Calls</option>
                                            </SelectNative>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deadline</Label>
                                            <Input
                                                type="date"
                                                value={m.deadline}
                                                onChange={(e) => updateMilestone(index, 'deadline', e.target.value)}
                                                className="h-12 bg-white/50 dark:bg-slate-950 border-none rounded-xl font-bold"
                                            />
                                        </div>
                                        <div className="md:col-span-1 space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gate Threshold</Label>
                                            <Input
                                                type="number"
                                                value={m.target_value}
                                                onChange={(e) => updateMilestone(index, 'target_value', parseFloat(e.target.value))}
                                                className="h-12 bg-white/50 dark:bg-slate-950 border-none rounded-xl font-black text-indigo-600"
                                            />
                                        </div>
                                    </div>

                                    {m.is_blocking && (
                                        <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-rose-500 uppercase tracking-widest">
                                            <Zap className="w-3 h-3 fill-rose-500" />
                                            Critical Compliance Gate: Failure results in account restriction
                                        </div>
                                    )}
                                </div>
                            ))}

                            {milestones.length === 0 && (
                                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2rem]">
                                    <p className="text-slate-400 font-bold text-sm">No command gates defined for this objective.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline & Incentives */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-slate-100 dark:border-white/5 pt-10">
                        <div className="space-y-6">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Operation Lifecycle</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Commencement</span>
                                    <Input
                                        type="date"
                                        name="period_start"
                                        required
                                        defaultValue={formatDate(props.initialData?.period_start)}
                                        className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border-none font-bold"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Termination</span>
                                    <Input
                                        type="date"
                                        name="period_end"
                                        required
                                        defaultValue={formatDate(props.initialData?.period_end)}
                                        className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border-none font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <Label htmlFor="incentive_amount" className="text-xs font-black uppercase tracking-widest text-slate-500">Achievement Reward Pool</Label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">{currencySymbol}</div>
                                <Input
                                    id="incentive_amount"
                                    name="incentive_amount"
                                    type="number"
                                    step="0.01"
                                    defaultValue={props.initialData?.incentive_amount}
                                    className="h-14 pl-10 rounded-2xl bg-emerald-500/5 border-emerald-500/20 text-emerald-600 font-black text-xl placeholder:text-emerald-200"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 bg-indigo-500/5 flex flex-col sm:flex-row justify-end gap-6 border-t border-white/10">
                    <Link href="/crm/targets">
                        <Button type="button" variant="ghost" className="h-14 px-10 rounded-2xl font-bold uppercase tracking-widest text-xs">Abandom Command</Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="h-14 px-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-indigo-500/40 border-none"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (props.initialData ? 'Recalibrate Objective' : 'Synchronize Target Architecture')}
                    </Button>
                </div>
            </div>
        </form>
    )
}


