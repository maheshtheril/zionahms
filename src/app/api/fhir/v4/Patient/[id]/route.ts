import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateFHIRRequest } from '@/lib/fhir/auth'
import { toFHIRPatient } from '@/lib/fhir/mappers'

export async function GET(
    req: NextRequest, 
    props: { params: Promise<{ id: string }> }
) {
    const auth = await authenticateFHIRRequest(req)
    if (!auth.authenticated) return auth.errorResponse!

    try {
        const { id } = await props.params

        const patient = await prisma.hms_patient.findFirst({
            where: {
                id,
                tenant_id: auth.tenantId
            }
        })

        if (!patient) {
            return NextResponse.json({
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'not-found', diagnostics: `Patient with ID "${id}" was not found.` }]
            }, { status: 404, headers: { 'Content-Type': 'application/fhir+json; charset=utf-8' } })
        }

        const fhirPatient = toFHIRPatient(patient)

        return NextResponse.json(fhirPatient, {
            headers: {
                'Content-Type': 'application/fhir+json; charset=utf-8'
            }
        })
    } catch (err: any) {
        console.error('[FHIR-PATIENT-GET] Error:', err)
        return NextResponse.json({
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }]
        }, { status: 500, headers: { 'Content-Type': 'application/fhir+json; charset=utf-8' } })
    }
}
