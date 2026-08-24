'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Clock, Palette } from 'lucide-react'
import { createShift } from '@/app/actions/attendance'
import { toast } from 'sonner'

const PRESET_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function ShiftDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('17:00')
    const [color, setColor] = useState(PRESET_COLORS[0])
    const [workDays, setWorkDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])

    const handleSubmit = async () => {
        if (!name) {
            toast.error("Missing Data", { description: "Please name the protocol." })
            return
        }

        setLoading(true)
        const result = await createShift({
            name,
            start_time: startTime,
            end_time: endTime,
            color,
            work_days: workDays
        })

        if (result.success) {
            toast.success("Protocol Established", { description: "Shift created successfully." })
            setOpen(false)
            // Reset
            setName('')
        } else {
            toast.error("Error", { description: result.error as string })
        }
        setLoading(false)
    }

    const toggleDay = (day: string) => {
        setWorkDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 rounded-2xl h-12 px-6 font-black text-xs tracking-widest">
                    <Plus className="h-4 w-4 mr-2" />
                    INITIALIZE PROTOCOL
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-card bg-slate-900/90 border-white/10 text-white sm:max-w-[500px] rounded-[2.5rem] backdrop-blur-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                            <Clock className="h-4 w-4 text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Operation Definition</span>
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tight">Shift Protocol</DialogTitle>
                </DialogHeader>

                <div className="space-y-8 mt-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Protocol Identity</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Night Shift, Emergency Unit B"
                            className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-indigo-500/50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Start Time</Label>
                            <Input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="h-12 bg-white/5 border-white/10 rounded-xl text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">End Time</Label>
                            <Input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="h-12 bg-white/5 border-white/10 rounded-xl text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Shift Spectrum (Color Index)</Label>
                        <div className="flex gap-2 flex-wrap">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`h-8 w-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Frequency Control</Label>
                        <div className="flex gap-2 flex-wrap">
                            {DAYS.map(day => (
                                <button
                                    key={day}
                                    onClick={() => toggleDay(day)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${workDays.includes(day) ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                                >
                                    {day.slice(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 font-black text-xs tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/20"
                        >
                            {loading ? 'SYNCHRONIZING...' : 'ACTIVATE PROTOCOL'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
