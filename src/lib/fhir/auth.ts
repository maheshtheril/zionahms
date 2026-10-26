import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { verifyMobileAuth } from '@/lib/mobile-auth'

export interface FHIRAuthResult {
    authenticated: boolean
    tenantId: string
    userId?: string
    errorResponse?: NextResponse
}

/**
 * Resolves authentication for FHIR R4 endpoints.
 * Accepts NextAuth web session OR Authorization: Bearer <jwt> header.
 */
export async function authenticateFHIRRequest(req: NextRequest): Promise<FHIRAuthResult> {
    // 1. Try Bearer Token (Machine-to-Machine / Mobile)
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const tokenResult = await verifyMobileAuth(req)
        if (tokenResult.authenticated && tokenResult.payload?.tenantId) {
            return {
                authenticated: true,
                tenantId: tokenResult.payload.tenantId,
                userId: tokenResult.payload.sub
            }
        }
    }

    // 2. Try Web Session
    const session = await auth()
    if (session?.user?.tenantId) {
        return {
            authenticated: true,
            tenantId: session.user.tenantId,
            userId: session.user.id
        }
    }

    // 3. Fallback: Return standard FHIR OperationOutcome 401
    const operationOutcome = {
        resourceType: 'OperationOutcome',
        issue: [
            {
                severity: 'error',
                code: 'login',
                diagnostics: 'Authentication required. Provide active session cookie or valid Bearer token.'
            }
        ]
    }

    return {
        authenticated: false,
        tenantId: '',
        errorResponse: NextResponse.json(operationOutcome, {
            status: 401,
            headers: {
                'Content-Type': 'application/fhir+json; charset=utf-8',
                'WWW-Authenticate': 'Bearer realm="FHIR"'
            }
        })
    }
}
