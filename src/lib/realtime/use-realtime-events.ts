'use client'

import { useState, useEffect, useRef } from 'react'
import { QueueEventPayload } from './event-bus'

export function useRealtimeQueue(initialTokens: QueueEventPayload[] = []) {
    const [queue, setQueue] = useState<QueueEventPayload[]>(initialTokens)
    const [callingToken, setCallingToken] = useState<QueueEventPayload | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const eventSourceRef = useRef<EventSource | null>(null)

    useEffect(() => {
        let es: EventSource | null = null
        let reconnectTimeout: any = null

        function connect() {
            try {
                es = new EventSource('/api/realtime/queue')
                eventSourceRef.current = es

                es.onopen = () => {
                    setIsConnected(true)
                }

                es.addEventListener('QUEUE_SNAPSHOT', (event: MessageEvent) => {
                    try {
                        const data = JSON.parse(event.data)
                        if (Array.isArray(data.tokens)) {
                            setQueue(data.tokens)
                            const current = data.tokens.find((t: QueueEventPayload) => t.status === 'in-consultation')
                            if (current) setCallingToken(current)
                        }
                    } catch (e) {
                        console.error('[SSE] Failed to parse snapshot:', e)
                    }
                })

                es.addEventListener('TOKEN_CALLED', (event: MessageEvent) => {
                    try {
                        const newCall = JSON.parse(event.data) as QueueEventPayload
                        setCallingToken(newCall)
                        setQueue(prev => {
                            // Update or insert into queue
                            const exists = prev.some(t => t.appointmentId === newCall.appointmentId)
                            if (exists) {
                                return prev.map(t => t.appointmentId === newCall.appointmentId ? newCall : t)
                            }
                            return [newCall, ...prev]
                        })

                        // Play hospital audio chime if supported
                        playChimeSound()
                    } catch (e) {
                        console.error('[SSE] Failed to parse token call:', e)
                    }
                })

                es.addEventListener('TOKEN_COMPLETED', (event: MessageEvent) => {
                    try {
                        const completed = JSON.parse(event.data)
                        setQueue(prev => prev.filter(t => t.appointmentId !== completed.appointmentId))
                        setCallingToken(prev => (prev?.appointmentId === completed.appointmentId ? null : prev))
                    } catch (e) {
                        console.error('[SSE] Failed to parse completed token:', e)
                    }
                })

                es.onerror = () => {
                    setIsConnected(false)
                    es?.close()
                    // Reconnect with 3 second delay
                    reconnectTimeout = setTimeout(connect, 3000)
                }
            } catch (err) {
                console.error('[SSE] Connection error:', err)
                reconnectTimeout = setTimeout(connect, 5000)
            }
        }

        connect()

        return () => {
            es?.close()
            if (reconnectTimeout) clearTimeout(reconnectTimeout)
        }
    }, [])

    return {
        queue,
        callingToken,
        isConnected
    }
}

/**
 * Synthesizes a clean two-tone electronic hospital chime using the Web Audio API
 */
export function playChimeSound() {
    if (typeof window === 'undefined') return
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()

        const now = ctx.currentTime

        // First tone (G5 - 784 Hz)
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.frequency.setValueAtTime(783.99, now)
        gain1.gain.setValueAtTime(0.3, now)
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8)
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.start(now)
        osc1.stop(now + 0.8)

        // Second tone (C6 - 1046.5 Hz)
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.frequency.setValueAtTime(1046.50, now + 0.3)
        gain2.gain.setValueAtTime(0.3, now + 0.3)
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2)
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start(now + 0.3)
        osc2.stop(now + 1.2)
    } catch {
        // Audio policy or permission blocked - graceful fallback
    }
}
