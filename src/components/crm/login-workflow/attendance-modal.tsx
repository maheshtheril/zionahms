
'use client'

import { useState, useEffect } from 'react'
import { markAttendance } from '@/app/actions/crm/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, MapPin, CheckCircle2, Clock, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'

interface AttendanceModalProps {
    onSuccess: () => void
}

export function AttendanceModal({ onSuccess }: AttendanceModalProps) {
    const [loading, setLoading] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [status, setStatus] = useState<'idle' | 'locating' | 'marking' | 'success'>('idle')

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const handleMarkAttendance = async () => {
        setLoading(true)
        setStatus('locating')

        try {
            // Optional: Get location
            let lat, lng;
            if (navigator.geolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
                    })
                    lat = position.coords.latitude
                    lng = position.coords.longitude
                } catch (e) {
                    console.log("Location access denied or timed out", e)
                }
            }

            setStatus('marking')
            const res = await markAttendance(lat, lng)

            if (res.error) {
                setStatus('idle')
                toast.error("Attendance Failed", { description: res.error })
            } else {
                setStatus('success')
                toast.success("Success", { description: "Your attendance has been marked for today." })
                // Small delay to show success state before closing
                setTimeout(onSuccess, 1500)
            }
        } catch (error) {
            console.error(error)
            setStatus('idle')
            toast.error("Error", { description: "Something went wrong. Please try again." })
        } finally {
            if (status !== 'success') {
                setLoading(false)
            }
        }
    }

    const timeString = format(currentTime, 'h:mm a')
    const dateString = format(currentTime, 'EEEE, MMMM do, yyyy')

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all duration-500">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-sm"
                >
                    <Card className="border-0 shadow-2xl overflow-hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl ring-1 ring-white/20 dark:ring-white/10">
                        {/* Header Section with Gradient */}
                        <div className="relative h-40 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 flex flex-col items-center justify-center text-white overflow-hidden">
                            {/* Noise Texture */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-soft-light"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="z-10 text-center relative"
                            >
                                <h2 className="text-4xl font-mono font-bold tracking-tighter drop-shadow-sm">{timeString}</h2>
                                <p className="text-indigo-100 text-sm font-medium mt-2 uppercase tracking-widest opacity-90">{dateString}</p>
                            </motion.div>
                        </div>

                        <CardContent className="flex flex-col items-center gap-6 pt-8 pb-8 px-8">

                            <div className="text-center space-y-3">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    Good Morning!
                                </h3>
                                <p className="text-base text-gray-500 dark:text-gray-400 max-w-[240px] mx-auto leading-relaxed">
                                    Ready to start your day? <br /> Mark your attendance to clock in.
                                </p>
                            </div>

                            <div className="w-full space-y-4">
                                <Button
                                    size="lg"
                                    className={`w-full h-16 text-lg font-bold shadow-xl transition-all duration-300 rounded-xl
                                        ${status === 'success'
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
                                            : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white hover:scale-[1.02] active:scale-[0.98] shadow-indigo-500/25'
                                        }
                                    `}
                                    onClick={handleMarkAttendance}
                                    disabled={loading || status === 'success'}
                                >
                                    {status === 'locating' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-3"
                                        >
                                            <MapPin className="h-6 w-6 animate-bounce" />
                                            <span>Locating...</span>
                                        </motion.div>
                                    )}

                                    {status === 'marking' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex items-center gap-3"
                                        >
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                            <span>Clocking In...</span>
                                        </motion.div>
                                    )}

                                    {status === 'success' && (
                                        <motion.div
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="flex items-center gap-3"
                                        >
                                            <CheckCircle2 className="h-6 w-6" />
                                            <span>Checked In</span>
                                        </motion.div>
                                    )}

                                    {status === 'idle' && (
                                        <span className="flex items-center gap-3">
                                            <Clock className="w-6 h-6" />
                                            Mark Attendance
                                        </span>
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 py-3 px-4 rounded-xl border border-gray-100 dark:border-white/5">
                                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>Location check required for compliance</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
