'use client'

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Mail, Lock, ArrowRight, Loader2, Sparkles, Building2, Activity, KeyRound, CheckCircle2, AlertCircle, X, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ZionaLogo } from "@/components/branding/ziona-logo"
import { requestPasswordReset } from "@/app/actions/password-reset"
import { loginAction } from "@/app/actions/auth"


interface Branding {
    app_name: string | null;
    logo_url: string | null;
    name: string | null;
    isPublic: boolean;
}

export default function LoginClient({ branding, initialMessage }: { branding: Branding | null; initialMessage?: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [focusedField, setFocusedField] = useState<string | null>(null)
    const [bannerMessage, setBannerMessage] = useState<string | null>(initialMessage || null)
    const [loginError, setLoginError] = useState<string | null>(null)

    // Forgot Password Modal State
    const [showForgotModal, setShowForgotModal] = useState(false)
    const [forgotEmail, setForgotEmail] = useState('')
    const [forgotLoading, setForgotLoading] = useState(false)
    const [forgotStatus, setForgotStatus] = useState<{ type: 'success' | 'error'; message: string; devUrl?: string } | null>(null)

    // Form State for Login
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    async function handleForgotPassword(e: React.FormEvent) {
        e.preventDefault()
        setForgotLoading(true)
        setForgotStatus(null)
        try {
            const res = await requestPasswordReset(forgotEmail)
            if (res.error) {
                setForgotStatus({ type: 'error', message: res.error })
            } else {
                setForgotStatus({
                    type: 'success',
                    message: res.message || 'Password reset instructions have been sent.',
                    devUrl: res.devResetUrl
                })
            }
        } catch (err: any) {
            setForgotStatus({ type: 'error', message: 'An unexpected error occurred. Please try again.' })
        } finally {
            setForgotLoading(false)
        }
    }


    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setLoginError(null)
        try {
            const data = new FormData()
            data.append('email', formData.email)
            data.append('password', formData.password)

            const res = await loginAction(null, data)
            if (res?.error) {
                setLoginError(res.error)
                setIsLoading(false)
            } else {
                window.location.href = "/"
            }
        } catch (error: any) {
            // Next.js redirect from server action
            window.location.href = "/"
        }
    }




    const appName = branding?.app_name || "Enterprise ERP";
    const isCRM = appName.toLowerCase().includes('crm');

    const theme = isCRM ? {
        // Updated to Green/Emerald Theme for Seeakk CRM
        bgImage: "/crm-green-bg.png",
        gradientOverlay: "from-emerald-950/90 via-gray-950/70 to-teal-950/50",
        radialOverlay: "from-emerald-900/30 via-slate-950/50 to-black/80",
        heading: (
            <>
                Powering <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                    Business Growth
                </span>
            </>
        ),
        subheading: "Manage leads, track performance, and drive revenue with AI-driven insights.",
        tagline: "Intelligent Business Suite"
    } : {
        bgImage: "/login-bg.png",
        gradientOverlay: "from-slate-950/80 via-slate-900/60 to-slate-900/40",
        radialOverlay: "from-indigo-950/20 via-slate-950/40 to-slate-950/80",
        heading: (
            <>
                The Future of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-400 to-indigo-400">
                    Healthcare
                </span>
            </>
        ),
        subheading: "Streamline patient care, manage operations efficiently, and experience the next generation of hospital management.",
        tagline: "Secure Enterprise Gateway"
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center font-sans overflow-hidden relative">

            {/* Cinematic Background (Fixed Full Screen) */}
            <div className="absolute inset-0 bg-slate-900">
                <motion.div
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 2.5, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    <img
                        src={theme.bgImage}
                        alt="Background"
                        className="w-full h-full object-cover opacity-80"
                    />
                    {/* Gradient Overlays for Readability */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradientOverlay}`} />
                    <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${theme.radialOverlay}`} />
                </motion.div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-7xl mx-auto p-4 flex flex-col items-center justify-center">

                <motion.div
                    initial={{ y: 30 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    {/* Glassmorphism Card */}
                    <div className="backdrop-blur-xl bg-white/10 dark:bg-black/40 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-3xl overflow-hidden relative">
                        {/* Glow Effect Top */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-[80px]" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-[80px]" />

                        <div className="p-8 md:p-10 relative z-10">

                            {/* Header Section */}
                            <div className="text-center mb-10">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex justify-center mb-6"
                                >
                                    {appName.toLowerCase().includes('ziona') ||
                                        appName.toLowerCase().includes('cloud hms') ||
                                        process.env.NEXT_PUBLIC_APP_BRAND === 'ZIONA' ? (
                                        <div className="relative group">
                                            {/* Advanced Glow */}
                                            <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-1000" />
                                            <ZionaLogo size={120} colorScheme="signature" theme="dark" variant="icon" speed="slow" />
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 relative flex items-center justify-center">
                                            {/* Glows for context */}
                                            <div className="absolute inset-0 bg-blue-500/10 blur-[40px] rounded-full" />

                                            {/* Stylized Logo Container */}
                                            <div className="relative z-10 w-28 h-28 bg-white rounded-2xl p-4 shadow-2xl flex items-center justify-center border border-white/20">
                                                {branding?.logo_url ? (
                                                    <img src={branding.logo_url}
                                                        alt={appName}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <Activity className="w-12 h-12 text-blue-600" />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h1 className={`text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r tracking-tighter mb-3 filter contrast-125 ${isCRM
                                        ? "from-emerald-400 via-teal-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                        : "from-cyan-400 via-purple-500 to-emerald-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                                        }`}>
                                        {appName}
                                    </h1>
                                    <div className={`h-0.5 w-16 bg-gradient-to-r from-transparent to-transparent mx-auto mb-4 opacity-70 ${isCRM
                                        ? "via-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                                        : "via-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                                        }`} />
                                    <p className="text-slate-400 text-xs font-semibold tracking-[0.3em] uppercase opacity-70">
                                        {theme.tagline}
                                    </p>
                                </motion.div>
                            </div>

                            {/* Banner Notification (e.g. from password reset) */}
                            {bannerMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-medium flex items-center gap-3 backdrop-blur-md"
                                >
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <div className="flex-1">{bannerMessage}</div>
                                    <button
                                        type="button"
                                        onClick={() => setBannerMessage(null)}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}

                            {/* Error Banner */}
                            {loginError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-medium flex items-center gap-3 backdrop-blur-md"
                                >
                                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                                    <div className="flex-1">{loginError}</div>
                                    <button
                                        type="button"
                                        onClick={() => setLoginError(null)}
                                        className="text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}


                            {/* Login Form */}
                            <form onSubmit={handleLogin} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">Email</label>
                                    <div className={`relative group transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className={`h-5 w-5 transition-colors duration-300 ${focusedField === 'email' ? 'text-cyan-400' : 'text-slate-500'}`} />
                                        </div>
                                        <input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            className="block w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-black/40 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 backdrop-blur-sm"
                                            placeholder="doctor@hospital.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowForgotModal(true)
                                                setForgotStatus(null)
                                                setForgotEmail(formData.email)
                                            }}
                                            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none"
                                        >
                                            Forgot?
                                        </button>
                                    </div>
                                    <div className={`relative group transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className={`h-5 w-5 transition-colors duration-300 ${focusedField === 'password' ? 'text-cyan-400' : 'text-slate-500'}`} />
                                        </div>
                                        <input
                                            name="password"
                                            type="password"
                                            value={formData.password}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            className="block w-full pl-12 pr-4 py-3.5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-black/40 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 backdrop-blur-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-300 mt-2 disabled:opacity-70 disabled:cursor-not-allowed group flex items-center justify-center gap-2 relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                                            <span className="relative z-10">Authenticating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="relative z-10">Sign In to Dashboard</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Footer in Card */}
                        <div className="px-8 pb-6 text-center">
                            <p className="text-xs text-slate-500">
                                Protected by Enterprise Security &copy; {new Date().getFullYear()}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Forgot Password Modal */}
            <AnimatePresence>
                {showForgotModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowForgotModal(false)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        />

                        {/* Modal Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="relative z-10 w-full max-w-md backdrop-blur-2xl bg-slate-900/90 border border-white/20 shadow-[0_16px_48px_0_rgba(0,0,0,0.6)] rounded-3xl p-6 md:p-8 overflow-hidden"
                        >
                            {/* Decorative Glow */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-[60px]" />
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-[60px]" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                                            <KeyRound className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white tracking-tight">Reset Password</h3>
                                            <p className="text-xs text-slate-400">Recover your account credentials</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotModal(false)}
                                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {forgotStatus && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`mb-6 p-4 rounded-2xl text-xs font-medium flex flex-col gap-2 ${
                                            forgotStatus.type === 'success'
                                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                                                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {forgotStatus.type === 'success' ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                            )}
                                            <span>{forgotStatus.message}</span>
                                        </div>
                                        {forgotStatus.devUrl && (
                                            <div className="mt-2 pt-2 border-t border-emerald-500/20">
                                                <p className="text-[11px] text-slate-400 mb-1">Local Dev Mode Direct Reset Link:</p>
                                                <a
                                                    href={forgotStatus.devUrl}
                                                    className="text-cyan-400 hover:text-cyan-300 text-[11px] underline break-all flex items-center gap-1 font-mono"
                                                >
                                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                                    Click to Open Reset Page
                                                </a>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">Account Email</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                            </div>
                                            <input
                                                type="email"
                                                value={forgotEmail}
                                                onChange={e => setForgotEmail(e.target.value)}
                                                required
                                                placeholder="doctor@hospital.com"
                                                className="block w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-black/60 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-300 backdrop-blur-sm text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(false)}
                                            className="w-1/3 py-3 px-4 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 font-semibold text-sm transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={forgotLoading}
                                            className="w-2/3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/20 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {forgotLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Sending...</span>
                                                </>
                                            ) : (
                                                <span>Send Reset Link</span>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}


