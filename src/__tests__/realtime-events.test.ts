import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eventBus } from '../lib/realtime/event-bus'

describe('Real-Time Event Bus (Server-Sent Events) Suite', () => {
    beforeEach(() => {
        // Clear subscribers if any
        vi.clearAllMocks()
    })

    it('formats event payloads into official SSE wire protocol', () => {
        const payload = { tokenNumber: 42, patientName: 'John Doe' }
        const sseString = eventBus.formatSSE('TOKEN_CALLED', payload)

        expect(sseString).toContain('event: TOKEN_CALLED\n')
        expect(sseString).toContain('data: {"tokenNumber":42,"patientName":"John Doe"}\n\n')
    })

    it('enforces strict multi-tenant boundary on queue broadcasts', () => {
        const tenantA = 'tenant-hospital-alpha'
        const tenantB = 'tenant-clinic-beta'

        const mockControllerA = {
            enqueue: vi.fn()
        } as any

        const mockControllerB = {
            enqueue: vi.fn()
        } as any

        // Subscribe controller A to Hospital Alpha
        const unsubscribeA = eventBus.subscribe(tenantA, 'queue', mockControllerA)
        // Subscribe controller B to Clinic Beta
        const unsubscribeB = eventBus.subscribe(tenantB, 'queue', mockControllerB)

        // Clear connection greeting calls
        mockControllerA.enqueue.mockClear()
        mockControllerB.enqueue.mockClear()

        // Publish event exclusively to Hospital Alpha
        const deliveredCount = eventBus.publishQueueEvent(tenantA, {
            eventType: 'TOKEN_CALLED',
            tokenNumber: 15,
            patientName: 'Jane Smith',
            doctorName: 'Dr. Adams',
            roomNumber: 'Room 3',
            status: 'in-consultation',
            timestamp: new Date().toISOString()
        })

        expect(deliveredCount).toBe(1)
        expect(mockControllerA.enqueue).toHaveBeenCalledTimes(1)
        // Hospital Beta must receive ZERO messages
        expect(mockControllerB.enqueue).not.toHaveBeenCalled()

        unsubscribeA()
        unsubscribeB()
    })

    it('publishes ward bed status changes to registered nursing screens', () => {
        const tenantId = 'tenant-inpatient-ward'
        const mockBedController = {
            enqueue: vi.fn()
        } as any

        const unsubscribe = eventBus.subscribe(tenantId, 'beds', mockBedController)
        mockBedController.enqueue.mockClear()

        eventBus.publishBedEvent(tenantId, {
            eventType: 'BED_AVAILABLE',
            bedId: 'bed-icu-01',
            bedNo: 'ICU-1',
            wardName: 'Intensive Care Unit',
            status: 'available',
            timestamp: new Date().toISOString()
        })

        expect(mockBedController.enqueue).toHaveBeenCalledTimes(1)
        unsubscribe()
    })

    it('gracefully evicts dead controllers without throwing', () => {
        const tenantId = 'tenant-dead-client-test'
        const deadController = {
            enqueue: vi.fn().mockImplementation(() => {
                throw new Error('Broken pipe: client closed connection')
            })
        } as any

        eventBus.subscribe(tenantId, 'queue', deadController)

        // Publishing to a broken socket should not throw
        expect(() => {
            eventBus.publishQueueEvent(tenantId, {
                eventType: 'TOKEN_CALLED',
                tokenNumber: 99,
                status: 'in-consultation',
                timestamp: new Date().toISOString()
            })
        }).not.toThrow()
    })
})
