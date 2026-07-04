'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { format } from "date-fns"

export type PunchData = {
    lat?: number;
    lng?: number;
    ip?: string;
    city?: string;
    userAgent?: string;
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

export async function getStaffAttendanceStatus() {
    const session = await auth()
    if (!session?.user?.id) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    try {
        const [attendance, rosterEntry] = await Promise.all([
            prisma.hms_staff_attendance.findFirst({
                where: {
                    user_id: session.user.id,
                    check_in: { gte: today, lt: tomorrow }
                },
                orderBy: { check_in: 'desc' }
            }),
            prisma.hms_staff_roster.findFirst({
                where: {
                    user_id: session.user.id,
                    date: { gte: today, lt: tomorrow }
                }
            })
        ])

        // If rostered, fetch shift details
        let shift = null
        if (rosterEntry) {
            shift = await prisma.hms_staff_shift.findUnique({
                where: { id: rosterEntry.shift_id }
            })
        }

        return {
            attendance,
            roster: rosterEntry ? { ...rosterEntry, shift } : null
        }
    } catch (error) {
        console.error("Failed to fetch attendance context:", error)
        return null
    }
}

export async function punchIn(data: PunchData) {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.tenantId) {
        return { error: "Not authenticated" }
    }

    try {
        // 1. Fetch current status and roster context
        const context = await getStaffAttendanceStatus()
        const existing = context?.attendance
        if (existing && !existing.check_out) {
            return { error: "Already punched in" }
        }

        const roster = context?.roster
        let status = 'present'
        const meta: any = { ...data }

        // 2. Logic: Determine if Late
        if (roster?.shift) {
            const now = new Date()
            const [shiftHours, shiftMinutes] = roster.shift.start_time.split(':').map(Number)
            const shiftStartTime = new Date(now)
            shiftStartTime.setHours(shiftHours, shiftMinutes, 0, 0)

            const graceMs = (roster.shift.grace_period || 15) * 60 * 1000
            if (now.getTime() > shiftStartTime.getTime() + graceMs) {
                status = 'late'
                meta.late_minutes = Math.floor((now.getTime() - shiftStartTime.getTime()) / (60 * 1000))
            }
        }
        // 2.5 Geofencing Validation
        // Bypass if accessed via Local LAN (Host header indicates local IP or .local domain)
        const headersList = await headers();
        const host = headersList.get('host') || '';
        const isLocalNetwork = host.startsWith('192.168.') || 
                               host.startsWith('10.') || 
                               host.startsWith('172.') || 
                               host.startsWith('localhost') || 
                               host.includes('.local');

        if (!isLocalNetwork) {
            const branches = await prisma.hms_branch.findMany({
                where: { company_id: session.user.companyId, is_active: true }
            });

            let isWithinAnyGeofence = false;
            let geofenceEnabled = false;
            let closestDistance = Infinity;
            let closestRadius = 0;

            for (const branch of branches) {
                if (branch.metadata) {
                    const metadata = branch.metadata as any;
                    if (metadata.geofence && metadata.geofence.lat && metadata.geofence.lng && metadata.geofence.radius_meters) {
                        geofenceEnabled = true;
                        
                        // Only calculate distance if we actually received GPS data
                        if (data.lat && data.lng) {
                            const branchLat = parseFloat(metadata.geofence.lat);
                            const branchLng = parseFloat(metadata.geofence.lng);
                            const radius = parseInt(metadata.geofence.radius_meters);

                            const distance = getDistanceInMeters(data.lat, data.lng, branchLat, branchLng);
                            
                            if (distance < closestDistance) {
                                closestDistance = distance;
                                closestRadius = radius;
                            }

                            if (distance <= radius) {
                                isWithinAnyGeofence = true;
                                break;
                            }
                        }
                    }
                }
            }

            // Block 1: Geofence is required, but user provided NO GPS data (e.g., blocked permission)
            if (geofenceEnabled && (!data.lat || !data.lng)) {
                return { error: `Security block: You are not connected to the hospital WiFi. Please enable GPS Location to clock in remotely.` };
            }

            // Block 2: User provided GPS, but is too far away
            if (geofenceEnabled && !isWithinAnyGeofence) {
                return { error: `Geofence block: You are ${Math.round(closestDistance)} meters away from the nearest office. Allowed radius is ${closestRadius} meters.` };
            }
        }

        // 3. Commit Sequence
        const attendance = await prisma.hms_staff_attendance.create({
            data: {
                tenant_id: session.user.tenantId,
                company_id: session.user.companyId,
                user_id: session.user.id,
                location_in: {
                    lat: data.lat,
                    lng: data.lng,
                    ip: data.ip,
                    city: data.city
                },
                device_info: {
                    userAgent: data.userAgent
                },
                status: status,
                metadata: meta
            }
        })

        revalidatePath('/')
        return { success: true, data: attendance }
    } catch (error) {
        console.error("Punch in failed:", error)
        return { error: "System failure during punch-in" }
    }
}

export async function punchOut(attendanceId: string, data: PunchData) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    try {
        const attendance = await prisma.hms_staff_attendance.update({
            where: { id: attendanceId },
            data: {
                check_out: new Date(),
                location_out: {
                    lat: data.lat,
                    lng: data.lng,
                    ip: data.ip,
                    city: data.city
                }
            }
        })

        revalidatePath('/')
        return { success: true, data: attendance }
    } catch (error) {
        console.error("Punch out failed:", error)
        return { error: "System failure during punch-out" }
    }
}

