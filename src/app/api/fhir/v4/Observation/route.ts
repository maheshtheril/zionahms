import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateFHIRRequest } from '@/lib/fhir/auth'
import { toFHIRObservations, toFHIRBundle } from '@/lib/fhir/mappers'

export async function GET(req: NextRequest) {
    const auth = await authenticateFHIRRequest(req)
    if (!auth.authenticated) return auth.errorResponse!

    try {
        const { searchParams } = new URL(req.url)
        const patientRef = searchParams.get('patient') || searchParams.get('subject')
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('_count') || '50')))

        const patientId = patientRef?.replace(/^Patient\//, '')

        const where: any = {
            tenant_id: auth.tenantId
        }

        if (patientId) {
            where.patient_id = patientId
        }

        const vitals = await prisma.hms_vitals.findMany({
            where,
            take: limit,
            orderBy: { recorded_at: 'desc' }
        })

        const observations = vitals.flatMap(v => toFHIRObservations(v, v.patient_id || undefined))
        const bundle = toFHIRBundle(observations, 'searchset')

        return NextResponse.json(bundle, {
            headers: {
                'Content-Type': 'application/fhir+json; charset=utf-8'
            }
        })
    } catch (err: any) {
        console.error('[FHIR-OBSERVATION-SEARCH] Error:', err)
        return NextResponse.json({
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }]
        }, { status: 500, headers: { 'Content-Type': 'application/fhir+json; charset=utf-8' } })
    }
}
