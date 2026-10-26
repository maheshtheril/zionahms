import { describe, it, expect } from 'vitest'
import { signMobileToken, verifyMobileAuth } from '../lib/mobile-auth'

describe('2050 Mobile Security & JWT Layer', () => {
    it('signs and verifies a cryptographic 2050 mobile token for patient', async () => {
        const payload = {
            sub: 'patient-test-uuid-1234',
            patientId: 'patient-test-uuid-1234',
            tenantId: 'tenant-test-uuid-5678',
            role: 'PATIENT' as const,
            name: 'John Doe',
            phone: '+919876543210'
        }

        const token = await signMobileToken(payload, '30d')
        expect(token).toBeDefined()
        expect(typeof token).toBe('string')
        expect(token.split('.').length).toBe(3)

        // Mock incoming HTTP request with Bearer token
        const req = new Request('https://api.hms.local/v1/mobile/patient/records', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const authResult = await verifyMobileAuth(req)
        expect(authResult.authenticated).toBe(true)
        expect(authResult.payload?.sub).toBe(payload.sub)
        expect(authResult.payload?.role).toBe('PATIENT')
        expect(authResult.payload?.name).toBe('John Doe')
        expect(authResult.payload?.tenantId).toBe(payload.tenantId)
    })

    it('signs and verifies a doctor role token with clinician binding', async () => {
        const payload = {
            sub: 'user-doctor-uuid-9999',
            clinicianId: 'clinician-uuid-8888',
            tenantId: 'tenant-test-uuid-5678',
            role: 'DOCTOR' as const,
            name: 'Dr. Sarah Connor',
            email: 'sarah.connor@hospital.com'
        }

        const token = await signMobileToken(payload, '30d')
        const req = new Request('https://api.hms.local/v1/mobile/doctor/queue', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })

        const authResult = await verifyMobileAuth(req)
        expect(authResult.authenticated).toBe(true)
        expect(authResult.payload?.role).toBe('DOCTOR')
        expect(authResult.payload?.clinicianId).toBe('clinician-uuid-8888')
    })

    it('rejects unauthenticated requests or expired/tampered tokens', async () => {
        const reqWithoutAuth = new Request('https://api.hms.local/v1/mobile/patient/records')
        const res1 = await verifyMobileAuth(reqWithoutAuth)
        expect(res1.authenticated).toBe(false)
        expect(res1.errorResponse).toBeDefined()

        const reqTampered = new Request('https://api.hms.local/v1/mobile/patient/records', {
            headers: {
                Authorization: 'Bearer invalid.tampered.signature'
            }
        })
        const res2 = await verifyMobileAuth(reqTampered)
        expect(res2.authenticated).toBe(false)
    })
})
