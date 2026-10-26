export type RealtimeChannel = 'queue' | 'beds'

export interface QueueEventPayload {
    eventType: 'TOKEN_CALLED' | 'TOKEN_COMPLETED' | 'NEW_TOKEN' | 'QUEUE_SNAPSHOT'
    appointmentId?: string
    tokenNumber: number | string
    patientName?: string
    patientMrn?: string
    doctorName?: string
    roomNumber?: string
    status: string
    timestamp: string
}

export interface BedEventPayload {
    eventType: 'BED_OCCUPIED' | 'BED_AVAILABLE' | 'BED_CLEANING' | 'BED_MAINTENANCE' | 'BED_SNAPSHOT'
    bedId: string
    bedNo: string
    wardId?: string
    wardName?: string
    status: string
    patientName?: string
    timestamp: string
}

type ClientController = ReadableStreamDefaultController<Uint8Array>

class RealtimeEventBus {
    // Map of tenantId -> channel -> Set of stream controllers
    private subscribers: Map<string, Map<RealtimeChannel, Set<ClientController>>> = new Map()
    private encoder = new TextEncoder()

    /**
     * Registers a new SSE client controller under a specific tenant and channel
     */
    public subscribe(tenantId: string, channel: RealtimeChannel, controller: ClientController): () => void {
        if (!this.subscribers.has(tenantId)) {
            this.subscribers.set(tenantId, new Map())
        }

        const tenantChannels = this.subscribers.get(tenantId)!
        if (!tenantChannels.has(channel)) {
            tenantChannels.set(channel, new Set())
        }

        const clientSet = tenantChannels.get(channel)!
        clientSet.add(controller)

        // Send connection confirmation
        try {
            const initMsg = this.formatSSE('CONNECTED', { 
                status: 'STREAM_CONNECTED', 
                channel, 
                timestamp: new Date().toISOString() 
            })
            controller.enqueue(this.encoder.encode(initMsg))
        } catch {
            clientSet.delete(controller)
        }

        // Return unsubscribe cleanup callback
        return () => {
            clientSet.delete(controller)
            if (clientSet.size === 0) {
                tenantChannels.delete(channel)
            }
            if (tenantChannels.size === 0) {
                this.subscribers.delete(tenantId)
            }
        }
    }

    /**
     * Broadcasts a queue event to all listening displays in the same tenant
     */
    public publishQueueEvent(tenantId: string, payload: QueueEventPayload): number {
        return this.broadcast(tenantId, 'queue', payload.eventType, payload)
    }

    /**
     * Broadcasts a ward bed state change to all listening nursing screens in the same tenant
     */
    public publishBedEvent(tenantId: string, payload: BedEventPayload): number {
        return this.broadcast(tenantId, 'beds', payload.eventType, payload)
    }

    /**
     * Formats data into the official Server-Sent Events (SSE) specification wire format
     */
    public formatSSE(event: string, data: any): string {
        return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    }

    /**
     * Broadcast helper with dead client eviction
     */
    private broadcast(tenantId: string, channel: RealtimeChannel, eventName: string, data: any): number {
        const tenantChannels = this.subscribers.get(tenantId)
        if (!tenantChannels) return 0

        const clients = tenantChannels.get(channel)
        if (!clients || clients.size === 0) return 0

        const message = this.formatSSE(eventName, data)
        const encoded = this.encoder.encode(message)
        const deadControllers: ClientController[] = []

        clients.forEach(controller => {
            try {
                controller.enqueue(encoded)
            } catch {
                deadControllers.push(controller)
            }
        })

        // Evict closed/dead connections
        deadControllers.forEach(c => clients.delete(c))
        return clients.size - deadControllers.length
    }

    /**
     * Returns total active subscribers count (useful for health diagnostics)
     */
    public getActiveSubscriberCount(tenantId?: string, channel?: RealtimeChannel): number {
        if (tenantId) {
            const tenantChannels = this.subscribers.get(tenantId)
            if (!tenantChannels) return 0
            if (channel) {
                return tenantChannels.get(channel)?.size || 0
            }
            let total = 0
            tenantChannels.forEach(set => total += set.size)
            return total
        }

        let total = 0
        this.subscribers.forEach(tenantChannels => {
            tenantChannels.forEach(set => total += set.size)
        })
        return total
    }
}

// Global singleton instance across Next.js module evaluations
const globalForEvents = globalThis as unknown as { eventBusInstance?: RealtimeEventBus }
export const eventBus = globalForEvents.eventBusInstance ?? new RealtimeEventBus()
if (process.env.NODE_ENV !== 'production') globalForEvents.eventBusInstance = eventBus
