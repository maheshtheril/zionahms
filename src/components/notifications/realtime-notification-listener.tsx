"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, AlertTriangle, Activity, Pill, CheckCircle2 } from 'lucide-react';
import { RealtimeNotification } from '@/lib/events/notifications';

export function RealtimeNotificationListener() {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let eventSource: EventSource | null = null;

        const connectStream = () => {
            eventSource = new EventSource('/api/notifications/stream');

            eventSource.onmessage = (event) => {
                try {
                    const data: RealtimeNotification = JSON.parse(event.data);
                    if (data.type === 'CONNECTED') return;

                    setUnreadCount(prev => prev + 1);
                    playNotificationSound(data.severity);

                    // Show dynamic toast based on alert type & severity
                    toast.custom((t) => (
                        <div className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 text-sm transition-all ${
                            data.severity === 'critical'
                                ? 'bg-red-950/90 border-red-500/50 text-red-100'
                                : data.severity === 'warning'
                                ? 'bg-amber-950/90 border-amber-500/50 text-amber-100'
                                : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-100'
                        }`}>
                            <div className="p-2 rounded-lg bg-white/10 shrink-0 mt-0.5">
                                {data.type === 'CRITICAL_LAB_RESULT' ? (
                                    <AlertTriangle className="h-5 w-5 text-red-400 animate-bounce" />
                                ) : data.type === 'NURSE_CALL_ALERT' ? (
                                    <Bell className="h-5 w-5 text-amber-400 animate-pulse" />
                                ) : data.type === 'NEW_PATIENT_WAITING' ? (
                                    <Activity className="h-5 w-5 text-emerald-400" />
                                ) : data.type === 'STAT_MEDICATION_ORDER' ? (
                                    <Pill className="h-5 w-5 text-indigo-400" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5 text-blue-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold flex items-center justify-between gap-2">
                                    <span>{data.title}</span>
                                    <span className="text-[10px] opacity-60 uppercase font-mono px-1.5 py-0.5 rounded bg-black/20">
                                        {data.severity}
                                    </span>
                                </div>
                                <p className="text-xs opacity-90 mt-1 leading-snug">{data.message}</p>
                                {data.patientName && (
                                    <p className="text-[11px] font-semibold mt-1 opacity-75">
                                        Patient: {data.patientName}
                                    </p>
                                )}
                            </div>
                        </div>
                    ), { duration: data.severity === 'critical' ? 10000 : 5000 });

                } catch (e) {
                    console.error("Failed to parse SSE notification", e);
                }
            };

            eventSource.onerror = () => {
                // Silently reconnect on drop
                eventSource?.close();
                setTimeout(connectStream, 5000);
            };
        };

        connectStream();

        return () => {
            eventSource?.close();
        };
    }, []);

    return null;
}

function playNotificationSound(severity: string) {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = severity === 'critical' ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(severity === 'critical' ? 880 : 587.33, audioCtx.currentTime); // A5 or D5
        
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (severity === 'critical' ? 0.6 : 0.3));

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + (severity === 'critical' ? 0.6 : 0.3));
    } catch (e) {
        // Audio playback may be restricted by browser autoplay policies until user interacts
    }
}
