'use client'

import React, { useState, useEffect } from 'react'
import {
    Activity, Calendar, Clock, FileText, Heart, Home, LogOut,
    Phone, Pill, QrCode, Search, ShieldCheck, Stethoscope,
    User, AlertCircle, CheckCircle2, ChevronRight, Download
} from 'lucide-react'

type TabType = 'home' | 'book' | 'records' | 'profile'

export default function PatientMobileApp() {
    // Auth State
    const [token, setToken] = useState<string | null>(null)
    const [patient, setPatient] = useState<any>(null)
    const [phoneInput, setPhoneInput] = useState('')
    const [otpInput, setOtpInput] = useState('123456')
    const [authLoading, setAuthLoading] = useState(false)
    const [authError, setAuthError] = useState('')

    // Active Navigation Tab
    const [activeTab, setActiveTab] = useState<TabType>('home')

    // Live Queue State
    const [queueStatus, setQueueStatus] = useState<any>(null)
    const [queueLoading, setQueueLoading] = useState(false)

    // Doctor Booking State
    const [doctors, setDoctors] = useState<any[]>([])
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0])
    const [bookingReason, setBookingReason] = useState('')
    const [bookingSuccess, setBookingSuccess] = useState<any>(null)
    const [bookingLoading, setBookingLoading] = useState(false)

    // Health Records State
    const [records, setRecords] = useState<any>({ prescriptions: [], labInvestigations: [], vitalsHistory: [] })
    const [recordsTab, setRecordsTab] = useState<'rx' | 'lab' | 'vitals'>('rx')
    const [recordsLoading, setRecordsLoading] = useState(false)

    // Initialize from LocalStorage
    useEffect(() => {
        const savedToken = localStorage.getItem('hms_patient_mobile_jwt')
        const savedPatient = localStorage.getItem('hms_patient_profile')
        if (savedToken && savedPatient) {
            try {
                setToken(savedToken)
                setPatient(JSON.parse(savedPatient))
            } catch (e) {
                console.error(e)
            }
        }
    }, [])

    // Fetch live queue & records when token exists
    useEffect(() => {
        if (!token) return
        fetchQueueStatus()
        fetchDoctors()
        fetchHealthRecords()

        // Poll queue status every 15 seconds for live real-time token tracking
        const interval = setInterval(fetchQueueStatus, 15000)
        return () => clearInterval(interval)
    }, [token])

    // 1. Auth: Patient Login via OTP
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setAuthLoading(true)
        setAuthError('')

        try {
            const res = await fetch('/api/v1/mobile/auth/patient-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneInput, otp: otpInput })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to authenticate')

            const jwt = data.data.token
            const profile = data.data.patient

            setToken(jwt)
            setPatient(profile)
            localStorage.setItem('hms_patient_mobile_jwt', jwt)
            localStorage.setItem('hms_patient_profile', JSON.stringify(profile))
        } catch (err: any) {
            setAuthError(err.message)
        } finally {
            setAuthLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('hms_patient_mobile_jwt')
        localStorage.removeItem('hms_patient_profile')
        setToken(null)
        setPatient(null)
        setActiveTab('home')
    }

    // 2. Fetch Live Queue Status
    const fetchQueueStatus = async () => {
        if (!token) return
        try {
            setQueueLoading(true)
            const res = await fetch('/api/v1/mobile/patient/queue-status', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) setQueueStatus(data.data)
        } catch (err) {
            console.error('Queue poll error:', err)
        } finally {
            setQueueLoading(false)
        }
    }

    // 3. Fetch Clinician Directory
    const fetchDoctors = async () => {
        try {
            const res = await fetch('/api/v1/mobile/doctors')
            const data = await res.json()
            if (res.ok) setDoctors(data.data || [])
        } catch (err) {
            console.error('Doctor fetch error:', err)
        }
    }

    // 4. Fetch Health Records (Rx, Labs, Vitals)
    const fetchHealthRecords = async () => {
        if (!token) return
        try {
            setRecordsLoading(true)
            const res = await fetch('/api/v1/mobile/patient/records', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) setRecords(data.data || {})
        } catch (err) {
            console.error('Records fetch error:', err)
        } finally {
            setRecordsLoading(false)
        }
    }

    // 5. Book Appointment
    const handleBookAppointment = async () => {
        if (!selectedDoctor || !bookingDate) return
        setBookingLoading(true)
        setBookingSuccess(null)

        try {
            const res = await fetch('/api/v1/mobile/patient/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    clinicianId: selectedDoctor.id,
                    startsAt: `${bookingDate}T${selectedDoctor.startTime || '09:00'}:00`,
                    reason: bookingReason || 'General Consultation'
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to book slot')

            setBookingSuccess(data.data)
            fetchQueueStatus()
        } catch (err: any) {
            alert(err.message)
        } finally {
            setBookingLoading(false)
        }
    }

    // ==========================================
    // SCREEN 1: LOGIN / ONBOARDING
    // ==========================================
    if (!token) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-3">
                            <Activity className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white">Ziona Health Portal</h1>
                        <p className="text-xs text-slate-400 mt-1">2050 Mobile Patient Health Companion</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {authError && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{authError}</span>
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">Mobile Phone Number</label>
                            <div className="relative">
                                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                                <input
                                    type="tel"
                                    required
                                    placeholder="+91 98765 43210"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-semibold text-slate-300">Verification Code (OTP)</label>
                                <span className="text-[10px] text-cyan-400">Default: 123456</span>
                            </div>
                            <input
                                type="text"
                                required
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-center tracking-widest font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl font-semibold text-sm text-white shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {authLoading ? 'Verifying...' : 'Access My Health Records'}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-slate-800/60 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Zero-Knowledge Encrypted Health Vault</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ==========================================
    // SCREEN 2: MAIN PATIENT APPLICATION
    // ==========================================
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-cyan-500/20">
            {/* Mobile Viewport Container */}
            <div className="w-full max-w-md bg-slate-900 border-x border-slate-800/80 min-h-screen flex flex-col pb-20 shadow-2xl relative">

                {/* Top App Header */}
                <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-cyan-500/20">
                            {patient?.fullName?.[0] || 'P'}
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 font-medium leading-none">Welcome back,</div>
                            <div className="text-sm font-bold text-white leading-tight">{patient?.fullName || 'Patient'}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold">
                            {patient?.mrn || 'MRN-NEW'}
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

                {/* Tab Content Router */}
                <main className="flex-1 p-4 space-y-4 overflow-y-auto">

                    {/* ============================================================ */}
                    {/* TAB 1: HOME & LIVE QUEUE TRACKER                             */}
                    {/* ============================================================ */}
                    {activeTab === 'home' && (
                        <>
                            {/* Live Token Radar Card */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-950/80 via-slate-900 to-blue-950/80 border border-cyan-500/30 p-4 shadow-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-xs font-semibold text-cyan-300 tracking-wide uppercase">Live Clinic Radar</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">Today's OPD</span>
                                </div>

                                {queueStatus?.hasActiveQueue ? (
                                    <div>
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Now Calling</div>
                                                <div className="text-3xl font-black text-amber-400 font-mono">
                                                    #{queueStatus.currentCallingToken}
                                                </div>
                                            </div>
                                            <div className="bg-slate-950/70 border border-cyan-500/40 rounded-xl p-3 text-center">
                                                <div className="text-[10px] text-cyan-400 uppercase tracking-wider mb-1">Your Token</div>
                                                <div className="text-3xl font-black text-cyan-300 font-mono">
                                                    #{queueStatus.myTokenNumber}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/80 text-xs flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-300">
                                                <Clock className="w-4 h-4 text-cyan-400" />
                                                <span>Estimated Wait:</span>
                                            </div>
                                            <span className="font-bold text-white">~{queueStatus.estimatedWaitMinutes} mins ({queueStatus.patientsAhead} ahead)</span>
                                        </div>

                                        <div className="mt-2 text-[11px] text-slate-400 text-center">
                                            Attending: <strong className="text-white">{queueStatus.doctorName}</strong> ({queueStatus.specialization})
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <Calendar className="w-10 h-10 text-cyan-500/40 mx-auto mb-2" />
                                        <div className="text-sm font-semibold text-white">No Active Queue Today</div>
                                        <p className="text-xs text-slate-400 mt-0.5 mb-3">You don't have an active consultation queued for right now.</p>
                                        <button
                                            onClick={() => setActiveTab('book')}
                                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-cyan-500/20"
                                        >
                                            Book an Appointment
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Quick Action Grid */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Services</h3>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        onClick={() => setActiveTab('book')}
                                        className="p-3.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl text-left transition-all group"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div className="text-xs font-bold text-white">Book Doctor</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">Instant queue slot</div>
                                    </button>

                                    <button
                                        onClick={() => { setActiveTab('records'); setRecordsTab('rx') }}
                                        className="p-3.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl text-left transition-all group"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                                            <Pill className="w-5 h-5" />
                                        </div>
                                        <div className="text-xs font-bold text-white">Prescriptions</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">{records?.prescriptions?.length || 0} active records</div>
                                    </button>

                                    <button
                                        onClick={() => { setActiveTab('records'); setRecordsTab('lab') }}
                                        className="p-3.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl text-left transition-all group"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="text-xs font-bold text-white">Lab Reports</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">{records?.labInvestigations?.length || 0} investigations</div>
                                    </button>

                                    <button
                                        onClick={() => { setActiveTab('records'); setRecordsTab('vitals') }}
                                        className="p-3.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl text-left transition-all group"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                                            <Heart className="w-5 h-5" />
                                        </div>
                                        <div className="text-xs font-bold text-white">Vitals Radar</div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">BP, SpO2, Pulse</div>
                                    </button>
                                </div>
                            </div>

                            {/* Digital Health Card Preview */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <div className="text-xs font-bold text-white">Digital Health Identity (QR)</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">Scan at clinic kiosk for zero-wait registration</div>
                                </div>
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 hover:bg-slate-700 transition-colors"
                                >
                                    <QrCode className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    )}

                    {/* ============================================================ */}
                    {/* TAB 2: BOOK DOCTOR & GET INSTANT TOKEN                       */}
                    {/* ============================================================ */}
                    {activeTab === 'book' && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-base font-bold text-white">Book an Appointment</h2>
                                <p className="text-xs text-slate-400">Select a specialist and pick your consultation slot.</p>
                            </div>

                            {bookingSuccess && (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                                    <div className="text-sm font-bold text-white">Booking Confirmed!</div>
                                    <div className="text-xs text-emerald-300 font-mono">
                                        Token #{bookingSuccess.tokenNumber} has been reserved.
                                    </div>
                                    <button
                                        onClick={() => { setBookingSuccess(null); setActiveTab('home') }}
                                        className="mt-2 px-4 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
                                    >
                                        View in Live Radar
                                    </button>
                                </div>
                            )}

                            {/* Doctor Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-300">Choose Specialist</label>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {doctors.map((doc) => (
                                        <div
                                            key={doc.id}
                                            onClick={() => setSelectedDoctor(doc)}
                                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${selectedDoctor?.id === doc.id
                                                ? 'bg-cyan-500/10 border-cyan-500 shadow-md shadow-cyan-500/10'
                                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
                                                    <Stethoscope className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-white">{doc.name}</div>
                                                    <div className="text-[11px] text-cyan-400">{doc.specialization}</div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5">₹{doc.consultationFee} Fee • {doc.startTime} - {doc.endTime}</div>
                                                </div>
                                            </div>
                                            {selectedDoctor?.id === doc.id && (
                                                <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Date Picker */}
                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Appointment Date</label>
                                <input
                                    type="date"
                                    value={bookingDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {/* Reason for Visit */}
                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1">Reason for Visit (Symptoms)</label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Mild fever, dry cough, follow-up check..."
                                    value={bookingReason}
                                    onChange={(e) => setBookingReason(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            <button
                                onClick={handleBookAppointment}
                                disabled={!selectedDoctor || bookingLoading}
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl font-bold text-sm text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {bookingLoading ? 'Generating Token...' : `Confirm Token with ${selectedDoctor?.name || 'Doctor'}`}
                            </button>
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* TAB 3: LIFELONG HEALTH TIMELINE & RECORDS                   */}
                    {/* ============================================================ */}
                    {activeTab === 'records' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-bold text-white">Health Records</h2>
                                <button
                                    onClick={fetchHealthRecords}
                                    className="text-xs text-cyan-400 hover:underline"
                                >
                                    Refresh
                                </button>
                            </div>

                            {/* Sub-Tabs */}
                            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button
                                    onClick={() => setRecordsTab('rx')}
                                    className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${recordsTab === 'rx' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                                >
                                    Prescriptions
                                </button>
                                <button
                                    onClick={() => setRecordsTab('lab')}
                                    className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${recordsTab === 'lab' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                                >
                                    Lab Reports
                                </button>
                                <button
                                    onClick={() => setRecordsTab('vitals')}
                                    className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${recordsTab === 'vitals' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                                >
                                    Vitals Trend
                                </button>
                            </div>

                            {recordsLoading && (
                                <div className="text-center py-8 text-xs text-slate-400">Loading encrypted medical records...</div>
                            )}

                            {/* 1. Prescriptions List */}
                            {recordsTab === 'rx' && (
                                <div className="space-y-3">
                                    {records.prescriptions.length === 0 ? (
                                        <div className="text-center py-10 text-xs text-slate-500">No prescriptions found.</div>
                                    ) : (
                                        records.prescriptions.map((rx: any) => (
                                            <div key={rx.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                                                        {new Date(rx.date).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-xs text-slate-400">{rx.medications.length} items</span>
                                                </div>

                                                <div className="space-y-2 divide-y divide-slate-800/60">
                                                    {rx.medications.map((m: any, idx: number) => (
                                                        <div key={idx} className="pt-2 first:pt-0">
                                                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                                                <Pill className="w-3.5 h-3.5 text-cyan-400" />
                                                                <span>{m.name}</span>
                                                                <span className="text-[10px] text-slate-400 font-normal">({m.dosage || 'Standard'})</span>
                                                            </div>
                                                            <div className="text-[11px] text-slate-400 mt-0.5 pl-5">
                                                                Frequency: <strong className="text-cyan-300">{m.frequency}</strong> • Duration: {m.duration}
                                                            </div>
                                                            {m.instructions && (
                                                                <div className="text-[10px] text-amber-400/90 pl-5 mt-0.5">
                                                                    Instruction: {m.instructions}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* 2. Lab Reports List */}
                            {recordsTab === 'lab' && (
                                <div className="space-y-3">
                                    {records.labInvestigations.length === 0 ? (
                                        <div className="text-center py-10 text-xs text-slate-500">No laboratory reports published yet.</div>
                                    ) : (
                                        records.labInvestigations.map((lab: any) => (
                                            <div key={lab.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                                        {new Date(lab.orderDate).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">{lab.status}</span>
                                                </div>

                                                <div className="space-y-2">
                                                    {lab.tests.map((t: any, idx: number) => (
                                                        <div key={idx} className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800">
                                                            <div className="text-xs font-bold text-white mb-1.5">{t.testName}</div>
                                                            {t.results.length > 0 ? (
                                                                <div className="space-y-1">
                                                                    {t.results.map((r: any, rIdx: number) => (
                                                                        <div key={rIdx} className="flex items-center justify-between text-[11px]">
                                                                            <span className="text-slate-400">{r.parameter}</span>
                                                                            <span className={`font-mono font-bold ${r.isAbnormal ? 'text-rose-400' : 'text-white'}`}>
                                                                                {r.value} {r.unit}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-[10px] text-slate-500 italic">Results processing in hospital laboratory...</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* 3. Vitals History */}
                            {recordsTab === 'vitals' && (
                                <div className="space-y-2.5">
                                    {records.vitalsHistory.length === 0 ? (
                                        <div className="text-center py-10 text-xs text-slate-500">No vitals history recorded.</div>
                                    ) : (
                                        records.vitalsHistory.map((v: any) => (
                                            <div key={v.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                                                <div>
                                                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                                                        <span>BP: {v.bloodPressure || 'N/A'}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                                        {new Date(v.recordedAt).toLocaleString()}
                                                    </div>
                                                </div>

                                                <div className="text-right text-[11px]">
                                                    <div className="text-cyan-400 font-mono">Pulse: {v.pulse || '--'} bpm</div>
                                                    <div className="text-slate-400 font-mono">SpO2: {v.spo2 ? `${v.spo2}%` : '--'}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* TAB 4: PROFILE & DIGITAL QR HEALTH CARD                      */}
                    {/* ============================================================ */}
                    {activeTab === 'profile' && (
                        <div className="space-y-4">
                            {/* Digital Health Identity Card */}
                            <div className="relative rounded-3xl bg-gradient-to-tr from-cyan-600 via-blue-700 to-indigo-900 p-5 text-white shadow-2xl overflow-hidden">
                                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-cyan-200" />
                                        <span className="text-xs font-black tracking-widest uppercase">Ziona Universal Health ID</span>
                                    </div>
                                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">2050 Vault</span>
                                </div>

                                <div className="text-xl font-bold tracking-tight mb-1">{patient?.fullName}</div>
                                <div className="text-xs text-cyan-100 font-mono mb-4">MRN: {patient?.mrn}</div>

                                <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/20 pt-3">
                                    <div>
                                        <span className="text-[10px] text-cyan-200 block uppercase">Blood Group</span>
                                        <span className="font-bold">{patient?.bloodGroup || 'O+'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-cyan-200 block uppercase">Phone</span>
                                        <span className="font-mono">{patient?.phone || 'Verified'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Self-Sovereign Security Badge */}
                            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Encrypted Mobile Health Credential</span>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Your personal health data is protected with hardware-bound encryption. You retain complete consent and ownership over your medical history.
                                </p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Disconnect Patient Device Session</span>
                            </button>
                        </div>
                    )}
                </main>

                {/* Bottom Navigation Bar */}
                <nav className="fixed bottom-0 z-40 w-full max-w-md bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 py-2.5 flex items-center justify-between">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Home className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Home</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('book')}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'book' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Calendar className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Book</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('records')}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'records' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <FileText className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Records</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <User className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Profile</span>
                    </button>
                </nav>

            </div>
        </div>
    )
}
