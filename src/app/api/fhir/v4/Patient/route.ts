import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateFHIRRequest } from '@/lib/fhir/auth'
import { toFHIRPatient, toFHIRBundle } from '@/lib/fhir/mappers'

export async function GET(req: NextRequest) {
    const auth = await authenticateFHIRRequest(req)
    if (!auth.authenticated) return auth.errorResponse!

    try {
        const { searchParams } = new URL(req.url)
        const nameQuery = searchParams.get('name')
        const genderQuery = searchParams.get('gender')
        const idQuery = searchParams.get('_id')
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('_count') || '50')))

        const where: any = {
            tenant_id: auth.tenantId
        }

        if (idQuery) where.id = idQuery
        if (genderQuery) where.gender = { equals: genderQuery, mode: 'insensitive' }
        if (nameQuery) {
            where.OR = [
                { first_name: { contains: nameQuery, mode: 'insensitive' } },
                { last_name: { contains: nameQuery, mode: 'insensitive' } },
                { full_name: { contains: nameQuery, mode: 'insensitive' } }
            ]
        }

        const patients = await prisma.hms_patient.findMany({
            where,
            take: limit,
            orderBy: { created_at: 'desc' }
        })

        const fhirPatients = patients.map(p => toFHIRPatient(p))
        const bundle = toFHIRBundle(fhirPatients, 'searchset')

        return NextResponse.json(bundle, {
            headers: {
                'Content-Type': 'application/fhir+json; charset=utf-8'
            }
        })
    } catch (err: any) {
        console.error('[FHIR-PATIENT-SEARCH] Error:', err)
        return NextResponse.json({
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }]
        }, { status: 500, headers: { 'Content-Type': 'application/fhir+json; charset=utf-8' } })
    }
}
