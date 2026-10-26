'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { eventBus } from '@/lib/realtime/event-bus'
import { logPhiAccess } from '@/lib/hipaa-audit'

/**
 * Doctor/Reception action to call the next patient token.
 * Instantly broadcasts live audio-visual notification across waiting room TV screens.
 */
export async function callTokenAction(appointmentId: string, roomNumber: string = 'Room 1') {
    const session = await auth()
    if (!session?.user?.tenantId) return { success: false, error: 'Unauthorized' }

    try {
        const appointment = await prisma.hms_appointments.update({
            where: { id: appointmentId },
            data: {
                status: 'in-consultation',
                room_id: roomNumber,
                updated_at: new Date()
            },
            include: {
                hms_patient: { select: { id: true, full_name: true, first_name: true, last_name: true, patient_number: true } },
                hms_clinician: { select: { first_name: true, last_name: true, salutation: true } }
            }
        })

        const p = appointment.hms_patient
        const d = appointment.hms_clinician
        const patientName = p?.full_name || `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || 'Patient'
        const doctorName = d ? `${d.salutation || 'Dr.'} ${d.first_name} ${d.last_name}` : 'Attending Clinician'

        // Broadcast to all waiting room TVs and doctor dashboards via SSE
        eventBus.publishQueueEvent(session.user.tenantId, {
            eventType: 'TOKEN_CALLED',
            appointmentId: appointment.id,
            tokenNumber: appointment.token_number || 1,
            patientName,
            patientMrn: p?.patient_number || undefined,
            doctorName,
            roomNumber,
            status: 'in-consultation',
            timestamp: new Date().toISOString()
        })

        // HIPAA Access Audit
        logPhiAccess({
            patientId: appointment.patient_id,
            tenantId: session.user.tenantId,
            actorId: session.user.id || null,
            actorName: session.user.name || doctorName,
            action: 'UPDATE',
            resource: 'PATIENT_CHART',
            reason: `Patient Token #${appointment.token_number || 1} Called into ${roomNumber}`
        }).catch(err => console.error('[AUDIT] Non-blocking call token log error:', err))

        return {
            success: true,
            tokenNumber: appointment.token_number,
            patientName,
            roomNumber
        }
    } catch (err: any) {
        console.error('[REALTIME-QUEUE] Call token error:', err)
        return { success: false, error: err.message }
    }
}

/**
 * Completes consultation and removes token from active queue
 */
export async function completeTokenAction(appointmentId: string) {
    const session = await auth()
    if (!session?.user?.tenantId) return { success: false, error: 'Unauthorized' }

    try {
        const appointment = await prisma.hms_appointments.update({
            where: { id: appointmentId },
            data: {
                status: 'completed',
                updated_at: new Date()
            }
        })

        eventBus.publishQueueEvent(session.user.tenantId, {
            eventType: 'TOKEN_COMPLETED',
            appointmentId: appointment.id,
            tokenNumber: appointment.token_number || 1,
            status: 'completed',
            timestamp: new Date().toISOString()
        })

        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

/**
 * Updates bed turnover status and broadcasts instantly to nursing coordinators
 */
export async function updateBedStatusRealtimeAction(
    bedId: string, 
    newStatus: 'available' | 'occupied' | 'cleaning' | 'maintenance',
    patientName?: string
) {
    const session = await auth()
    if (!session?.user?.tenantId) return { success: false, error: 'Unauthorized' }

    try {
        const bed = await prisma.hms_bed.update({
            where: { id: bedId },
            data: { status: newStatus },
            include: { hms_ward: { select: { id: true, name: true } } }
        })

        eventBus.publishBedEvent(session.user.tenantId, {
            eventType: newStatus === 'available' 
                ? 'BED_AVAILABLE' 
                : newStatus === 'occupied' 
                    ? 'BED_OCCUPIED' 
                    : newStatus === 'cleaning' 
                        ? 'BED_CLEANING' 
                        : 'BED_MAINTENANCE',
            bedId: bed.id,
            bedNo: bed.bed_no,
            wardId: bed.hms_ward?.id,
            wardName: bed.hms_ward?.name,
            status: newStatus,
            patientName,
            timestamp: new Date().toISOString()
        })

        return { success: true, bed }
    } catch (err: any) {
        console.error('[REALTIME-BEDS] Update bed error:', err)
        return { success: false, error: err.message }
    }
}
