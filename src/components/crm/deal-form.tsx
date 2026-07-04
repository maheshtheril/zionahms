'use client'

import { useFormState } from 'react-dom'
import { createDeal, updateDeal, DealFormState } from '@/app/actions/crm/deals'
import { SubmitButton } from '@/components/ui/submit-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign, Calendar as CalendarIcon, Briefcase, IndianRupee, Euro, PoundSterling } from 'lucide-react'
import { useState } from 'react'
import { SYSTEM_DEFAULT_CURRENCY_CODE, SYSTEM_DEFAULT_CURRENCY_SYMBOL } from '@/lib/currency-constants'

import { CurrencyInfo } from '@/app/actions/currency'
import { useLocalization } from "@/contexts/localization-context";

export function DealForm({
    company,
    pipelines = [],
    initialData = null,
    mode = 'create',
    defaultCurrency,
    supportedCurrencies = []
}: {
    company?: any,
    pipelines?: any[],
    initialData?: any,
    mode?: 'create' | 'edit',
    defaultCurrency?: CurrencyInfo,
    supportedCurrencies?: CurrencyInfo[]
}) {
    const { currencySymbol } = useLocalization();
    const initialState: DealFormState = { message: '', errors: {} }
    const [state, dispatch] = useFormState(mode === 'edit' ? updateDeal : createDeal, initialState)
    const [selectedPipelineId, setSelectedPipelineId] = useState<string>(initialData?.pipeline_id || pipelines[0]?.id || '')

    const [currency, setCurrency] = useState(initialData?.currency || defaultCurrency?.code || SYSTEM_DEFAULT_CURRENCY_CODE)

    // Get symbol for current currency
    const currentCurrencySymbol = supportedCurrencies.find(c => c.code === currency)?.symbol || SYSTEM_DEFAULT_CURRENCY_SYMBOL

    // Get stages for selected pipeline
    const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId)
    const stages = selectedPipeline?.stages || []

    const CurrencyIcon = () => {
        const { currencySymbol } = useLocalization();
        switch (currency) {
            case 'INR': return <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
            case 'EUR': return <Euro className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
            case 'GBP': return <PoundSterling className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
            default: return <span className="absolute left-3 top-2 h-4 w-4 text-gray-500 font-bold pointer-events-none select-none">{currentCurrencySymbol}</span>
        }
    }

    return (
        <form action={dispatch} className="space-y-6">
            {mode === 'edit' && <input type="hidden" name="id" value={initialData.id} />}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{mode === 'edit' ? 'Edit Deal' : 'Deal Information'}</CardTitle>
                        <CardDescription>Key details about the opportunity</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Deal Title</Label>
                            <Input id="title" name="title" placeholder="e.g. Q4 Software License Deal" required defaultValue={initialData?.title} />
                            {state.errors?.title && <p className="text-red-500 text-sm">{state.errors.title}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="value">Value</Label>
                                <div className="relative">
                                    <CurrencyIcon />
                                    <Input id="value" name="value" type="number" className="pl-9" placeholder="0.00" step="0.01" defaultValue={initialData?.value} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <select
                                    id="currency"
                                    name="currency"
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {supportedCurrencies.length > 0 ? (
                                        supportedCurrencies.map(c => (
                                            <option key={c.code} value={c.code}>
                                                {c.code} ({c.symbol})
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="INR">INR (${currencySymbol})</option>
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                            <option value="GBP">GBP (£)</option>
                                            <option value="AUD">AUD (A$)</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pipeline_id">Pipeline</Label>
                                <select
                                    id="pipeline_id"
                                    name="pipeline_id"
                                    value={selectedPipelineId}
                                    onChange={(e) => setSelectedPipelineId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stage_id">Stage</Label>
                                <select
                                    id="stage_id"
                                    name="stage_id"
                                    defaultValue={initialData?.stage_id}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Select Stage</option>
                                    {stages.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Timeline & Probability</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="expected_close_date">Expected Close</Label>
                            <div className="relative">
                                <Input id="expected_close_date" name="expected_close_date" type="date" defaultValue={initialData?.expected_close_date ? new Date(initialData.expected_close_date).toISOString().split('T')[0] : ''} />
                                <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="probability">Probability (%)</Label>
                            <Input id="probability" name="probability" type="number" placeholder="50" max="100" defaultValue={initialData?.probability} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                name="status"
                                defaultValue={initialData?.status || 'open'}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="open">Open</option>
                                <option value="won">Won</option>
                                <option value="lost">Lost</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
                <SubmitButton className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {mode === 'edit' ? 'Update Deal' : 'Create Deal'}
                </SubmitButton>
            </div>

            {state.message && (
                <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                    {state.message}
                </div>
            )}
        </form>
    )
}
