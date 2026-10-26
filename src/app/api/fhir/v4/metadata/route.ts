import { NextResponse } from 'next/server'
import { FHIRCapabilityStatement } from '@/lib/fhir/types'

export async function GET() {
    const capabilityStatement: FHIRCapabilityStatement = {
        resourceType: 'CapabilityStatement',
        id: 'ziona-hms-fhir-r4',
        status: 'active',
        date: new Date().toISOString(),
        publisher: 'Ziona Healthcare Systems',
        kind: 'instance',
        software: {
            name: 'Ziona Tier-1 Hospital Information System',
            version: '2026.4.1'
        },
        implementation: {
            description: 'Ziona HMS Certified HL7 FHIR R4 REST API Server',
            url: '/api/fhir/v4'
        },
        fhirVersion: '4.0.1',
        format: ['application/fhir+json', 'application/json'],
        rest: [
            {
                mode: 'server',
                resource: [
                    {
                        type: 'Patient',
                        interaction: [{ code: 'read' }, { code: 'search-type' }],
                        searchParam: [
                            { name: '_id', type: 'token' },
                            { name: 'name', type: 'string' },
                            { name: 'gender', type: 'token' }
                        ]
                    },
                    {
                        type: 'Observation',
                        interaction: [{ code: 'read' }, { code: 'search-type' }],
                        searchParam: [
                            { name: 'patient', type: 'reference' },
                            { name: 'category', type: 'token' },
                            { name: 'code', type: 'token' }
                        ]
                    },
                    {
                        type: 'MedicationRequest',
                        interaction: [{ code: 'read' }, { code: 'search-type' }],
                        searchParam: [
                            { name: 'patient', type: 'reference' },
                            { name: 'status', type: 'token' }
                        ]
                    }
                ]
            }
        ]
    }

    return NextResponse.json(capabilityStatement, {
        headers: {
            'Content-Type': 'application/fhir+json; charset=utf-8',
            'X-FHIR-Version': '4.0.1'
        }
    })
}