export async function getAttendanceHistory(limit = 10) {
    const session = await auth()
    if (!session?.user?.id) return []

    try {
        return await prisma.hms_staff_attendance.findMany({
            where: { user_id: session.user.id },
            orderBy: { check_in: 'desc' },
            take: limit
        })
    } catch (error) {
        console.error("History fetch failed:", error)
        return []
    }
}

export async function getAllStaffAttendance(date?: Date) {
    const session = await auth()
    if (!session?.user?.tenantId) return []

    const targetDate = date || new Date()
    targetDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(targetDate)
    nextDay.setDate(targetDate.getDate() + 1)

    try {
        const logs = await prisma.hms_staff_attendance.findMany({
            where: {
                tenant_id: session.user.tenantId,
                check_in: {
                    gte: targetDate,
                    lt: nextDay
                }
            },
            orderBy: { check_in: 'desc' }
        })

        // Fetch user details manually since we aren't using include due to potential relation issues
        const userIds = [...new Set(logs.map(l => l.user_id))]
        const users = await prisma.app_user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true }
        })
        const userMap = new Map(users.map(u => [u.id, u]))

        return logs.map(log => ({
            ...log,
            user: userMap.get(log.user_id) || { name: 'Unknown User', email: '' }
        }))
    } catch (error) {
        console.error("Global attendance fetch failed:", error)
        return []
    }
}

export async function getShifts() {
    const session = await auth()
    if (!session?.user?.tenantId) return []

    try {
        return await prisma.hms_staff_shift.findMany({
            where: { tenant_id: session.user.tenantId, is_active: true },
            orderBy: { start_time: 'asc' }
        })
    } catch (error) {
        console.error("Failed to fetch shifts:", error)
        return []
    }
}

export async function createShift(data: { name: string, start_time: string, end_time: string, color?: string, work_days: string[] }) {
    const session = await auth()
    if (!session?.user?.tenantId) return { error: "Unauthorized" }

    try {
        const shift = await prisma.hms_staff_shift.create({
            data: {
                tenant_id: session.user.tenantId,
                company_id: session.user.companyId,
                ...data
            }
        })
        revalidatePath('/hms/attendance/roster')
        return { success: true, data: shift }
    } catch (error) {
        return { error: "Failed to create shift" }
    }
}

export async function getRoster(startDate: Date, endDate: Date) {
    const session = await auth()
    if (!session?.user?.tenantId) return []

    try {
        return await prisma.hms_staff_roster.findMany({
            where: {
                tenant_id: session.user.tenantId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        })
    } catch (error) {
        console.error("Failed to fetch roster:", error)
        return []
    }
}

export async function assignStaffToShift(userId: string, shiftId: string, date: Date) {
    const session = await auth()
    if (!session?.user?.tenantId) return { error: "Unauthorized" }

    try {
        // Clear existing assignment for that user/date if any
        await prisma.hms_staff_roster.deleteMany({
            where: {
                tenant_id: session.user.tenantId,
                user_id: userId,
                date: date
            }
        })

        const roster = await prisma.hms_staff_roster.create({
            data: {
                tenant_id: session.user.tenantId,
                company_id: session.user.companyId,
                user_id: userId,
                shift_id: shiftId,
                date: date
            }
        })
        revalidatePath('/hms/attendance/roster')
        return { success: true, data: roster }
    } catch (error) {
        return { error: "Failed to assign roster" }
    }
}

export async function removeStaffFromShift(rosterId: string) {
    const session = await auth()
    if (!session?.user?.tenantId) return { error: "Unauthorized" }

    try {
        await prisma.hms_staff_roster.delete({
            where: { id: rosterId, tenant_id: session.user.tenantId }
        })
        revalidatePath('/hms/attendance/roster')
        return { success: true }
    } catch (error) {
        return { error: "Failed to retract deployment" }
    }
}

export async function getAttendanceAnalytics() {
    const session = await auth()
    if (!session?.user?.id || !session?.user?.tenantId) return null

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    try {
        const history = await prisma.hms_staff_attendance.findMany({
            where: {
                tenant_id: session.user.tenantId,
                check_in: { gte: thirtyDaysAgo }
            },
            orderBy: { check_in: 'desc' }
        })

        const totalRecords = history.length
        if (totalRecords === 0) return null

        const lateCount = history.filter(h => h.status === 'late').length
        const totalDurationMs = history.reduce((acc, curr) => {
            if (curr.check_out && curr.check_in) {
                return acc + (new Date(curr.check_out).getTime() - new Date(curr.check_in).getTime())
            }
            return acc
        }, 0)

        // Aggregating by day for a trend chart
        const dailyTrends: Record<string, number> = {}
        history.forEach(h => {
            const date = format(new Date(h.check_in), 'MMM dd')
            dailyTrends[date] = (dailyTrends[date] || 0) + 1
        })

        return {
            summary: {
                totalPunches: totalRecords,
                punctualityRate: Math.round(((totalRecords - lateCount) / totalRecords) * 100),
                totalLate: lateCount,
                avgHoursPerShift: Math.round((totalDurationMs / (1000 * 60 * 60 * totalRecords)) * 10) / 10
            },
            trends: Object.entries(dailyTrends).map(([name, value]) => ({ name, value })).reverse()
        }
    } catch (error) {
        console.error("Analytics failure:", error)
        return null
    }
}
