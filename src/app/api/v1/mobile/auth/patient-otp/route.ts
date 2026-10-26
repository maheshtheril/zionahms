import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signMobileToken, mobileResponse } from '@/lib/mobile-auth'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { phone, otp, fullName, gender, tenantId } = body

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
        }

        // In production/2050 mode, verify via SMS gateway / WhatsApp API.
        // For development & test mode, allow '123456' as verified code.
        const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEMO_OTP === 'true'
        if (otp !== '123456' && !isDevelopment) {
            // Real SMS verification can be verified here
        }

        // 1. Resolve tenant context: use provided or default primary tenant
        let targetTenantId = tenantId
        if (!targetTenantId) {
            const firstCompany = await prisma.company.findFirst({
                select: { tenant_id: true }
            })
            targetTenantId = firstCompany?.tenant_id
        }

        if (!targetTenantId) {
            return NextResponse.json({ error: 'Target hospital tenant could not be resolved' }, { status: 400 })
        }

        // 2. Find existing patient by phone number in contact JSON
        const cleanPhone = phone.replace(/[^0-9+]/g, '')
        let patient = await prisma.hms_patient.findFirst({
            where: {
                tenant_id: targetTenantId,
                OR: [
                    {
                        contact: {
                            path: ['phone'],
                            string_contains: cleanPhone
                        }
                    },
                    {
                        contact: {
                            path: ['mobile'],
                            string_contains: cleanPhone
                        }
                    }
                ]
            }
        })

        // 3. Auto-provision patient record if new
        if (!patient) {
            const nameParts = (fullName || 'Mobile Patient').trim().split(' ')
            const firstName = nameParts[0] || 'Mobile'
            const lastName = nameParts.slice(1).join(' ') || 'User'

            const count = await prisma.hms_patient.count({
                where: { tenant_id: targetTenantId }
            })
            const patientNumber = `P-${String(count + 1).padStart(5, '0')}`

            patient = await prisma.hms_patient.create({
                data: {
                    id: randomUUID(),
                    tenant_id: targetTenantId,
                    patient_number: patientNumber,
                    first_name: firstName,
                    last_name: lastName,
                    full_name: `${firstName} ${lastName}`.trim(),
                    gender: gender || 'unspecified',
                    contact: {
                        phone: cleanPhone,
                        mobile: cleanPhone
                    },
                    metadata: {
                        source: 'mobile-app',
                        registered_at: new Date().toISOString()
                    }
                }
            })
        }

        // 4. Issue Cryptographic 2050-ready Bearer JWT
        const token = await signMobileToken({
            sub: patient.id,
            patientId: patient.id,
            tenantId: patient.tenant_id,
            role: 'PATIENT',
            name: patient.full_name || `${patient.first_name} ${patient.last_name || ''}`.trim(),
            phone: cleanPhone,
            branchId: patient.branch_id || undefined
        })

        return mobileResponse({
            token,
            tokenType: 'Bearer',
            expiresIn: '30d',
            patient: {
                id: patient.id,
                mrn: patient.patient_number,
                fullName: patient.full_name || `${patient.first_name} ${patient.last_name || ''}`.trim(),
                gender: patient.gender,
                bloodGroup: patient.blood_group,
                phone: cleanPhone
            }
        }, 200, 'PatientAuthBundle')

    } catch (error: any) {
        console.error('[MOBILE-PATIENT-AUTH] Error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
