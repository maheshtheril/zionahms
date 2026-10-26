'use client'

import React, { useState, useEffect } from 'react'
import {
    Activity, AlertCircle, Bed, Check, CheckCircle2, ChevronRight,
    Clock, Heart, LogOut, Mic, MicOff, Phone, Pill, Play,
    Plus, RotateCcw, Search, ShieldCheck, Stethoscope, User, Users,
    Volume2, X
} from 'lucide-react'

type TabType = 'queue' | 'consult' | 'rounds'

export default function DoctorCockpitApp() {
    // Auth State
    const [token, setToken] = useState<string | null>(null)
    const [doctor, setDoctor] = useState<any>(null)
    const [emailInput, setEmailInput] = useState('doctor@hospital.com')
    const [passwordInput, setPasswordInput] = useState('password123')
    const [authLoading, setAuthLoading] = useState(false)
    const [authError, setAuthError] = useState('')

    // Navigation Tab
    const [activeTab, setActiveTab] = useState<TabType>('queue')

    // Live Queue State
    const [queueData, setQueueData] = useState<any>({ queue: [], waitingCount: 0, inConsultationCount: 0, completedCount: 0 })
    const [selectedPatient, setSelectedPatient] = useState<any>(null)
    const [queueLoading, setQueueLoading] = useState(false)

    // Ambient AI Scribe State
    const [isRecording, setIsRecording] = useState(false)
    const [voiceTranscript, setVoiceTranscript] = useState('')
    const [isParsingVoice, setIsParsingVoice] = useState(false)
    const [encounterDraft, setEncounterDraft] = useState<any>(null)
    const [finalizeLoading, setFinalizeLoading] = useState(false)
    const [finalizeSuccess, setFinalizeSuccess] = useState(false)

    // Inpatient Rounds State
    const [inpatientRounds, setInpatientRounds] = useState<any[]>([])
    const [roundsLoading, setRoundsLoading] = useState(false)

    // Restore Auth
    useEffect(() => {
        const savedToken = localStorage.getItem('hms_doctor_mobile_jwt')
        const savedDoctor = localStorage.getItem('hms_doctor_profile')
        if (savedToken && savedDoctor) {
            try {
                setToken(savedToken)
                setDoctor(JSON.parse(savedDoctor))
            } catch (e) {
                console.error(e)
            }
        }
    }, [])

    // Polling Queue when token exists
    useEffect(() => {
        if (!token) return
        fetchQueue()
        fetchRounds()

        const interval = setInterval(fetchQueue, 15000)
        return () => clearInterval(interval)
    }, [token])

    // 1. Doctor Login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setAuthLoading(true)
        setAuthError('')

        try {
            const res = await fetch('/api/v1/mobile/auth/doctor-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput, password: passwordInput })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Authentication failed')

            const jwt = data.data.token
            const profile = data.data.doctor

            setToken(jwt)
            setDoctor(profile)
            localStorage.setItem('hms_doctor_mobile_jwt', jwt)
            localStorage.setItem('hms_doctor_profile', JSON.stringify(profile))
        } catch (err: any) {
            setAuthError(err.message)
        } finally {
            setAuthLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('hms_doctor_mobile_jwt')
        localStorage.removeItem('hms_doctor_profile')
        setToken(null)
        setDoctor(null)
        setActiveTab('queue')
    }

    // 2. Fetch Live Queue
    const fetchQueue = async () => {
        if (!token) return
        try {
            setQueueLoading(true)
            const res = await fetch('/api/v1/mobile/doctor/queue', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) setQueueData(data.data || { queue: [] })
        } catch (err) {
            console.error('Queue poll error:', err)
        } finally {
            setQueueLoading(false)
        }
    }

    // 3. Fetch Inpatient Rounds
    const fetchRounds = async () => {
        if (!token) return
        try {
            setRoundsLoading(true)
            const res = await fetch('/api/v1/mobile/doctor/inpatient-rounds', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) setInpatientRounds(data.data || [])
        } catch (err) {
            console.error('Rounds fetch error:', err)
        } finally {
            setRoundsLoading(false)
        }
    }

    // 4. Update Queue Status (Call Patient / Mark Complete)
    const updateQueueStatus = async (appointmentId: string, status: string) => {
        try {
            const res = await fetch('/api/v1/mobile/doctor/queue', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ appointmentId, status })
            })
            if (res.ok) fetchQueue()
        } catch (err) {
            console.error('Status update error:', err)
        }
    }

    // 5. Select Patient to Consult
    const handleStartConsultation = (item: any) => {
        setSelectedPatient(item)
        setActiveTab('consult')
        updateQueueStatus(item.appointmentId, 'in-consultation')
        setEncounterDraft(null)
        setFinalizeSuccess(false)
        setVoiceTranscript('')
    }

    // 6. Ambient AI Voice Dictation Parser
    const handleParseVoice = async (customText?: string) => {
        const textToParse = customText || voiceTranscript
        if (!textToParse || textToParse.trim().length < 5) return

        setIsParsingVoice(true)
        try {
            const res = await fetch('/api/v1/mobile/doctor/voice-scribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    transcript: textToParse,
                    patientId: selectedPatient?.patient?.id
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Parsing failed')
            setEncounterDraft(data.data)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setIsParsingVoice(false)
        }
    }

    // 7. Finalize & Sign Clinical Encounter
    const handleFinalizeConsultation = async () => {
        if (!selectedPatient || !encounterDraft) return
        setFinalizeLoading(true)

        try {
            const res = await fetch('/api/v1/mobile/doctor/consultation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    appointmentId: selectedPatient.appointmentId,
                    patientId: selectedPatient.patient.id,
                    complaints: encounterDraft.clinicalObservation?.chiefComplaints,
                    diagnosis: encounterDraft.clinicalObservation?.clinicalImpression,
                    plan: encounterDraft.clinicalObservation?.lifestyleAdvice,
                    medications: encounterDraft.proposedMedications,
                    labTests: encounterDraft.proposedLabInvestigations
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to finalize consultation')

            setFinalizeSuccess(true)
            fetchQueue()
            setTimeout(() => {
                setActiveTab('queue')
                setSelectedPatient(null)
                setEncounterDraft(null)
            }, 1800)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setFinalizeLoading(false)
        }
    }

    // Sample Clinical Voice Dictation helper for 1-click testing
    const insertSampleDictation = (text: string) => {
        setVoiceTranscript(text)
        handleParseVoice(text)
    }

    // ==========================================
    // SCREEN 1: DOCTOR AUTHENTICATION
    // ==========================================
    if (!token) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
                            <Stethoscope className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white">Ziona Clinician Cockpit</h1>
                        <p className="text-xs text-slate-400 mt-1">2050 Intelligent Doctor Mobile Station</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {authError && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{authError}</span>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Doctor Email Address</label>
                            <input
                                type="email"
                                required
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl font-bold text-sm text-slate-950 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {authLoading ? 'Verifying Clinician...' : 'Unlock Clinician Cockpit'}
                        </button>
                    </form>

                    <div className="mt-5 pt-3 border-t border-slate-800 text-center">
                        <span className="text-[11px] text-slate-500">Biometric & JWT Hardware Enclave Bound</span>
                    </div>
                </div>
            </div>
        )
    }

    // ==========================================
    // SCREEN 2: MAIN CLINICIAN APPLICATION
    // ==========================================
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-emerald-500/20">
            <div className="w-full max-w-md bg-slate-900 border-x border-slate-800 min-h-screen flex flex-col pb-20 shadow-2xl relative">

                {/* Top Clinician Header */}
                <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20">
                            {doctor?.name?.[0] || 'D'}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white leading-none">{doctor?.name || 'Dr. Clinician'}</div>
                            <div className="text-[11px] text-emerald-400 font-medium mt-0.5">{doctor?.specialization || 'Consultant'}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                            ACTIVE
                        </span>
                        <button
                            onClick={handleLogout}
                            title="Sign out"
                            className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Main Content Router */}
                <main className="flex-1 p-4 space-y-4 overflow-y-auto">

                    {/* ============================================================ */}
                    {/* TAB 1: TODAY'S LIVE QUEUE RADAR                              */}
                    {/* ============================================================ */}
                    {activeTab === 'queue' && (
                        <div className="space-y-4">
                            {/* Queue Metrics Bar */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center">
                                    <div className="text-[10px] text-slate-400 uppercase">Waiting</div>
                                    <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">{queueData.waitingCount}</div>
                                </div>
                                <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-2.5 text-center">
                                    <div className="text-[10px] text-emerald-400 uppercase">In Room</div>
                                    <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{queueData.inConsultationCount}</div>
                                </div>
                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center">
                                    <div className="text-[10px] text-slate-400 uppercase">Completed</div>
                                    <div className="text-xl font-bold text-slate-400 font-mono mt-0.5">{queueData.completedCount}</div>
                                </div>
                            </div>

                            {/* Live Patient Cards */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's OPD Queue</h2>
                                    <button onClick={fetchQueue} className="text-xs text-emerald-400 hover:underline">
                                        Refresh
                                    </button>
                                </div>

                                {queueData.queue.length === 0 ? (
                                    <div className="text-center py-12 text-xs text-slate-500">
                                        No patients scheduled in today's OPD queue.
                                    </div>
                                ) : (
                                    queueData.queue.map((item: any) => (
                                        <div
                                            key={item.appointmentId}
                                            className={`p-3.5 rounded-2xl border transition-all ${item.status === 'in-consultation'
                                                ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                                                : item.status === 'completed'
                                                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                                                    : 'bg-slate-900 border-slate-800'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-sm text-cyan-400">
                                                        #{item.tokenNumber}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                                            <span>{item.patient?.name || 'Walk-in Patient'}</span>
                                                            <span className="text-[10px] text-slate-400 font-normal">({item.patient?.gender?.[0]?.toUpperCase() || 'M'})</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                            {item.patient?.mrn || 'MRN-NEW'} • {item.reason || 'General Checkup'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${item.status === 'in-consultation'
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                    : item.status === 'completed'
                                                        ? 'bg-slate-800 text-slate-400'
                                                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </div>

                                            {/* Patient Vitals Pill */}
                                            {item.patient?.latestVitals && (
                                                <div className="bg-slate-950/70 rounded-xl p-2 mb-3 border border-slate-800 flex items-center justify-around text-[10px] font-mono">
                                                    <span className="text-slate-300">BP: <strong className="text-white">{item.patient.latestVitals.bp || '--'}</strong></span>
                                                    <span className="text-slate-300">Pulse: <strong className="text-cyan-400">{item.patient.latestVitals.pulse || '--'}</strong></span>
                                                    <span className="text-slate-300">SpO2: <strong className="text-emerald-400">{item.patient.latestVitals.spo2 ? `${item.patient.latestVitals.spo2}%` : '--'}</strong></span>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2">
                                                {item.status !== 'completed' && (
                                                    <button
                                                        onClick={() => handleStartConsultation(item)}
                                                        className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                                                    >
                                                        <Play className="w-3.5 h-3.5 fill-current" />
                                                        <span>{item.status === 'in-consultation' ? 'Resume Consultation' : 'Call Patient In'}</span>
                                                    </button>
                                                )}

                                                {item.status === 'in-consultation' && (
                                                    <button
                                                        onClick={() => updateQueueStatus(item.appointmentId, 'completed')}
                                                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-semibold"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* TAB 2: AMBIENT AI VOICE SCRIBE & CONSULTATION PAD           */}
                    {/* ============================================================ */}
                    {activeTab === 'consult' && (
                        <div className="space-y-4">
                            {/* Active Patient Bar */}
                            {selectedPatient ? (
                                <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] text-emerald-400 font-semibold uppercase">Currently In Consultation</div>
                                        <div className="text-sm font-bold text-white mt-0.5">
                                            #{selectedPatient.tokenNumber} {selectedPatient.patient?.name}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                            MRN: {selectedPatient.patient?.mrn} • Blood: {selectedPatient.patient?.bloodGroup || 'O+'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedPatient(null)}
                                        className="text-slate-400 hover:text-white p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                                    <p className="text-xs text-slate-400">Select a patient from Today's Queue to begin consultation.</p>
                                    <button
                                        onClick={() => setActiveTab('queue')}
                                        className="mt-2 text-xs text-emerald-400 font-semibold hover:underline"
                                    >
                                        Go to Queue
                                    </button>
                                </div>
                            )}

                            {/* Voice Dictation Recorder */}
                            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Volume2 className="w-4 h-4 text-emerald-400" />
                                        <span className="text-xs font-bold text-white">Ambient Voice Dictation</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">Gemini Neural Scribe</span>
                                </div>

                                <textarea
                                    rows={3}
                                    placeholder="Doctor dictation: 'Patient has 3 days of high fever and productive cough. Diagnosis is Acute Bronchitis. Prescribe Amoxicillin 500mg TDS for 5 days...'"
                                    value={voiceTranscript}
                                    onChange={(e) => setVoiceTranscript(e.target.value)}
                                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                />

                                {/* One-Click Simulation Dictation Samples */}
                                <div>
                                    <div className="text-[10px] text-slate-400 mb-1">Fast 1-Click Dictation Samples:</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            onClick={() => insertSampleDictation("Patient has severe headache, fever for 2 days. Diagnosis: Acute Viral Syndrome. Prescribe Paracetamol 650mg TDS for 3 days and Cetirizine 10mg at night. Advise complete bed rest.")}
                                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:border-emerald-500"
                                        >
                                            Viral Fever
                                        </button>
                                        <button
                                            onClick={() => insertSampleDictation("Patient reports acute epigastric burning after meals. Diagnosis: GERD. Prescribe Pantoprazole 40mg before breakfast for 14 days and Antacid Gel 10ml after food.")}
                                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:border-emerald-500"
                                        >
                                            GERD / Acidity
                                        </button>
                                        <button
                                            onClick={() => insertSampleDictation("Productive cough, sore throat, wheezing. Diagnosis: Acute Bronchitis. Prescribe Azithromycin 500mg OD for 3 days and Cough Syrup 5ml TDS. Order CBC and Chest X-ray.")}
                                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:border-emerald-500"
                                        >
                                            Bronchitis
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleParseVoice()}
                                    disabled={isParsingVoice || !voiceTranscript.trim()}
                                    className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <Mic className="w-4 h-4" />
                                    <span>{isParsingVoice ? 'AI Analyzing Clinical Dictation...' : 'Parse Voice Into Structured Prescription'}</span>
                                </button>
                            </div>

                            {/* Structured Clinical Encounter Preview */}
                            {encounterDraft && (
                                <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            <span>Structured Encounter Draft</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono">FHIR R5</span>
                                    </div>

                                    {/* Diagnosis */}
                                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                                        <div className="text-[10px] text-emerald-400 uppercase font-semibold">Clinical Impression / Diagnosis</div>
                                        <div className="text-xs font-bold text-white mt-0.5">
                                            {encounterDraft.clinicalObservation?.clinicalImpression || 'Clinical evaluation'}
                                        </div>
                                    </div>

                                    {/* Prescriptions */}
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5">Prescribed Medicines</div>
                                        <div className="space-y-1.5">
                                            {encounterDraft.proposedMedications?.map((m: any, idx: number) => (
                                                <div key={idx} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                                                    <div>
                                                        <div className="text-xs font-bold text-white flex items-center gap-1">
                                                            <Pill className="w-3.5 h-3.5 text-cyan-400" />
                                                            <span>{m.name}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                                            {m.frequency} • {m.duration} • {m.instructions}
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                                                        {m.dosage}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Finalize Button */}
                                    {finalizeSuccess ? (
                                        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
                                            <Check className="w-4 h-4" />
                                            <span>Encounter Signed & Prescription Dispatched to Pharmacy!</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleFinalizeConsultation}
                                            disabled={finalizeLoading || !selectedPatient}
                                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>{finalizeLoading ? 'Signing Medical Record...' : 'Digitally Sign & Dispatch to Pharmacy'}</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* TAB 3: INPATIENT WARD BED ROUNDS                            */}
                    {/* ============================================================ */}
                    {activeTab === 'rounds' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inpatient Ward Rounds</h2>
                                <button onClick={fetchRounds} className="text-xs text-emerald-400 hover:underline">
                                    Refresh
                                </button>
                            </div>

                            {roundsLoading ? (
                                <div className="text-center py-10 text-xs text-slate-400">Loading admitted ward patients...</div>
                            ) : inpatientRounds.length === 0 ? (
                                <div className="text-center py-12 text-xs text-slate-500">
                                    No patients currently admitted in wards.
                                </div>
                            ) : (
                                inpatientRounds.map((adm: any) => (
                                    <div key={adm.admissionId} className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                                                    <Bed className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-white">{adm.patient?.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        {adm.ward} • {adm.bed} • Admitted: {new Date(adm.admissionDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                                                {adm.patient?.bloodGroup || 'A+'}
                                            </span>
                                        </div>

                                        <div className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded-xl border border-slate-800">
                                            Admission Note: <span className="text-slate-400">{adm.reason}</span>
                                        </div>

                                        {adm.patient?.vitals && (
                                            <div className="bg-slate-950/70 p-2 rounded-xl flex items-center justify-between text-[10px] font-mono border border-slate-800">
                                                <span className="text-slate-400">BP: <strong className="text-white">{adm.patient.vitals.bp || '--'}</strong></span>
                                                <span className="text-slate-400">Pulse: <strong className="text-cyan-400">{adm.patient.vitals.pulse || '--'}</strong></span>
                                                <span className="text-slate-400">SpO2: <strong className="text-emerald-400">{adm.patient.vitals.spo2 ? `${adm.patient.vitals.spo2}%` : '--'}</strong></span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </main>

                {/* Bottom Navigation */}
                <nav className="fixed bottom-0 z-40 w-full max-w-md bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 py-2.5 flex items-center justify-between">
                    <button
                        onClick={() => setActiveTab('queue')}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'queue' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Users className="w-5 h-5" />
                        <span className="text-[10px] font-medium">OPD Queue</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('consult')}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'consult' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Stethoscope className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Scribe / Rx</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('rounds')}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'rounds' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Bed className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Ward Rounds</span>
                    </button>
                </nav>

            </div>
        </div>
    )
}
