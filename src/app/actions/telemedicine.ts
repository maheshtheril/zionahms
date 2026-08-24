'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface TelemedicineSession {
    roomId: string;
    appointmentId: string;
    patientId: string;
    patientName: string;
    doctorName: string;
    status: 'waiting' | 'in_progress' | 'completed';
    startedAt?: string;
}

export async function createOrGetTelemedicineRoom(appointmentId: string): Promise<{ success: boolean; data?: TelemedicineSession; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const appointment = await prisma.hms_appointments.findUnique({
            where: { id: appointmentId },
            include: {
                hms_patient: true,
                hms_clinician: true
            }
        });

        if (!appointment) {
            return { success: false, error: "Appointment not found." };
        }

        const roomId = `telehealth-${appointmentId.substring(0, 8)}`;
        const patientName = appointment.hms_patient ? `${appointment.hms_patient.first_name} ${appointment.hms_patient.last_name || ''}` : 'Patient';
        const doctorName = appointment.hms_clinician ? `${appointment.hms_clinician.first_name} ${appointment.hms_clinician.last_name || ''}` : 'Doctor';

        const roomSession: TelemedicineSession = {
            roomId,
            appointmentId,
            patientId: appointment.patient_id || '',
            patientName,
            doctorName,
            status: appointment.status === 'completed' ? 'completed' : 'in_progress',
            startedAt: new Date().toISOString()
        };

        return { success: true, data: roomSession };

    } catch (err: any) {
        console.error("[Telemedicine Server Action Error]", err);
        return { success: false, error: err.message || "Failed to initialize video session room." };
    }
}

export async function updateTelemedicineRoomStatus(appointmentId: string, status: 'completed' | 'cancelled') {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    try {
        await prisma.hms_appointments.update({
            where: { id: appointmentId },
            data: { status }
        });

        revalidatePath('/hms/doctor/dashboard');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
