'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X, Settings } from 'lucide-react'
import Link from 'next/link'

interface AccountingWarningBannerProps {
    companyId?: string
}

export function AccountingWarningBanner({ companyId }: AccountingWarningBannerProps) {
    const [missing, setMissing] = useState<string[]>([])
    const [dismissed, setDismissed] = useState(false)
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        async function check() {
            try {
                const res = await fetch('/api/accounting/check-settings')
                if (res.ok) {
                    const data = await res.json()
                    setMissing(data.missing || [])
                }
            } catch (e) {
                // Silently fail — don't block forms on banner errors
            } finally {
                setChecked(true)
            }
        }
        check()
    }, [])

    if (!checked || missing.length === 0 || dismissed) return null

    return (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl px-4 py-3 mb-4 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
                <p className="font-bold text-amber-800 dark:text-amber-300">Accounting Not Fully Configured</p>
                <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                    The following accounts are not mapped: <strong>{missing.join(', ')}</strong>.
                    Transactions may not post correctly to your books.
                </p>
                <Link
                    href="/settings/accounting"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline"
                >
                    <Settings className="h-3 w-3" />
                    Go to Accounting Settings →
                </Link>
            </div>
            <button
                onClick={() => setDismissed(true)}
                className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 shrink-0"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}
