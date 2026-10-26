/**
 * HL7 FHIR Release 4 (R4 - v4.0.1) TypeScript Specifications
 * Based on HL7.org FHIR Standard
 */

export interface FHIRCoding {
    system?: string
    code?: string
    display?: string
}

export interface FHIRCodeableConcept {
    coding?: FHIRCoding[]
    text?: string
}

export interface FHIRIdentifier {
    use?: 'usual' | 'official' | 'temp' | 'secondary'
    type?: FHIRCodeableConcept
    system?: string
    value?: string
}

export interface FHIRHumanName {
    use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'maiden'
    text?: string
    family?: string
    given?: string[]
    prefix?: string[]
    suffix?: string[]
}

export interface FHIRContactPoint {
    system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other'
    value?: string
    use?: 'home' | 'work' | 'temp' | 'old' | 'mobile'
}

export interface FHIRAddress {
    use?: 'home' | 'work' | 'temp' | 'old' | 'billing'
    type?: 'postal' | 'physical' | 'both'
    text?: string
    line?: string[]
    city?: string
    district?: string
    state?: string
    postalCode?: string
    country?: string
}

export interface FHIRReference {
    reference?: string
    type?: string
    display?: string
}

export interface FHIRQuantity {
    value?: number
    unit?: string
    system?: string
    code?: string
}

export interface FHIRMeta {
    versionId?: string
    lastUpdated?: string
    source?: string
    profile?: string[]
}

export interface FHIRPatient {
    resourceType: 'Patient'
    id: string
    meta?: FHIRMeta
    identifier?: FHIRIdentifier[]
    active?: boolean
    name?: FHIRHumanName[]
    telecom?: FHIRContactPoint[]
    gender?: 'male' | 'female' | 'other' | 'unknown'
    birthDate?: string
    address?: FHIRAddress[]
}

export interface FHIRObservationComponent {
    code: FHIRCodeableConcept
    valueQuantity?: FHIRQuantity
}

export interface FHIRObservation {
    resourceType: 'Observation'
    id: string
    meta?: FHIRMeta
    status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled'
    category?: FHIRCodeableConcept[]
    code: FHIRCodeableConcept
    subject: FHIRReference
    effectiveDateTime?: string
    issued?: string
    valueQuantity?: FHIRQuantity
    component?: FHIRObservationComponent[]
}

export interface FHIRMedicationRequest {
    resourceType: 'MedicationRequest'
    id: string
    meta?: FHIRMeta
    status: 'active' | 'on-hold' | 'cancelled' | 'completed' | 'entered-in-error' | 'stopped' | 'draft' | 'unknown'
    intent: 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option'
    medicationCodeableConcept: FHIRCodeableConcept
    subject: FHIRReference
    authoredOn?: string
    requester?: FHIRReference
    dosageInstruction?: Array<{
        text?: string
        timing?: {
            repeat?: {
                frequency?: number
                period?: number
                periodUnit?: 'd' | 'wk' | 'mo'
            }
        }
    }>
}

export interface FHIRBundleEntry<T = any> {
    fullUrl?: string
    resource: T
}

export interface FHIRBundle<T = any> {
    resourceType: 'Bundle'
    id: string
    meta?: FHIRMeta
    type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection'
    total?: number
    entry?: FHIRBundleEntry<T>[]
}

export interface FHIRCapabilityStatement {
    resourceType: 'CapabilityStatement'
    id: string
    status: 'draft' | 'active' | 'retired' | 'unknown'
    date: string
    publisher: string
    kind: 'instance' | 'capability' | 'requirements'
    software: {
        name: string
        version: string
    }
    implementation: {
        description: string
        url: string
    }
    fhirVersion: '4.0.1'
    format: string[]
    rest: Array<{
        mode: 'server'
        resource: Array<{
            type: string
            interaction: Array<{ code: string }>
            searchParam?: Array<{ name: string; type: string }>
        }>
    }>
}
