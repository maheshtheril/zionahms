'use client'

import React from 'react'
import { useRealtimeQueue, playChimeSound } from '@/lib/realtime/use-realtime-events'
import { Volume2, Activity, Wifi, WifiOff, Users, Clock, Stethoscope, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function LiveTokenTVDisplay({ hospitalName = 'Outpatient Department' }: { hospitalName?: string }) {
    const { queue, callingToken, isConnected } = useRealtimeQueue()

    const pendingTokens = queue.filter(t => t.status !== 'in-consultation')

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col p-6 sm:p-10 select-none">
            {/* Header */}
            <header className="flex items-center justify-between pb-8 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/30">
                        Z
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                            {hospitalName}
                        </h1>
                        <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mt-0.5">
                            Live Patient Queue & Consultation Display
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={playChimeSound}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-2 transition-all cursor-pointer"
                        title="Test Audio Chime"
                    >
                        <Volume2 className="h-4 w-4 text-indigo-400" />
                        <span className="hidden sm:inline">Test Audio</span>
                    </button>

                    <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                        isConnected 
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400' 
                            : 'bg-rose-950/60 border-rose-800 text-rose-400'
                    }`}>
                        {isConnected ? (
                            <>
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                                <Wifi className="h-3.5 w-3.5" />
                                <span className="uppercase tracking-wider text-[11px]">Real-Time Live</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="h-3.5 w-3.5" />
                                <span className="uppercase tracking-wider text-[11px]">Reconnecting...</span>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Stage Grid */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
                {/* Left Hero Card: Currently Calling Token */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-3">
                            <Activity className="h-4 w-4 animate-pulse" /> Now Calling Consultation
                        </div>

                        <AnimatePresence mode="wait">
                            {callingToken ? (
                                <motion.div
                                    key={callingToken.appointmentId || String(callingToken.tokenNumber)}
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="bg-linear-to-br from-indigo-950/80 via-slate-900 to-slate-900 border-2 border-indigo-500/50 rounded-3xl p-8 sm:p-12 shadow-2xl shadow-indigo-500/10 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                                    <div className="flex items-center justify-between mb-6">
                                        <span className="text-xs font-black uppercase tracking-widest bg-indigo-600 text-white px-3.5 py-1.5 rounded-full">
                                            PLEASE PROCEED TO
                                        </span>
                                        <div className="text-indigo-400 font-mono text-2xl font-black bg-indigo-950/80 px-4 py-1.5 rounded-xl border border-indigo-800">
                                            {callingToken.roomNumber || 'ROOM 1'}
                                        </div>
                                    </div>

                                    {/* Gigantic Token Number */}
                                    <div className="text-center py-6">
                                        <span className="text-slate-400 text-sm font-bold uppercase tracking-widest block mb-2">TOKEN NUMBER</span>
                                        <div className="text-8xl sm:text-9xl font-black tracking-tight text-white drop-shadow-md">
                                            #{callingToken.tokenNumber}
                                        </div>
                                    </div>

                                    {/* Patient & Doctor Banner */}
                                    <div className="mt-8 pt-8 border-t border-slate-800/80 grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Patient</span>
                                            <div className="text-xl sm:text-2xl font-black text-slate-100 truncate mt-0.5">
                                                {callingToken.patientName}
                                            </div>
                                            {callingToken.patientMrn && (
                                                <span className="text-xs text-slate-400 font-mono">MRN: {callingToken.patientMrn}</span>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Doctor</span>
                                            <div className="text-xl sm:text-2xl font-bold text-indigo-300 truncate mt-0.5 flex items-center justify-end gap-1.5">
                                                <Stethoscope className="h-5 w-5 text-indigo-400 shrink-0" />
                                                <span>{callingToken.doctorName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center text-slate-500">
                                    <Clock className="h-16 w-16 mx-auto mb-4 text-slate-700" />
                                    <h3 className="text-xl font-bold uppercase tracking-wide text-slate-400">Waiting for Next Call</h3>
                                    <p className="text-xs text-slate-500 mt-2">Doctor will call the next patient shortly.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-8 flex items-center justify-between text-xs text-slate-500 border-t border-slate-900 pt-4">
                        <span>Please have your appointment slip and registration card ready.</span>
                        <span className="font-mono">{new Date().toLocaleTimeString()}</span>
                    </div>
                </div>

                {/* Right Side: Upcoming Token Queue */}
                <div className="lg:col-span-5 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                            <Users className="h-4 w-4" /> Next In Queue ({pendingTokens.length})
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">Auto-advancing live</span>
                    </div>

                    <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-3xl p-4 overflow-y-auto space-y-3 max-h-[640px]">
                        {pendingTokens.length === 0 ? (
                            <div className="text-center py-20 text-slate-600">
                                <span className="text-sm font-bold uppercase tracking-widest">No pending queue</span>
                                <p className="text-xs text-slate-600 mt-1">All scheduled patients have been attended.</p>
                            </div>
                        ) : (
                            pendingTokens.map((t, idx) => (
                                <div 
                                    key={t.appointmentId || idx}
                                    className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center font-black text-lg text-indigo-400 border border-slate-700">
                                            #{t.tokenNumber}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-slate-200">
                                                {t.patientName}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                {t.doctorName}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 font-medium bg-slate-800 px-2.5 py-1 rounded-lg">
                                            Waiting
                                        </span>
                                        <ArrowRight className="h-4 w-4 text-slate-600" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
