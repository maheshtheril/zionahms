'use client'

import { useState } from 'react'
import { updateLeaveStatus } from '@/app/actions/leave'
import { Check, X, Loader2 } from 'lucide-react'

export function LeaveActionButtons({ leaveId }: { leaveId: string }) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleAction(status: string) {
        setIsLoading(true)
        try {
            await updateLeaveStatus(leaveId, status)
        } catch (error) {
            console.error(error)
            alert("Failed to update status")
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground inline-block" />
    }

    return (
        <div className="flex items-center justify-end gap-2">
            <button 
                onClick={() => handleAction('approved')}
                className="p-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-lg transition-colors"
                title="Approve"
            >
                <Check className="w-4 h-4" />
            </button>
            <button 
                onClick={() => handleAction('rejected')}
                className="p-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Reject"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}
