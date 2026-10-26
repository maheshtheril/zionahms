import { 
    FHIRPatient, 
    FHIRObservation, 
    FHIRMedicationRequest, 
    FHIRBundle, 
    FHIRHumanName, 
    FHIRContactPoint, 
    FHIRAddress 
} from './types'

/**
 * Maps Ziona HMS `hms_patient` model to official HL7 FHIR R4 `Patient` resource
 */
export function toFHIRPatient(patient: any): FHIRPatient {
    if (!patient) throw new Error('Patient record is null or undefined')

    const contact = (patient.contact as any) || {}
    const addressData = contact.address || {}

    // 1. Telecom
    const telecom: FHIRContactPoint[] = []
    if (contact.phone || patient.phone) {
        telecom.push({
            system: 'phone',
            value: contact.phone || patient.phone,
            use: 'mobile'
        })
    }
    if (contact.email || patient.email) {
        telecom.push({
            system: 'email',
            value: contact.email || patient.email,
            use: 'home'
        })
    }

    // 2. Address
    const address: FHIRAddress[] = []
    if (addressData.street || addressData.city || addressData.state) {
        address.push({
            use: 'home',
            line: addressData.street ? [addressData.street] : undefined,
            city: addressData.city,
            state: addressData.state,
            postalCode: addressData.zip || addressData.postalCode,
            country: addressData.country
        })
    }

    // 3. Name
    const names: FHIRHumanName[] = [{
        use: 'official',
        text: patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        family: patient.last_name || undefined,
        given: patient.first_name ? [patient.first_name] : undefined
    }]

    // 4. Gender
    let gender: 'male' | 'female' | 'other' | 'unknown' = 'unknown'
    const g = (patient.gender || '').toLowerCase().trim()
    if (g === 'male' || g === 'm') gender = 'male'
    else if (g === 'female' || g === 'f') gender = 'female'
    else if (g === 'other') gender = 'other'

    // 5. Birth Date
    let birthDate: string | undefined = undefined
    if (patient.dob) {
        try {
            birthDate = new Date(patient.dob).toISOString().split('T')[0]
        } catch {
            birthDate = undefined
        }
    }

    return {
        resourceType: 'Patient',
        id: patient.id,
        meta: {
            versionId: '1',
            lastUpdated: patient.updated_at ? new Date(patient.updated_at).toISOString() : new Date().toISOString(),
            profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
        },
        identifier: [
            {
                use: 'official',
                system: 'urn:oid:ziona:mrn',
                value: patient.patient_number || patient.id
            }
        ],
        active: patient.status !== 'inactive' && patient.status !== 'archived',
        name: names,
        telecom: telecom.length > 0 ? telecom : undefined,
        gender,
        birthDate,
        address: address.length > 0 ? address : undefined
    }
}

/**
 * Maps Ziona HMS `hms_vitals` record to HL7 FHIR R4 LOINC-coded `Observation` resources
 */
