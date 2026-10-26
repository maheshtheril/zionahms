import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateFHIRRequest } from '@/lib/fhir/auth'
import { toFHIRMedicationRequest, toFHIRBundle } from '@/lib/fhir/mappers'

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

        const prescriptions = await prisma.prescription.findMany({
            where,
            include: {
                prescription_items: {
                    include: { hms_product: { select: { name: true, sku: true } } }
                }
            },
            take: limit,
            orderBy: { created_at: 'desc' }
        })

        const requests = prescriptions.flatMap(p => 
            p.prescription_items.map(item => toFHIRMedicationRequest(p, item))
        )

        const bundle = toFHIRBundle(requests, 'searchset')

        return NextResponse.json(bundle, {
            headers: {
                'Content-Type': 'application/fhir+json; charset=utf-8'
            }
        })
    } catch (err: any) {
        console.error('[FHIR-MEDICATIONREQUEST-SEARCH] Error:', err)
        return NextResponse.json({
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }]
        }, { status: 500, headers: { 'Content-Type': 'application/fhir+json; charset=utf-8' } })
    }
}
