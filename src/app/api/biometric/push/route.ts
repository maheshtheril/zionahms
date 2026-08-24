import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Biometric Hardware Machine Webhook API Endpoint
 * Accepts automated punch records pushed from hardware devices (ZKTeco, ESSL, Matrix, Hikvision).
 * 
 * Expected payload (JSON or Form-Data):
 * {
 *   "apiKey": "SECRET_KEY",
 *   "userCode": "EMP-001" or userId,
 *   "timestamp": "2026-08-24 09:00:00",
 *   "punchType": "in" | "out",
 *   "deviceSerial": "ZKT-998877"
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { apiKey, userCode, timestamp, punchType, deviceSerial } = body;

        if (!userCode || !timestamp) {
            return NextResponse.json({ error: "Missing userCode or timestamp" }, { status: 400 });
        }

        // Validate API Secret key if configured
        const expectedSecret = process.env.BIOMETRIC_API_SECRET || "BIOMETRIC_SECRET_2035";
        if (apiKey && apiKey !== expectedSecret) {
            return NextResponse.json({ error: "Unauthorized: Invalid Biometric API Key" }, { status: 401 });
        }

        // Find user by employee code / MRN / user_id
        const user = await prisma.hms_user.findFirst({
            where: {
                OR: [
                    { id: userCode },
                    { email: userCode }
                ]
            }
        });

        if (!user) {
            return NextResponse.json({ error: `Staff member '${userCode}' not found` }, { status: 404 });
        }

        const punchTime = new Date(timestamp);

        if (punchType === 'out') {
            // Find open attendance record
            const activeAttendance = await prisma.hms_staff_attendance.findFirst({
                where: { user_id: user.id, check_out: null },
                orderBy: { check_in: 'desc' }
            });

            if (activeAttendance) {
                await prisma.hms_staff_attendance.update({
                    where: { id: activeAttendance.id },
                    data: {
                        check_out: punchTime,
                        metadata: {
                            ...(activeAttendance.metadata as any || {}),
                            check_out_device: deviceSerial || 'Biometric-Hardware'
                        }
                    }
                });
                return NextResponse.json({ success: true, message: `Punch-OUT recorded for ${user.name || user.email}` });
            }
        }

        // Default: Punch IN
        const attendance = await prisma.hms_staff_attendance.create({
            data: {
                tenant_id: user.tenant_id,
                company_id: user.company_id || user.tenant_id,
                user_id: user.id,
                check_in: punchTime,
                status: 'present',
                metadata: {
                    device_serial: deviceSerial || 'Biometric-Hardware-Terminal',
                    source: 'hardware_push_api'
                }
            }
        });

        return NextResponse.json({
            success: true,
            attendanceId: attendance.id,
            message: `Punch-IN recorded for ${user.name || user.email} at ${punchTime.toISOString()}`
        });

    } catch (err: any) {
        console.error("[Biometric Push API Error]", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
