import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ResetPasswordForm from './reset-password-form'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>
}) {
    const { token } = await searchParams

    if (!token) {
        redirect('/login')
    }

    const tokenRecord = await prisma.email_verification_tokens.findFirst({
        where: { token: token },
        include: { app_user: true }
    })

    if (!tokenRecord || new Date() > tokenRecord.expires_at) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 text-white font-sans relative overflow-hidden">
                <div className="absolute top-0 -left-20 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px]" />
                <div className="max-w-md w-full p-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl text-center relative z-10">
                    <div className="h-16 w-16 bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-rose-400">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Invalid or Expired Link</h1>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        This password reset link is invalid or has expired. For your security, reset links are only valid for 1 hour.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-all border border-white/10"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Return to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans text-white relative overflow-hidden">
            <ResetPasswordForm token={token} email={tokenRecord.email} userName={tokenRecord.app_user?.name || undefined} />
        </div>
    )
}