export function toFHIRObservations(vital: any, patientId?: string): FHIRObservation[] {
    if (!vital) return []
    const observations: FHIRObservation[] = []
    const subjectRef = {
        reference: `Patient/${vital.patient_id || patientId}`,
        type: 'Patient'
    }
    const effectiveDate = vital.recorded_at ? new Date(vital.recorded_at).toISOString() : new Date().toISOString()

    // 1. Blood Pressure (LOINC 85354-9 - Blood pressure panel)
    if (vital.systolic || vital.diastolic) {
        const components: any[] = []
        if (vital.systolic) {
            components.push({
                code: {
                    coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }],
                    text: 'Systolic blood pressure'
                },
                valueQuantity: {
                    value: Number(vital.systolic),
                    unit: 'mmHg',
                    system: 'http://unitsofmeasure.org',
                    code: 'mm[Hg]'
                }
            })
        }
        if (vital.diastolic) {
            components.push({
                code: {
                    coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }],
                    text: 'Diastolic blood pressure'
                },
                valueQuantity: {
                    value: Number(vital.diastolic),
                    unit: 'mmHg',
                    system: 'http://unitsofmeasure.org',
                    code: 'mm[Hg]'
                }
            })
        }

        observations.push({
            resourceType: 'Observation',
            id: `vital-bp-${vital.id}`,
            status: 'final',
            category: [{
                coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }]
            }],
            code: {
                coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }],
                text: 'Blood pressure'
            },
            subject: subjectRef,
            effectiveDateTime: effectiveDate,
            component: components
        })
    }

    // 2. Heart Rate / Pulse (LOINC 8867-4)
    if (vital.pulse) {
        observations.push({
            resourceType: 'Observation',
            id: `vital-pulse-${vital.id}`,
            status: 'final',
            category: [{
                coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }]
            }],
            code: {
                coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }],
                text: 'Heart rate'
            },
            subject: subjectRef,
            effectiveDateTime: effectiveDate,
            valueQuantity: {
                value: Number(vital.pulse),
                unit: 'beats/minute',
                system: 'http://unitsofmeasure.org',
                code: '/min'
            }
        })
    }

    // 3. Body Temperature (LOINC 8310-5)
    if (vital.temperature) {
        observations.push({
            resourceType: 'Observation',
            id: `vital-temp-${vital.id}`,
            status: 'final',
            category: [{
                coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }]
            }],
            code: {
                coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }],
                text: 'Body temperature'
            },
            subject: subjectRef,
            effectiveDateTime: effectiveDate,
            valueQuantity: {
                value: Number(vital.temperature),
                unit: 'degC',
                system: 'http://unitsofmeasure.org',
                code: 'Cel'
            }
        })
    }

    // 4. Oxygen Saturation SpO2 (LOINC 2708-6 / 59408-5)
    if (vital.spo2) {
        observations.push({
            resourceType: 'Observation',
            id: `vital-spo2-${vital.id}`,
            status: 'final',
            category: [{
                coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }]
            }],
            code: {
                coding: [{ system: 'http://loinc.org', code: '2708-6', display: 'Oxygen saturation in Arterial blood' }],
                text: 'Oxygen saturation'
            },
            subject: subjectRef,
            effectiveDateTime: effectiveDate,
            valueQuantity: {
                value: Number(vital.spo2),
                unit: '%',
                system: 'http://unitsofmeasure.org',
                code: '%'
            }
        })
    }

    // 5. Body Weight (LOINC 29463-7)
    if (vital.weight) {
        observations.push({
            resourceType: 'Observation',
            id: `vital-weight-${vital.id}`,
            status: 'final',
            category: [{
                coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }]
            }],
            code: {
                coding: [{ system: 'http://loinc.org', code: '29463-7', display: 'Body weight' }],
                text: 'Body weight'
            },
            subject: subjectRef,
            effectiveDateTime: effectiveDate,
            valueQuantity: {
                value: Number(vital.weight),
                unit: 'kg',
                system: 'http://unitsofmeasure.org',
                code: 'kg'
            }
        })
    }

    return observations
}

/**
 * Maps prescription items to HL7 FHIR R4 `MedicationRequest`
 */
export function toFHIRMedicationRequest(prescription: any, item: any): FHIRMedicationRequest {
    const medName = item.hms_product?.name || 'Prescribed Medicine'
    const timingText = `${item.morning || 0}-${item.afternoon || 0}-${item.evening || 0}-${item.night || 0} for ${item.days || 1} day(s)`

    return {
        resourceType: 'MedicationRequest',
        id: item.id || `medreq-${prescription.id}`,
        status: 'active',
        intent: 'order',
        medicationCodeableConcept: {
            coding: [
                {
                    system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                    display: medName
                }
            ],
            text: medName
        },
        subject: {
            reference: `Patient/${prescription.patient_id}`,
            type: 'Patient'
        },
        authoredOn: prescription.created_at ? new Date(prescription.created_at).toISOString() : new Date().toISOString(),
        dosageInstruction: [
            {
                text: timingText
            }
        ]
    }
}

/**
 * Assembles individual FHIR resources into a standardized FHIR R4 Bundle
 */
export function toFHIRBundle<T = any>(resources: T[], type: 'searchset' | 'collection' = 'searchset'): FHIRBundle<T> {
    return {
        resourceType: 'Bundle',
        id: `bundle-${Date.now()}`,
        meta: {
            lastUpdated: new Date().toISOString()
        },
        type,
        total: resources.length,
        entry: resources.map(resource => ({
            fullUrl: `urn:uuid:${(resource as any).id}`,
            resource
        }))
    }
}
