'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import {
    Clock,
    Plus,
    X,
    Calendar as CalendarIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RosterAssignmentDialog } from './roster-assignment-dialog'
import { removeStaffFromShift } from '@/app/actions/attendance'
import { toast } from 'sonner'

export default function RosterGrid({
    staff,
    shifts,
    roster,
    days
}: {
    staff: any[],
    shifts: any[],
    roster: any[],
    days: Date[]
}) {
    const [assignmentOpen, setAssignmentOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<any>(null)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const handleAssign = (person: any, day: Date) => {
        setSelectedStaff(person)
        setSelectedDate(day)
        setAssignmentOpen(true)
    }

    const handleRetract = async (rosterId: string) => {
        if (!confirm("Retract this deployment?")) return
        const result = await removeStaffFromShift(rosterId)
        if (result.success) {
            toast.success("Deployment Retracted", { description: "Personnel removed from roster." })
        } else {
            toast.error("Error", { description: result.error as string })
        }
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="p-6 text-left border-r border-border bg-muted/50 sticky left-0 z-20 min-w-[250px]">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Medical Personnel</span>
                        </th>
                        {days.map(day => (
                            <th key={day.toString()} className="p-6 text-center border-r border-border min-w-[150px]">
                                <div className="mb-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{format(day, 'EEE')}</div>
                                <div className={`text-xl font-black ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'text-indigo-500' : 'text-foreground'}`}>
                                    {format(day, 'dd')}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {staff.map(person => (
                        <tr key={person.id} className="group border-b border-border hover:bg-muted/30 transition-colors">
                            <td className="p-6 border-r border-border bg-card/90 backdrop-blur-xl sticky left-0 z-10">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-border rounded-xl ring-2 ring-indigo-500/20">
                                        <AvatarImage src={(person.metadata as any)?.avatar_url} />
                                        <AvatarFallback className="bg-indigo-500/10 text-indigo-500 font-black">{person.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-black text-foreground leading-tight">{person.name}</p>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider truncate max-w-[120px]">{person.email}</p>
                                    </div>
                                </div>
                            </td>

                            {days.map(day => {
                                const assignment = roster.find(r =>
                                    r.user_id === person.id &&
                                    format(new Date(r.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                                );
                                const shift = assignment ? shifts.find(s => s.id === assignment.shift_id) : null;

                                return (
                                    <td key={day.toString()} className="px-3 py-4 border-r border-border align-top">
                                        {shift ? (
                                            <div
                                                className="p-3 rounded-2xl border transition-all duration-300 transform group-hover:translate-z-10 shadow-lg relative overflow-hidden group/shift"
                                                style={{
                                                    backgroundColor: `${shift.color || '#6366f1'}20`,
                                                    borderColor: `${shift.color || '#6366f1'}50`,
                                                    color: shift.color || '#fff'
                                                }}
                                            >
                                                <button
                                                    onClick={() => handleRetract(assignment!.id)}
                                                    className="absolute top-1 right-1 p-1 opacity-0 group-hover/shift:opacity-100 hover:text-red-400 transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                                <div className="absolute top-0 left-0 p-1 opacity-10">
                                                    <Clock className="h-4 w-4" />
                                                </div>
                                                <p className="text-[9px] font-black uppercase tracking-widest mb-1 truncate pr-4">{shift.name}</p>
                                                <p className="text-[10px] font-bold opacity-80">{shift.start_time} - {shift.end_time}</p>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAssign(person, day)}
                                                className="w-full h-16 rounded-2xl border border-dashed border-border hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all flex items-center justify-center group/btn"
                                            >
                                                <Plus className="h-4 w-4 text-muted-foreground group-hover/btn:text-indigo-500 transition-colors" />
                                            </button>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            <RosterAssignmentDialog
                open={assignmentOpen}
                setOpen={setAssignmentOpen}
                staffMember={selectedStaff}
                date={selectedDate}
                shifts={shifts}
            />
        </div>
    )
}
