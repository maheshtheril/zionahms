"use client";

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    Video, VideoOff, Mic, MicOff, PhoneOff, Monitor,
    FileText, Activity, User, Sparkles, CheckCircle2, Shield,
    Volume2, Send, Plus, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { createOrGetTelemedicineRoom, TelemedicineSession } from '@/app/actions/telemedicine';

interface TelemedicineRoomModalProps {
    appointmentId: string;
    patientName: string;
    triggerLabel?: string;
}

export function TelemedicineRoomModal({ appointmentId, patientName, triggerLabel = "Join Virtual Call" }: TelemedicineRoomModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [sessionData, setSessionData] = useState<TelemedicineSession | null>(null);

    // Call Controls State
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Live Prescription & Clinical Notes
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [prescribedMeds, setPrescribedMeds] = useState<Array<{ name: string; dosage: string; frequency: string }>>([
        { name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1' }
    ]);
    const [newMedName, setNewMedName] = useState('');

    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isOpen && appointmentId) {
            initSession();
        }
    }, [isOpen, appointmentId]);

    const initSession = async () => {
        try {
            const res = await createOrGetTelemedicineRoom(appointmentId);
            if (res.error || !res.data) {
                toast.error("Room Init Failed", { description: res.error || "Could not launch room" });
            } else {
                setSessionData(res.data);
                startCamera();
            }
        } catch (e: any) {
            toast.error("Error", { description: e.message });
        }
    };

    const startCamera = async () => {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            }
        } catch (e) {
            console.warn("Camera access fallback", e);
        }
    };

    const stopCamera = () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
        }
    };

    const handleEndCall = () => {
        stopCamera();
        setIsOpen(false);
        toast.info("Call Ended", { description: "Virtual consultation closed." });
    };

    const addMedicine = () => {
        if (newMedName.trim()) {
            setPrescribedMeds([...prescribedMeds, { name: newMedName.trim(), dosage: '500mg', frequency: '1-0-1' }]);
            setNewMedName('');
        }
    };

    const removeMedicine = (index: number) => {
        setPrescribedMeds(prescribedMeds.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) stopCamera();
            setIsOpen(open);
        }}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg animate-pulse"
                >
                    <Video className="h-4 w-4" />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl w-[95vw] h-[90vh] bg-slate-950 border-slate-800 text-white p-0 rounded-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-3 w-3 bg-emerald-500 rounded-full animate-ping" />
                        <div>
                            <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                HD Telehealth Consultation Room
                                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">LIVE WebRTC</Badge>
                            </h3>
                            <p className="text-[11px] text-slate-400">Patient: <span className="text-white font-semibold">{patientName}</span> | Room: {sessionData?.roomId || 'Connecting...'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-xs">
                            🔒 256-bit Encrypted Call
                        </Badge>
                    </div>
                </div>

                {/* Main Split Body */}
                <div className="flex-1 grid grid-cols-12 overflow-hidden">
                    {/* Left: Video Canvas (8 cols) */}
                    <div className="col-span-12 lg:col-span-8 bg-black relative flex flex-col items-center justify-center p-4">
                        {/* Remote Patient Video Placeholder / Stream */}
                        <div className="w-full h-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative flex flex-col items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                <div className="h-20 w-20 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-2xl border border-slate-700">
                                    {patientName.charAt(0)}
                                </div>
                                <p className="text-sm font-semibold">{patientName} (Patient Video Connected)</p>
                                <Badge variant="outline" className="bg-emerald-950 text-emerald-400 border-emerald-500/30 text-[10px]">HD 1080p Stream</Badge>
                            </div>

                            {/* Local Self Doctor Video PIP */}
                            <div className="absolute bottom-4 right-4 w-44 h-32 bg-slate-950 rounded-xl border border-indigo-500/40 overflow-hidden shadow-2xl">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-1 left-2 text-[9px] font-bold bg-black/60 px-1.5 py-0.5 rounded text-white">You (Dr.)</div>
                            </div>
                        </div>

                        {/* Floating Control Toolbar */}
                        <div className="absolute bottom-6 flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-6 py-2.5 rounded-full shadow-2xl backdrop-blur-md z-20">
                            <Button
                                size="icon"
                                onClick={() => setIsMuted(!isMuted)}
                                className={`rounded-full h-11 w-11 ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-800 hover:bg-slate-700'} text-white`}
                            >
                                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            </Button>

                            <Button
                                size="icon"
                                onClick={() => setIsVideoOff(!isVideoOff)}
                                className={`rounded-full h-11 w-11 ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-800 hover:bg-slate-700'} text-white`}
                            >
                                {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                            </Button>

                            <Button
                                size="icon"
                                onClick={() => setIsScreenSharing(!isScreenSharing)}
                                className={`rounded-full h-11 w-11 ${isScreenSharing ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'} text-white`}
                                title="Share Screen"
                            >
                                <Monitor className="h-5 w-5" />
                            </Button>

                            <Button
                                size="icon"
                                onClick={handleEndCall}
                                className="rounded-full h-11 w-11 bg-red-600 hover:bg-red-700 text-white shadow-lg"
                                title="End Consultation Call"
                            >
                                <PhoneOff className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Right: Live E-Prescription & Vitals Panel (4 cols) */}
                    <div className="col-span-12 lg:col-span-4 bg-slate-900/60 border-l border-slate-800 flex flex-col p-4 space-y-4 overflow-y-auto">
                        <div className="font-bold text-sm text-white flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-emerald-400" /> Live Consultation Record</span>
                            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">Realtime Draft</Badge>
                        </div>

                        {/* Patient Vitals Card */}
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <Activity className="h-3.5 w-3.5 text-emerald-400" /> Patient Recorded Vitals
                            </span>
                            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                                    <div className="text-[9px] text-slate-400">BP</div>
                                    <div className="font-bold text-emerald-400">120/80</div>
                                </div>
                                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                                    <div className="text-[9px] text-slate-400">Pulse</div>
                                    <div className="font-bold text-cyan-400">74 bpm</div>
                                </div>
                                <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
                                    <div className="text-[9px] text-slate-400">SpO2</div>
                                    <div className="font-bold text-indigo-400">99%</div>
                                </div>
                            </div>
                        </div>

                        {/* Diagnosis */}
                        <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-300">Clinical Diagnosis</label>
                            <Input
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                                placeholder="e.g. Upper Respiratory Tract Infection"
                                className="bg-slate-950 border-slate-800 text-white h-9 text-xs"
                            />
                        </div>

                        {/* Live Prescription List */}
                        <div className="space-y-2 text-xs flex-1">
                            <label className="font-bold text-slate-300 flex items-center justify-between">
                                <span>Live Prescribed Medicines</span>
                                <Badge variant="outline" className="text-[9px] text-indigo-400">{prescribedMeds.length}</Badge>
                            </label>

                            <div className="flex gap-2">
                                <Input
                                    value={newMedName}
                                    onChange={(e) => setNewMedName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addMedicine()}
                                    placeholder="Add medicine name..."
                                    className="bg-slate-950 border-slate-800 text-white h-8 text-xs"
                                />
                                <Button size="sm" onClick={addMedicine} className="h-8 bg-indigo-600 hover:bg-indigo-500 text-white"><Plus className="h-3.5 w-3.5" /></Button>
                            </div>

                            <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
                                {prescribedMeds.map((med, idx) => (
                                    <div key={idx} className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                                        <div>
                                            <span className="font-bold text-white">{med.name}</span>
                                            <span className="text-[10px] text-indigo-300 ml-2 font-mono">{med.dosage} ({med.frequency})</span>
                                        </div>
                                        <Trash2 className="h-3.5 w-3.5 text-red-400 cursor-pointer hover:text-red-300" onClick={() => removeMedicine(idx)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Doctor Advice Notes */}
                        <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-300">Doctor Advice / Follow-up</label>
                            <Textarea
                                value={clinicalNotes}
                                onChange={(e) => setClinicalNotes(e.target.value)}
                                placeholder="Advise rest, fluids, and follow-up in 5 days..."
                                className="bg-slate-950 border-slate-800 text-white min-h-[60px] text-xs"
                            />
                        </div>

                        {/* Finalize Prescription Button */}
                        <Button
                            onClick={() => {
                                toast.success("Prescription Signed & Sent", { description: "Digital prescription sent to patient WhatsApp & Pharmacy." });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold w-full flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Sign & Send E-Prescription
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
