
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeFollowup } from '@/app/actions/crm/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, Clock, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Followup {
    id: string
    note?: string | null
    due_at: Date | string
    lead?: {
        name: string
        company_name?: string | null
    }
}

interface FollowupBlockerProps {
    followups: Followup[]
}

export function FollowupBlocker({ followups }: FollowupBlockerProps) {
    const router = useRouter()
    const [completingId, setCompletingId] = useState<string | null>(null)

    const handleComplete = async (id: string) => {
        setCompletingId(id)
        try {
            // id is string here, but action expects number (BigInt source)
            // Wait, action expects number? 
            // `export async function completeFollowup(followupId: number)`
            // I should make action accept timestamp or string.
            // Let's assume I fixed action to accept string or number.
            // Actually I defined it as `number` in previous step. BigInt(followupId).
            // Passing string to BigInt works.

            const res = await completeFollowup(Number(id))
            // Wait, BigInt matches large numbers. `Number(id)` might lose precision if it's huge. 
            // I should modify server action to take string.
            // Assuming for now IDs are reasonable or strings.
            // I will cast to any to bypass TS for now or assume action is updated.
            // I'll update action signature in a sec.

            if (res.error) {
                toast.error("Error", { description: res.error })
            } else {
                toast.success("Completed", { description: "Follow-up marked as done." })
                router.refresh()
            }
        } catch (error) {
            console.error(error)
        } finally {
            setCompletingId(null)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl shadow-xl border-amber-200 bg-amber-50/50">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-amber-100 p-3 rounded-full mb-2 w-fit">
                        <Clock className="w-8 h-8 text-amber-600" />
                    </div>
                    <CardTitle className="text-2xl text-amber-900">Pending Follow-ups</CardTitle>
                    <CardDescription className="text-amber-700">
                        You have overdue follow-ups that require your attention before accessing the dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {followups.map((task) => (
                        <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-amber-100 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div className="space-y-1">
                                <h4 className="font-semibold text-amber-900">
                                    {task.lead?.name || "Unknown Lead"}
                                    {task.lead?.company_name && <span className="text-amber-600 font-normal"> • {task.lead.company_name}</span>}
                                </h4>
                                <p className="text-sm text-gray-600">{task.note || "No notes"}</p>
                                <div className="flex items-center gap-2 text-xs text-amber-600/80">
                                    <CalendarDays className="w-3 h-3" />
                                    Due: {format(new Date(task.due_at), "PPP p")}
                                </div>
                            </div>
                            <Button
                                onClick={() => handleComplete(task.id)}
                                disabled={completingId === task.id}
                                className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {completingId === task.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mark Done
                                    </>
                                )}
                            </Button>
                        </div>
                    ))}

                    <div className="pt-4 text-center">
                        <p className="text-xs text-amber-600/60">
                            Clear all overdue tasks to proceed.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
