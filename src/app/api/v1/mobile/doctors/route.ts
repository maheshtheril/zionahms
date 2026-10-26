import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mobileResponse } from '@/lib/mobile-auth'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const tenantId = searchParams.get('tenantId')

        const whereClause: any = { is_active: true }
        if (tenantId) whereClause.tenant_id = tenantId

        const doctors = await prisma.hms_clinicians.findMany({
            where: whereClause,
            include: {
                hms_specializations: { select: { id: true, name: true } },
                hms_roles: { select: { name: true } }
            },
            orderBy: { first_name: 'asc' },
            take: 50
        })

        const mapped = doctors.map(doc => ({
            id: doc.id,
            name: `${doc.salutation || 'Dr.'} ${doc.first_name} ${doc.last_name}`.trim(),
            specialization: doc.hms_specializations?.name || doc.specialization || 'General Medicine',
            department: doc.designation || 'Consultant',
            experienceYears: doc.experience_years || 5,
            consultationFee: doc.consultation_fee ? Number(doc.consultation_fee) : 500,
            slotDurationMinutes: doc.consultation_slot_duration || 15,
            startTime: doc.consultation_start_time || '09:00',
            endTime: doc.consultation_end_time || '17:00',
            workingDays: doc.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            avatar: doc.profile_image_url
        }))

        return mobileResponse(mapped, 200, 'ClinicianDirectoryBundle')
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
