import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateFHIRRequest } from '@/lib/fhir/auth'
import { 
    toFHIRPatient, 
    toFHIRObservations, 
    toFHIRMedicationRequest, 
    toFHIRBundle 
} from '@/lib/fhir/mappers'
import { logPhiAccess } from '@/lib/hipaa-audit'

/**
 * FHIR R4 Patient $everything Operation (HL7 Standard)
 * Bundles entire patient health history (Demographics + LOINC Vitals + Medications)
 */
export async function GET(
    req: NextRequest, 
    props: { params: Promise<{ id: string }> }
) {
    const auth = await authenticateFHIRRequest(req)
    if (!auth.authenticated) return auth.errorResponse!

    try {
        const { id } = await props.params

        const [patient, vitals, prescriptions] = await Promise.all([
            prisma.hms_patient.findFirst({
                where: { id, tenant_id: auth.tenantId }
            }),
            prisma.hms_vitals.findMany({
                where: { patient_id: id, tenant_id: auth.tenantId },
                orderBy: { recorded_at: 'desc' },
                take: 50
            }),
            prisma.prescription.findMany({
                where: { patient_id: id, tenant_id: auth.tenantId },
                include: {
                    prescription_items: {
                        include: { hms_product: { select: { name: true, sku: true } } }
                    }
                },
                orderBy: { created_at: 'desc' },
                take: 50
            })
        ])

        if (!patient) {
            return NextResponse.json({
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'not-found', diagnostics: `Patient with ID "${id}" was not found.` }]
            }, { status: 404, headers: { 'Content-Type': 'application/fhir+json; charset=utf-8' } })
        }

        // 1. FHIR Patient Resource
        const fhirPatient = toFHIRPatient(patient)

        // 2. FHIR Observations (LOINC Coded)
        const fhirObservations = vitals.flatMap(v => toFHIRObservations(v, id))

        // 3. FHIR MedicationRequests
        const fhirMedRequests = prescriptions.flatMap(p => 
            p.prescription_items.map(item => toFHIRMedicationRequest(p, item))
        )

        // 4. Assemble Bundle
        const allResources = [fhirPatient, ...fhirObservations, ...fhirMedRequests]
        const bundle = toFHIRBundle(allResources, 'collection')

        // 5. HIPAA Compliance Audit Log for ePHI Export
        logPhiAccess({
            patientId: id,
            tenantId: auth.tenantId,
            actorId: auth.userId || null,
            action: 'EXPORT',
            resource: 'PATIENT_CHART',
            reason: 'FHIR R4 $everything Clinical Data Export',
            metadata: {
                totalResourcesExported: allResources.length,
                protocol: 'HL7_FHIR_R4'
            }
        }).catch(err => console.error('[HIPAA-AUDIT] Non-blocking FHIR export log error:', err))

        return NextResponse.json(bundle, {
            headers: {
                'Content-Type': 'application/fhir+json; charset=utf-8',
                'X-FHIR-Version': '4.0.1'
            }
        })
    } catch (err: any) {
        console.error('[FHIR-EVERYTHING] Error:', err)
        return NextResponse.json({
            resourceType: 'OperationOutcome',
            issue: [{ severity: 'error', code: 'exception', diagnostics: err.message }]
        }, { status: 500, headers: { 'Content-Type': 'application/fhir+json; charset=utf-8' } })
    }
}
