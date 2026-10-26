import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signMobileToken, mobileResponse } from '@/lib/mobile-auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        const normalizedEmail = email.toLowerCase().trim()

        // 1. Find User Account
        const user = await prisma.app_user.findFirst({
            where: { email: normalizedEmail }
        })

        if (!user || !user.password) {
            return NextResponse.json({ error: 'Invalid clinician credentials' }, { status: 401 })
        }

        // 2. Validate Password
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid clinician credentials' }, { status: 401 })
        }

        // 3. Link Clinician Profile
        const clinician = await prisma.hms_clinicians.findFirst({
            where: {
                tenant_id: user.tenant_id,
                email: normalizedEmail
            },
            
        })

        const doctorName = clinician
            ? `${clinician.salutation || 'Dr.'} ${clinician.first_name} ${clinician.last_name}`
            : user.name || 'Doctor'

        // 4. Issue 2050 Mobile JWT
        const token = await signMobileToken({
            sub: user.id,
            clinicianId: clinician?.id,
            tenantId: user.tenant_id,
            role: 'DOCTOR',
            name: doctorName,
            email: normalizedEmail,
            branchId: (clinician as any)?.branch_id || undefined
        })

        return mobileResponse({
            token,
            tokenType: 'Bearer',
            expiresIn: '30d',
            doctor: {
                userId: user.id,
                clinicianId: clinician?.id,
                name: doctorName,
                specialization: clinician?.specialization || 'General Practitioner',
                department: 'OPD',
                employeeId: clinician?.employee_id,
                avatar: clinician?.profile_image_url
            }
        }, 200, 'DoctorAuthBundle')

    } catch (error: any) {
        console.error('[MOBILE-DOCTOR-AUTH] Error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}


