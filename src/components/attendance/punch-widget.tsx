'use client'

import React, { useState, useEffect } from 'react'
import {
    Clock,
    MapPin,
    Activity,
    Power,
    PowerOff,
    Info,
    Timer,
    Calendar,
    Target
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { punchIn, punchOut, getStaffAttendanceStatus } from '@/app/actions/attendance'
import { format } from 'date-fns'

export default function PunchWidget() {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [attendance, setAttendance] = useState<any>(null)
    const [roster, setRoster] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)

    // Tick the clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Fetch current status
    useEffect(() => {
        const fetchStatus = async () => {
            const data = await getStaffAttendanceStatus()
            if (data) {
                setAttendance(data.attendance)
                setRoster(data.roster)
            }
            setLoading(false)
        }
        fetchStatus()

        // Try to get location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            }, (err) => console.warn("Location denied", err))
        }
    }, [])

    const handlePunch = async () => {
        setActionLoading(true)
        const isPunchingIn = !attendance || attendance.check_out

        try {
            if (isPunchingIn) {
                const result = await punchIn({
                    lat: location?.lat,
                    lng: location?.lng,
                    userAgent: navigator.userAgent
                })
                if (result.success) {
                    setAttendance(result.data)
                    toast.success("Mission Started", { description: "Shift initialized successfully." })
                } else {
                    toast.error("Failure", { description: result.error as string })
                }
            } else {
                const result = await punchOut(attendance.id, {
                    lat: location?.lat,
                    lng: location?.lng
                })
                if (result.success) {
                    setAttendance(result.data)
                    toast.success("Shift Concluded", { description: "Data synchronized to global roster." })
                } else {
                    toast.error("Failure", { description: result.error as string })
                }
            }
        } catch (e) {
            toast.error("Neutralized", { description: "Operation failed." })
        } finally {
            setActionLoading(false)
        }
    }

    if (loading) return null

    const isActive = attendance && !attendance.check_out

    return (
        <Card className="glass-card bg-card/50 dark:bg-slate-900/60 border-border backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
            {/* Animated Glow Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-1000 ${isActive ? 'from-emerald-500/10 to-transparent opacity-100' : 'from-indigo-500/10 to-transparent opacity-50'}`} />

            <div className="p-8 relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className={`h-4 w-4 ${isActive ? 'text-emerald-500 animate-pulse' : 'text-muted-foreground'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tactical Status</span>
                        </div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                            {isActive ? 'Active Duty' : 'Off Grid'}
                            <Badge variant="outline" className={`border-none ${isActive ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                                {isActive ? 'ONLINE' : 'STBY'}
                            </Badge>
                        </h2>
                    </div>

                    <div className="text-right">
                        <div className="text-3xl font-mono text-foreground tracking-widest leading-none mb-1">
                            {format(currentTime, 'HH:mm:ss')}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">
                            {format(currentTime, 'EEEE, MMM do')}
                        </div>
                    </div>
                </div>

                {/* Main Action Orbit */}
                <div className="flex justify-center mb-10 relative">
                    {/* Ring Animations */}
                    <div className={`absolute inset-0 rounded-full border border-dashed transition-all duration-1000 ${isActive ? 'border-emerald-500/30 animate-[spin_10s_linear_infinite]' : 'border-slate-300 dark:border-slate-700'}`} />

                    <Button
                        onClick={handlePunch}
                        disabled={actionLoading}
                        className={`
                            h-32 w-32 rounded-full relative z-20 shadow-2xl transition-all duration-500 active:scale-90
                            ${isActive
                                ? 'bg-gradient-to-br from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 shadow-red-500/20'
                                : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/20'}
                        `}
                    >
                        <div className="flex flex-col items-center gap-1">
                            {isActive ? <PowerOff className="h-8 w-8 text-white" /> : <Power className="h-8 w-8 text-white" />}
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">{isActive ? 'TERMINATE' : 'INITIALIZE'}</span>
                        </div>
                    </Button>
                </div>

                {/* Shift Intelligence Bridge */}
                {roster?.shift && (
                    <div className="mb-8 p-4 bg-muted/30 border border-border rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{
                                backgroundColor: `${roster.shift.color || '#6366f1'}20`,
                                color: roster.shift.color || '#6366f1'
                            }}>
                                <Target className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Authorized Shift</p>
                                <p className="text-xs font-bold text-foreground">{roster.shift.name}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Protocol</p>
                            <p className="text-xs font-mono font-bold text-indigo-500">{roster.shift.start_time} - {roster.shift.end_time}</p>
                        </div>
                    </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 border border-border rounded-2xl p-4 transition-all hover:bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Timer className="h-3 w-3 text-indigo-500" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Telemetry</span>
                        </div>
                        <p className="text-sm font-bold text-foreground leading-none">
                            {isActive ? 'Duty Active' : 'Off Grid'}
                        </p>
                    </div>

                    <div className="bg-muted/30 border border-border rounded-2xl p-4 transition-all hover:bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-3 w-3 text-purple-500" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Geolocation</span>
                        </div>
                        <p className="text-[10px] font-medium text-foreground truncate max-w-[100px]">
                            {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Link Awaiting'}
                        </p>
                    </div>
                </div>

                {/* System Notifications/Telemetry */}
                <div className="mt-8 flex items-center justify-between border-t border-border pt-6 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-400'}`} />
                        Biometric Link: UP
                    </div>
                    <div className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        SYS-OP-PLATFORM-v2.1
                    </div>
                </div>
            </div>
        </Card>
    )
}
