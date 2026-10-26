import { SignJWT, jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'

// Cryptographic Secret Key instance - uses standard W3C WebCrypto CryptoKey
const rawSecret = process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'ziona-hms-future-core-2050-secure-jwt-key-entropy-must-be-long-enough'

async function getCryptoKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(rawSecret)
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    )
}

export type MobileRole = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN'

export interface MobileAuthPayload {
    sub: string             // Unique subject ID (userId or patientId)
    tenantId: string        // Multitenant boundary
    role: MobileRole        // Role definition
    name: string            // Display name
    patientId?: string      // Bound patient record ID (if role == PATIENT)
    clinicianId?: string    // Bound clinician ID (if role == DOCTOR)
    branchId?: string       // Associated facility/branch
    phone?: string          // Verified phone number
    email?: string          // Verified email address
    exp?: number            // Expiry timestamp
    iat?: number            // Issued at
}

/**
 * Signs a cryptographic JWT Bearer Token for mobile clients (Patients & Doctors)
 * Default validity: 30 days for mobile devices
 */
export async function signMobileToken(payload: Omit<MobileAuthPayload, 'exp' | 'iat'>, expiresIn: string = '30d'): Promise<string> {
    const key = await getCryptoKey()
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt()
        .setIssuer('urn:hms:mobile:auth')
        .setAudience('urn:hms:mobile:client')
        .setExpirationTime(expiresIn)
        .sign(key)
}

/**
 * Validates the Authorization Bearer token from incoming mobile requests
 */
export async function verifyMobileAuth(req: NextRequest | Request): Promise<{
    authenticated: boolean
    payload?: MobileAuthPayload
    errorResponse?: NextResponse
}> {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            authenticated: false,
            errorResponse: NextResponse.json({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'security',
                    details: { text: 'Missing or malformed Authorization Bearer header' }
                }]
            }, { status: 401 })
        }
    }

    const token = authHeader.substring(7).trim()

    try {
        const key = await getCryptoKey()
        const { payload } = await jwtVerify(token, key, {
            issuer: 'urn:hms:mobile:auth',
            audience: 'urn:hms:mobile:client'
        })

        return {
            authenticated: true,
            payload: payload as unknown as MobileAuthPayload
        }
    } catch (err: any) {
        return {
            authenticated: false,
            errorResponse: NextResponse.json({
                resourceType: 'OperationOutcome',
                issue: [{
                    severity: 'error',
                    code: 'expired-or-invalid',
                    details: { text: `Invalid authentication token: ${err.message}` }
                }]
            }, { status: 401 })
        }
    }
}

/**
 * Standard 2050 Response Envelope for Mobile APIs
 */
export function mobileResponse(data: any, status: number = 200, resourceType?: string) {
    return NextResponse.json({
        resourceType: resourceType || (data?.resourceType ?? 'Bundle'),
        meta: {
            apiVersion: '2050.1-preview',
            timestamp: new Date().toISOString(),
            poweredBy: 'Ziona Neural Healthcare Engine'
        },
        data
    }, { status })
}
