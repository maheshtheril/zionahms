'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCompany } from '@/app/actions/company'
import { getCountries, getCurrencies } from '@/app/actions/public'
import {
    Building2, Globe, Wallet, ChevronRight, ChevronLeft,
    Shield, Mail, Phone, MapPin, ExternalLink, Activity,
    CheckCircle2, AlertCircle, Info, Landmark
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function NewCompanyPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [countries, setCountries] = useState<any[]>([])
    const [currencies, setCurrencies] = useState<any[]>([])

    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        country_id: '',
        currency_id: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        gstin: '',
        registration_number: ''
    })

    useEffect(() => {
        getCountries().then(setCountries)
        getCurrencies().then(setCurrencies)
    }, [])

    // Auto-select currency based on country (Power UX)
    useEffect(() => {
        if (formData.country_id && currencies.length > 0) {
            const country = countries.find(c => c.id === formData.country_id);
            if (country) {
                if (country.iso2 === 'IN') {
                    const inr = currencies.find(c => c.code === 'INR');
                    if (inr) setFormData(p => ({ ...p, currency_id: inr.id }))
                } else if (country.iso2 === 'US') {
                    const usd = currencies.find(c => c.code === 'USD');
                    if (usd) setFormData(p => ({ ...p, currency_id: usd.id }))
                }
            }
        }
    }, [formData.country_id, currencies, countries])

    const handleSubmit = async () => {
        setLoading(true)
        setError('')

        try {
            const res = await createCompany(formData)
            if (res.success) {
                router.push('/settings/companies')
                router.refresh()
            } else {
                setError(res.error || 'Failed to create company')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const steps = [
        { num: 1, title: 'Identity', icon: Building2, desc: 'Basic Information' },
        { num: 2, title: 'Reach', icon: MapPin, desc: 'Contact & Location' },
        { num: 3, title: 'Compliance', icon: Shield, desc: 'Tax & Registration' },
        { num: 4, title: 'Finance', icon: Wallet, desc: 'Currency Settings' },
    ]

    const nextStep = () => {
        if (step < 4) setStep(step + 1)
    }

    const prevStep = () => {
        if (step > 1) setStep(step - 1)
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-black/50 py-12 px-4 font-sans">
            <div className="max-w-5xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px] mb-3">
                            <Activity className="w-4 h-4" />
                            <span>Enterprise Core</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Establish New Entity</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Expand your organizational structure with a world-standard legal entity.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-400">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>System Verified</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Stepper Sidebar */}
                    <div className="lg:col-span-3">
                        <div className="space-y-2 relative">
                            {/* Connector Line */}
                            <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />

                            {steps.map((s) => (
                                <div key={s.num} className="relative z-10">
                                    <button
                                        disabled={loading}
                                        onClick={() => s.num < step && setStep(s.num)}
                                        className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${step === s.num ? 'bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none translate-x-1' : 'opacity-60'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${step >= s.num
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                                            }`}>
                                            <s.icon size={20} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className={`text-[10px] uppercase font-black tracking-widest ${step === s.num ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                                                Step 0{s.num}
                                            </span>
                                            <span className={`text-sm font-bold ${step === s.num ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                                {s.title}
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form Component */}
                    <div className="lg:col-span-9">
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden relative">

                            {/* Visual Accents */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 blur-3xl rounded-full" />

                            <div className="p-10 md:p-12">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={step}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-8"
                                    >
                                        {step === 1 && (
                                            <div className="space-y-8">
                                                <div className="pb-8 border-b border-slate-100 dark:border-slate-800">
                                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Organization Identity</h2>
                                                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Define the core legal name and operation sector.</p>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Legal Entity Name</label>
                                                        <div className="relative group">
                                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                            <input
                                                                type="text"
                                                                value={formData.name}
                                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 dark:text-white"
                                                                placeholder="e.g. Grand City Healthcare"
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Industry Sector</label>
                                                        <select
                                                            value={formData.industry}
                                                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                                            className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none"
                                                        >
                                                            <option value="">Select Industry...</option>
                                                            <option value="Healthcare">Healthcare / Hospital</option>
                                                            <option value="Manufacturing">Manufacturing</option>
                                                            <option value="Retail">Retail / Pharmacy</option>
                                                            <option value="Services">Professional Services</option>
                                                            <option value="Technology">Technology</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {step === 2 && (
                                            <div className="space-y-8">
                                                <div className="pb-8 border-b border-slate-100 dark:border-slate-800">
                                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Reach & Location</h2>
                                                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Define how the entity can be contacted and its physical location.</p>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Work Email</label>
                                                        <div className="relative group">
                                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                            <input
                                                                type="email"
                                                                value={formData.email}
                                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                                                                placeholder="contact@company.com"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Office Hotline</label>
                                                        <div className="relative group">
                                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                            <input
                                                                type="text"
                                                                value={formData.phone}
                                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                                                                placeholder="+1 (555) 000-0000"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Official Website</label>
                                                        <div className="relative group">
                                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                            <input
                                                                type="text"
                                                                value={formData.website}
                                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold uppercase tracking-tight text-xs"
                                                                placeholder="WWW.COMPANY.COM"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 md:col-span-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Physical Registered Address</label>
                                                        <div className="relative group">
                                                            <MapPin className="absolute left-4 top-6 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                            <textarea
                                                                rows={3}
                                                                value={formData.address}
                                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold resize-none"
                                                                placeholder="Full office address with postal code..."
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {step === 3 && (
                                            <div className="space-y-8">
                                                <div className="pb-8 border-b border-slate-100 dark:border-slate-800">
                                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Compliance & Tax</h2>
                                                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Critical identification details for fiscal reporting.</p>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">GSTIN / TAX Identification Number</label>
                                                        <div className="relative group">
                                                            <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                            <input
                                                                type="text"
                                                                value={formData.gstin}
                                                                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold uppercase tracking-wider"
                                                                placeholder="e.g. 29AAAAA0000A1Z5"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Company Registration No.</label>
                                                        <div className="relative group">
                                                            <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                                            <input
                                                                type="text"
                                                                value={formData.registration_number}
                                                                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold uppercase"
                                                                placeholder="CRN-12345678"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-4">
                                                    <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                                        Tax details are mandatory for generating GST-ready invoices and compliance reports. Ensure these match your legal certificates exactly.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {step === 4 && (
                                            <div className="space-y-8">
                                                <div className="pb-8 border-b border-slate-100 dark:border-slate-800">
                                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Financial Domain</h2>
                                                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Select the base currency and country of jurisdiction.</p>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Jurisdiction (Country)</label>
                                                        <select
                                                            value={formData.country_id}
                                                            onChange={e => setFormData({ ...formData, country_id: e.target.value })}
                                                            className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none"
                                                        >
                                                            <option value="">Select Country...</option>
                                                            {countries.map(c => (
                                                                <option key={c.id} value={c.id}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Operation Currency</label>
                                                        <select
                                                            value={formData.currency_id}
                                                            onChange={e => setFormData({ ...formData, currency_id: e.target.value })}
                                                            className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 dark:text-white appearance-none"
                                                        >
                                                            <option value="">Select Currency...</option>
                                                            {currencies.map(c => (
                                                                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4">
                                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                                        Critical Warning: The **Base Currency** cannot be modified once transactions are indexed in the general ledger. Verify the selection with your audit team.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-8 p-6 bg-rose-500/10 border border-rose-500/10 text-rose-600 font-bold text-sm rounded-2xl flex items-center gap-3"
                                    >
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        {error}
                                    </motion.div>
                                )}

                                <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        disabled={loading}
                                        className={`flex items-center gap-2 px-6 py-4 text-slate-500 dark:text-slate-400 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 ${step === 1 ? 'invisible' : ''}`}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                        Previous Phase
                                    </button>

                                    <div className="flex items-center gap-4">
                                        <button
                                            type="button"
                                            onClick={() => router.back()}
                                            className="px-6 py-4 text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-95"
                                        >
                                            Discard
                                        </button>

                                        {step < 4 ? (
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                disabled={step === 1 && !formData.name}
                                                className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                                            >
                                                Proceed to Phase 0{step + 1}
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleSubmit}
                                                disabled={loading || !formData.country_id || !formData.currency_id}
                                                className="flex items-center gap-3 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                                            >
                                                {loading ? (
                                                    <span className="flex items-center gap-3">
                                                        <Activity className="w-5 h-5 animate-pulse" />
                                                        Deploying Core...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-3">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        Finalize Deployment
                                                    </span>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
