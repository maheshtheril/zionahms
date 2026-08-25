'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetPasswordWithToken } from '@/app/actions/password-reset'
import { ShieldCheck, KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordForm({
    token,
    email,
    userName
}: {
    token: string
    email: string
    userName?: string
}) {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    // Password strength computation
    const getStrength = (pwd: string) => {
        if (!pwd) return { score: 0, label: '', color: 'bg-slate-700' }
        let score = 0
        if (pwd.length >= 8) score += 1
        if (/[A-Z]/.test(pwd)) score += 1
        if (/[0-9]/.test(pwd)) score += 1
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1

        if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400', width: 'w-1/4' }
        if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400', width: 'w-2/4' }
        if (score === 3) return { score: 3, label: 'Good', color: 'bg-cyan-500', text: 'text-cyan-400', width: 'w-3/4' }
        return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400', width: 'w-full' }
    }

    const strength = getStrength(password)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        try {
            const result = await resetPasswordWithToken(token, password)
            if (result.error) {
                setError(result.error)
                setLoading(false)
            } else {
                router.push('/login?message=Password reset successfully. Please sign in with your new password.')
            }
        } catch (err: any) {
            setError('An unexpected error occurred. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md relative z-10">
            {/* Background Glows */}
            <div className="absolute top-0 -left-20 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

            {/* Header / Brand */}
            <div className="text-center mb-8">
                <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-2xl shadow-cyan-500/20 mb-4">
                    <ShieldCheck className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">Set New Password</h1>
                <p className="text-slate-400 mt-2 text-sm">
                    {userName ? `Hi ${userName}, choose` : 'Choose'} a secure new password for <span className="text-cyan-400 font-medium">{email}</span>
                </p>
            </div>

            {/* Card Container */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-3xl p-8 relative overflow-hidden">
                {error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs font-medium flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* New Password */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">New Password</label>
                        <div className="relative group">
                            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Min 8 characters..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="block w-full pl-12 pr-11 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-black/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm backdrop-blur-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Password Strength Meter */}
                    {password && (
                        <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <span>Password Strength</span>
                                <span className={strength.text}>{strength.label}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                            </div>
                        </div>
                    )}

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">Confirm Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Repeat new password..."
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="block w-full pl-12 pr-11 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-black/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm backdrop-blur-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/20 active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-3"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Updating Password...</span>
                            </>
                        ) : (
                            <span>Update Password</span>
                        )}
                    </button>

                    <div className="text-center pt-2">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Return to Login
                        </Link>
                    </div>
                </form>
            </div>

            <p className="text-center text-slate-500 text-[10px] mt-6 uppercase tracking-[0.2em] font-medium">
                Enterprise Security &bull; Cryptographic Verification
            </p>
        </div>
    )
}
