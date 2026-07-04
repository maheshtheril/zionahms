'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

const attendanceSchema = z.object({
    status: z.string().default('present'),
    notes: z.string().optional(),

    // Location Data
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    address: z.string().optional(),

    action: z.enum(['check_in', 'check_out']),
})

export type AttendanceFormState = {
    errors?: {
        [K in keyof z.infer<typeof attendanceSchema>]?: string[]
    }
    message?: string
}

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
        Math.cos(p1) * Math.cos(p2) *
        Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export async function logAttendance(prevState: AttendanceFormState, formData: FormData): Promise<AttendanceFormState> {
    const session = await auth()
    const user = session?.user

    if (!user || !user.tenantId) {
        return { message: 'Unauthorized' }
    }

    const validatedFields = attendanceSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields.',
        }
    }

    const { status, notes, lat, lng, address, action } = validatedFields.data
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    try {
        // Find today's record
        const existing = await prisma.crm_attendance.findFirst({
            where: {
                user_id: user.id,
                date: {
                    gte: today
                }
            }
        })

        const locationJson = (lat && lng) ? { lat, lng, address } : undefined
        
        // Geofencing Validation
        if (lat && lng) {
            const employee = await prisma.crm_employee.findUnique({
                where: { user_id: user.id },
                include: { branch: true }
            });
            
            if (employee?.branch?.metadata) {
                const metadata = employee.branch.metadata as any;
                if (metadata.geofence && metadata.geofence.lat && metadata.geofence.lng && metadata.geofence.radius_meters) {
                    const branchLat = parseFloat(metadata.geofence.lat);
                    const branchLng = parseFloat(metadata.geofence.lng);
                    const radius = parseInt(metadata.geofence.radius_meters);
                    
                    const distance = getDistanceInMeters(lat, lng, branchLat, branchLng);
                    
                    if (distance > radius) {
                        return { message: `Geofence block: You are ${Math.round(distance)} meters away from the office. Allowed radius is ${radius} meters.` };
                    }
                }
            }
        }

        if (action === 'check_in') {
            if (existing) {
                return { message: 'You have already checked in today.' }
            }
            await prisma.crm_attendance.create({
                data: {
                    tenant_id: user.tenantId,
                    user_id: user.id,
                    date: new Date(),
                    check_in: new Date(),
                    check_in_location: locationJson || {},
                    status,
                    notes
                }
            })
        } else {
            // Check Out
            if (!existing) {
                return { message: 'You must check in first.' }
            }
            await prisma.crm_attendance.update({
                where: { id: existing.id },
                data: {
                    check_out: new Date(),
                    check_out_location: locationJson || {},
                    notes: notes ? (existing.notes + '\n' + notes) : existing.notes
                }
            })
        }

    } catch (error) {
        console.error('Database Error:', error)
        return {
            message: 'Database Error: Failed to Log Attendance.',
        }
    }

    revalidatePath('/crm/attendance')
    redirect('/crm/attendance')
}
