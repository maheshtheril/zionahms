'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, User, Clock, Calendar as CalendarIcon, Search } from 'lucide-react'
import { assignStaffToShift } from '@/app/actions/attendance'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function RosterAssignmentDialog({
    open,
    setOpen,
    staffMember,
    date,
    shifts
}: {
    open: boolean,
    setOpen: (o: boolean) => void,
    staffMember: any,
    date: Date | null,
    shifts: any[]
}) {
    const [loading, setLoading] = useState(false)
    const [selectedShift, setSelectedShift] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (!selectedShift || !date || !staffMember) return

        setLoading(true)
        const result = await assignStaffToShift(staffMember.id, selectedShift, date)

        if (result.success) {
            toast.success("Deployment Confirmed", { description: "Roster updated successfully." })
            setOpen(false)
            setSelectedShift(null)
        } else {
            toast.error("Error", { description: result.error as string })
        }
        setLoading(false)
    }

    if (!staffMember || !date) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="glass-card bg-slate-900/95 border-white/10 text-white sm:max-w-[450px] rounded-[2.5rem] backdrop-blur-3xl shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2 text-indigo-400">
                        <User className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Personnel Deployment</span>
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                        Assign Shift
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-8 mt-6">
                    {/* Personnel Insight */}
                    <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10">
                        <Avatar className="h-14 w-14 rounded-2xl ring-2 ring-indigo-500/20">
                            <AvatarImage src={(staffMember.metadata as any)?.avatar_url} />
                            <AvatarFallback className="bg-indigo-600/10 text-indigo-400 font-black text-lg">
                                {staffMember.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-lg font-black text-white leading-tight">{staffMember.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <CalendarIcon className="h-3 w-3 text-slate-500" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(date, 'EEEE, MMMM do')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shift Selection Matrix */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Available Protocols</label>
                        <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {shifts.map(shift => (
                                <button
                                    key={shift.id}
                                    onClick={() => setSelectedShift(shift.id)}
                                    className={`
                                        group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
                                        ${selectedShift === shift.id
                                            ? 'bg-indigo-600/20 border-indigo-500 shadow-lg'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: shift.color || '#6366f1' }}>
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-white">{shift.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">{shift.start_time} — {shift.end_time}</p>
                                        </div>
                                    </div>
                                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedShift === shift.id ? 'border-white bg-white' : 'border-white/20'}`}>
                                        {selectedShift === shift.id && <div className="h-2 w-2 rounded-full bg-indigo-600" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white font-black text-xs tracking-widest rounded-2xl"
                        >
                            ABORT
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !selectedShift}
                            className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/20"
                        >
                            {loading ? 'DEPLOYING...' : 'CONFIRM DEPLOYMENT'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
