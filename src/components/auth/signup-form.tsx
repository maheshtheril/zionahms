'use client'

import { useActionState, useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { signup } from "@/app/actions/auth"
import countryToCurrency from 'country-to-currency';
import { getCountries, getCurrencies, getModules } from "@/app/actions/public"
import { currenciesList, countriesList, modulesList } from "@/lib/static-data"
import { Check, ChevronRight, Building, Layers, Building2, Stethoscope, Home, FlaskConical, Pill, Eye } from "lucide-react"
import { ZionaLogo } from "@/components/branding/ziona-logo"

const WorkspaceSetupLoader = () => {
    const [step, setStep] = useState(0);
    const steps = [
        "Initializing secure environment...",
        "Provisioning isolated tenant database...",
        "Configuring selected modules...",
        "Applying security policies...",
        "Finalizing your workspace..."
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setStep(s => (s < steps.length - 1 ? s + 1 : s));
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-950 p-10 rounded-3xl shadow-2xl shadow-indigo-500/10 max-w-md w-full border border-gray-100 dark:border-slate-800">
                <div className="flex flex-col items-center text-center space-y-8">
                    <div className="relative w-24 h-24">
                        <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-900 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Layers className="w-10 h-10 text-blue-600 animate-pulse" />
                        </div>
                    </div>
                    
                    <div className="space-y-3 w-full">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                            Building Workspace
                        </h3>
                        <p className="text-sm font-semibold text-blue-600 h-5">
                            {steps[step]}
                        </p>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-1000 ease-in-out"
                            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const FACILITY_TYPES = [
    {
        key: 'hospital',
        label: 'Hospital / Multi-specialty',
        description: 'Full inpatient, outpatient & emergency services',
        icon: Building2,
        modules: ['hms', 'finance', 'hr', 'inventory', 'crm'],
        color: 'blue',
    },
    {
        key: 'clinic',
        label: 'Clinic / Polyclinic',
        description: 'Outpatient care & general consultations',
        icon: Stethoscope,
        modules: ['hms', 'finance', 'inventory'],
        color: 'emerald',
    },
    {
        key: 'dental_eye',
        label: 'Dental / Eye Care',
        description: 'Specialized dental or ophthalmology practice',
        icon: Eye,
        modules: ['hms', 'finance', 'inventory'],
        color: 'violet',
    },
    {
        key: 'homecare',
        label: 'Home Care / Telehealth',
        description: 'Remote & home-based patient care services',
        icon: Home,
        modules: ['hms', 'crm', 'finance'],
        color: 'sky',
    },
    {
        key: 'lab',
        label: 'Diagnostic / Lab Center',
        description: 'Laboratory tests, imaging & diagnostics',
        icon: FlaskConical,
        modules: ['hms', 'inventory', 'finance'],
        color: 'amber',
    },
    {
        key: 'pharmacy',
        label: 'Pharmacy / Medical Store',
        description: 'Retail pharmacy & medicine dispensary',
        icon: Pill,
        modules: ['inventory', 'finance'],
        color: 'rose',
    },
] as const;

type FacilityKey = typeof FACILITY_TYPES[number]['key'];

const colorMap: Record<string, { border: string; bg: string; icon: string; dot: string }> = {
    blue:    { border: 'border-blue-500',    bg: 'bg-blue-50',    icon: 'text-blue-600',    dot: 'bg-blue-500' },
    emerald: { border: 'border-emerald-500', bg: 'bg-emerald-50', icon: 'text-emerald-600', dot: 'bg-emerald-500' },
    violet:  { border: 'border-violet-500',  bg: 'bg-violet-50',  icon: 'text-violet-600',  dot: 'bg-violet-500' },
    sky:     { border: 'border-sky-500',     bg: 'bg-sky-50',     icon: 'text-sky-600',     dot: 'bg-sky-500' },
    amber:   { border: 'border-amber-500',   bg: 'bg-amber-50',   icon: 'text-amber-600',   dot: 'bg-amber-500' },
    rose:    { border: 'border-rose-500',    bg: 'bg-rose-50',    icon: 'text-rose-600',    dot: 'bg-rose-500' },
};

export function SignupForm({ 
    setIsLogin, 
    branding,
    initialCountries = [],
    initialCurrencies = [],
    initialModules = []
}: { 
    setIsLogin?: (v: boolean) => void, 
    branding?: any,
    initialCountries?: any[],
    initialCurrencies?: any[],
    initialModules?: any[]
}) {
    const [step, setStep] = useState(1)
    const [state, formAction, isPending] = useActionState(signup, null)
    const [signingIn, setSigningIn] = useState(false)

    // Data constraints
    const [countries, setCountries] = useState<any[]>(initialCountries)
    const [currencies, setCurrencies] = useState<any[]>(initialCurrencies)
    const [modules, setModules] = useState<any[]>(initialModules)

    // Update state if props change, AND fetch in background from API
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await fetch('/api/master-data');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (data.countries) setCountries(data.countries);
                if (data.currencies) setCurrencies(data.currencies);
                if (data.modules) setModules(data.modules);
            } catch (err) {
                console.error("Failed to load master data:", err);
            }
        };

        if (initialCountries.length > 0) {
            setCountries(initialCountries);
            setCurrencies(initialCurrencies);
            setModules(initialModules);
        } else {
            loadData();
        }
    }, [initialCountries, initialCurrencies, initialModules])

    // Form State
    const [facilityType, setFacilityType] = useState<FacilityKey>('hospital')
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        companyName: '',
        countryId: '',
        currencyId: '',
        industry: 'Healthcare',
        modules: ['hms', 'finance', 'hr', 'inventory', 'crm'] as string[]
    })

    const nextStep = () => {
        const form = document.getElementById('signup-form') as HTMLFormElement;
        if (form && !form.checkValidity()) {
            form.reportValidity();
            return;
        }
        setStep(s => s + 1)
    }
    const prevStep = () => setStep(s => s - 1)

    // Auto-login on success
    useEffect(() => {
        if (state && !('error' in state) && formData.email && formData.password && !signingIn) {
            setSigningIn(true);
            let callbackUrl = "/";
            if (formData.modules.includes('crm') && !formData.modules.includes('hms')) {
                callbackUrl = "/crm/dashboard";
            } else if (formData.modules.includes('hms')) {
                callbackUrl = "/hms/dashboard";
            }

            signIn("credentials", {
                email: formData.email.toLowerCase(),
                password: formData.password,
                redirect: false
            }).then(result => {
                if (result?.error) {
                    console.error("[AUTH] Auto-login failed:", result.error);
                    // Force a reload to the login page with the error if it failed
                    window.location.href = `/login?error=CredentialsSignin&email=${encodeURIComponent(formData.email)}`;
                } else {
                    window.location.href = callbackUrl;
                }
            }).catch(err => {
                console.error("[AUTH] Fatal auto-login error:", err);
                setSigningIn(false);
            });
        }
    }, [state, formData.email, formData.password, formData.modules, signingIn]);

    // Auto-select currency based on country
    useEffect(() => {
        if (formData.countryId && currencies.length > 0) {
            const country = countries.find(c => c.id === formData.countryId);
            if (country && country.iso2) {
                // @ts-ignore - countryToCurrency is a dictionary
                const currencyCode = countryToCurrency[country.iso2];
                if (currencyCode) {
                    const match = currencies.find(c => c.code === currencyCode);
                    if (match) {
                        setFormData(p => ({ ...p, currencyId: match.id }));
                    }
                }
            }
        }
    }, [formData.countryId, currencies, countries])

    const isWorking = isPending || signingIn || (state && !('error' in state));

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative w-full h-full">
            {isWorking && <WorkspaceSetupLoader />}
            
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                {/* Sidebar Progress */}
                <div className="bg-slate-900 p-8 md:w-1/3 flex flex-col justify-between text-white">
                    <div>
                        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 shadow-lg shadow-indigo-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shrink-0 overflow-hidden">
                            {branding?.logo_url ? (
                                <img src={branding.logo_url} alt={branding.app_name || 'Logo'} className="h-full w-full object-contain rounded-xl p-1" />
                            ) : (
                                <ZionaLogo size={36} variant="icon" theme="dark" speed="slow" colorScheme="signature" />
                            )}
                        </div>
                        <h2 className="text-xl font-bold mb-2">Join {branding?.app_name || branding?.name || 'Organization'}</h2>
                        <p className="text-slate-400 text-sm">Create your world-class workspace in minutes.</p>
                    </div>

                    <div className="space-y-6">
                        <div className={`flex item-center gap-3 ${step >= 1 ? 'text-blue-400' : 'text-slate-600'}`}>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${step >= 1 ? 'border-blue-400 bg-blue-400/10' : 'border-slate-600'}`}>1</div>
                            <span className="text-sm font-medium">Account Details</span>
                        </div>
                        <div className={`flex item-center gap-3 ${step >= 2 ? 'text-blue-400' : 'text-slate-600'}`}>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${step >= 2 ? 'border-blue-400 bg-blue-400/10' : 'border-slate-600'}`}>2</div>
                            <span className="text-sm font-medium">Organization</span>
                        </div>
                        <div className={`flex item-center gap-3 ${step >= 3 ? 'text-blue-400' : 'text-slate-600'}`}>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${step >= 3 ? 'border-blue-400 bg-blue-400/10' : 'border-slate-600'}`}>3</div>
                            <span className="text-sm font-medium">Your Facility</span>
                        </div>
                    </div>

                    <div className="text-xs text-slate-500">
                        © {new Date().getFullYear()} Enterprise
                    </div>
                </div>

                {/* Form Area */}
                <div className="p-8 flex-1 bg-white dark:bg-slate-950 relative">
                    <form id="signup-form" action={formAction} className="h-full flex flex-col">
                        <input type="hidden" name="email" value={formData.email} />
                        <input type="hidden" name="password" value={formData.password} />
                        <input type="hidden" name="name" value={formData.name} />
                        <input type="hidden" name="companyName" value={formData.companyName} />
                        <input type="hidden" name="countryId" value={formData.countryId} />
                        <input type="hidden" name="currencyId" value={formData.currencyId} />
                        <input type="hidden" name="industry" value={formData.industry} />
                        <input type="hidden" name="modules" value={formData.modules.join(',')} />

                        {step === 1 && (
                            <div className="flex-1 space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Create your account</h3>
                                
                                <div className="relative group">
                                    <input id="name" value={formData.name} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="peer w-full border-2 border-gray-100 dark:border-slate-800 rounded-xl px-4 pt-6 pb-2 focus:border-blue-600 dark:focus:border-blue-500 bg-gray-50/50 dark:bg-slate-900/50 text-gray-900 dark:text-white outline-none transition-all placeholder-transparent" placeholder="Full Name" />
                                    <label htmlFor="name" className="absolute left-4 top-2 text-xs font-bold text-gray-400 uppercase transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-gray-500 peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-blue-600 pointer-events-none">Full Name</label>
                                </div>
                                <div className="relative group">
                                    <input id="email" type="email" value={formData.email} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} onChange={e => setFormData({ ...formData, email: e.target.value })} required className="peer w-full border-2 border-gray-100 dark:border-slate-800 rounded-xl px-4 pt-6 pb-2 focus:border-blue-600 dark:focus:border-blue-500 bg-gray-50/50 dark:bg-slate-900/50 text-gray-900 dark:text-white outline-none transition-all placeholder-transparent" placeholder="Email Address" />
                                    <label htmlFor="email" className="absolute left-4 top-2 text-xs font-bold text-gray-400 uppercase transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-gray-500 peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-blue-600 pointer-events-none">Email Address</label>
                                </div>
                                <div className="relative group">
                                    <input id="password" type="password" value={formData.password} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} onChange={e => setFormData({ ...formData, password: e.target.value })} required className="peer w-full border-2 border-gray-100 dark:border-slate-800 rounded-xl px-4 pt-6 pb-2 focus:border-blue-600 dark:focus:border-blue-500 bg-gray-50/50 dark:bg-slate-900/50 text-gray-900 dark:text-white outline-none transition-all placeholder-transparent" placeholder="Password" />
                                    <label htmlFor="password" className="absolute left-4 top-2 text-xs font-bold text-gray-400 uppercase transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-gray-500 peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-blue-600 pointer-events-none">Password</label>
                                    
                                    {/* Password Strength Indicator */}
                                    <div className="mt-3 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-1.5 flex-1 rounded-full ${formData.password.length > 0 ? (formData.password.length >= 8 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) && /[^A-Za-z0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-amber-400') : 'bg-gray-200 dark:bg-slate-800'}`}></div>
                                            <div className={`h-1.5 flex-1 rounded-full ${formData.password.length >= 8 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) && /[^A-Za-z0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-800'}`}></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className={`flex items-center gap-1.5 ${formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}`}>
                                                <Check className="h-3 w-3" /> 8+ Characters
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}`}>
                                                <Check className="h-3 w-3" /> Capital Letter
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${/[0-9]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}`}>
                                                <Check className="h-3 w-3" /> Number
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}`}>
                                                <Check className="h-3 w-3" /> Special Char (!@#)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex-1 space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Organization Profile</h3>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">Company Name</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                        <input value={formData.companyName} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} onChange={e => setFormData({ ...formData, companyName: e.target.value })} required className="w-full border border-gray-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white" placeholder="My Organization Ltd." />
                                    </div>
                                </div>


                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">Country</label>
                                        <select
                                            value={formData.countryId}
                                            onChange={e => setFormData({ ...formData, countryId: e.target.value })}
                                            required
                                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                            className="w-full border border-gray-200 dark:border-slate-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                        >
                                            <option value="">Select Country</option>
                                            {countries.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">Currency</label>
                                        <select
                                            value={formData.currencyId}
                                            onChange={e => setFormData({ ...formData, currencyId: e.target.value })}
                                            required
                                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                            className="w-full border border-gray-200 dark:border-slate-800 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
                                        >
                                            <option value="">Select Currency</option>
                                            {currencies.map(c => (
                                                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1">Industry</label>
                                        <select 
                                            value={formData.industry} 
                                            disabled
                                            className="w-full border border-gray-200 dark:border-slate-800 rounded-lg px-4 py-3 bg-gray-100 dark:bg-slate-800 text-gray-500 cursor-not-allowed"
                                        >
                                            <option value="Healthcare">Healthcare / Hospital</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex-1 flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">What type of facility are you?</h3>
                                    <p className="text-sm text-gray-400 mt-0.5">We'll configure the right tools automatically.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    {FACILITY_TYPES.map((facility) => {
                                        const Icon = facility.icon;
                                        const isSelected = facilityType === facility.key;
                                        const c = colorMap[facility.color];
                                        return (
                                            <div
                                                key={facility.key}
                                                onClick={() => {
                                                    setFacilityType(facility.key);
                                                    setFormData(prev => ({ ...prev, modules: [...facility.modules] }));
                                                }}
                                                className={`relative p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${
                                                    isSelected
                                                        ? `${c.border} ${c.bg} shadow-sm`
                                                        : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                                                }`}
                                            >
                                                {isSelected && (
                                                    <div className={`absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center ${c.dot}`}>
                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                )}
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${isSelected ? 'bg-white/70' : 'bg-gray-100'}`}>
                                                    <Icon className={`w-4 h-4 ${isSelected ? c.icon : 'text-gray-400'}`} />
                                                </div>
                                                <h4 className={`text-xs font-bold leading-tight mb-0.5 ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                                                    {facility.label}
                                                </h4>
                                                <p className="text-[10px] text-gray-400 leading-snug">{facility.description}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Modules included summary */}
                                {facilityType && (
                                    <div className="mt-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Modules included with your plan</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {FACILITY_TYPES.find(f => f.key === facilityType)?.modules.map(m => (
                                                <span key={m} className="bg-white border border-slate-200 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                                    <Check className="w-2.5 h-2.5 text-green-500" />
                                                    {m.toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Error/Success Messages */}
                        {step === 3 && state && 'error' in state && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mt-2">{state.error}</div>
                        )}


                        {/* Footer Buttons */}
                        <div className="mt-auto pt-6 border-t border-gray-100 flex justify-between">
                            {step > 1 ? (
                                <button type="button" onClick={prevStep} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">
                                    Back
                                </button>
                            ) : (
                                <div />
                            )}

                            {step < 3 ? (
                                <button type="button" onClick={nextStep} className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                                    Next Step <ChevronRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <div className="flex flex-col items-end gap-2">
                                    <button
                                        type="submit"
                                        disabled={isPending || formData.modules.length === 0}
                                        className="px-8 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
                                    >
                                        {isPending ? 'Creating Account...' : 'Complete Setup'}
                                    </button>
                                    {formData.modules.length === 0 && (
                                        <span className="text-xs text-red-500 font-medium animate-pulse">Select a module to continue</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
