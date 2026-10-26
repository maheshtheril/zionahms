import { describe, it, expect } from 'vitest'
import { 
    toFHIRPatient, 
    toFHIRObservations, 
    toFHIRMedicationRequest, 
    toFHIRBundle 
} from '../lib/fhir/mappers'

describe('HL7 FHIR Release 4 (R4) Interoperability Suite', () => {
    it('maps hms_patient to official FHIR R4 Patient resource', () => {
        const mockPatient = {
            id: 'pat-12345',
            patient_number: 'MRN-2026-0099',
            first_name: 'Sarah',
            last_name: 'Connor',
            full_name: 'Sarah Connor',
            gender: 'female',
            dob: new Date('1985-05-12'),
            status: 'active',
            contact: {
                phone: '+1-555-0199',
                email: 'sarah.c@example.com',
                address: {
                    street: '742 Evergreen Terrace',
                    city: 'Springfield',
                    state: 'OR',
                    zip: '97477',
                    country: 'USA'
                }
            }
        }

        const fhirPatient = toFHIRPatient(mockPatient)

        expect(fhirPatient.resourceType).toBe('Patient')
        expect(fhirPatient.id).toBe('pat-12345')
        expect(fhirPatient.gender).toBe('female')
        expect(fhirPatient.birthDate).toBe('1985-05-12')
        expect(fhirPatient.active).toBe(true)

        // Verify Name structure
        expect(fhirPatient.name?.[0].family).toBe('Connor')
        expect(fhirPatient.name?.[0].given).toContain('Sarah')

        // Verify Identifier / MRN
        expect(fhirPatient.identifier?.[0].system).toBe('urn:oid:ziona:mrn')
        expect(fhirPatient.identifier?.[0].value).toBe('MRN-2026-0099')

        // Verify Telecom
        expect(fhirPatient.telecom).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ system: 'phone', value: '+1-555-0199' }),
                expect.objectContaining({ system: 'email', value: 'sarah.c@example.com' })
            ])
        )

        // Verify Address
        expect(fhirPatient.address?.[0].city).toBe('Springfield')
        expect(fhirPatient.address?.[0].state).toBe('OR')
    })

    it('maps clinical vitals to official LOINC-coded FHIR Observations', () => {
        const mockVital = {
            id: 'vital-9988',
            patient_id: 'pat-12345',
            recorded_at: new Date('2026-10-26T10:00:00Z'),
            systolic: 120,
            diastolic: 80,
            pulse: 72,
            temperature: 37.0,
            spo2: 98,
            weight: 65.5
        }

        const observations = toFHIRObservations(mockVital, 'pat-12345')

        expect(observations.length).toBe(5) // BP, Pulse, Temp, SpO2, Weight

        // 1. Blood Pressure Panel (LOINC 85354-9)
        const bpObs = observations.find(o => o.code.coding?.[0].code === '85354-9')
        expect(bpObs).toBeDefined()
        expect(bpObs?.component?.length).toBe(2)
        const systolicComp = bpObs?.component?.find(c => c.code.coding?.[0].code === '8480-6')
        expect(systolicComp?.valueQuantity?.value).toBe(120)
        expect(systolicComp?.valueQuantity?.unit).toBe('mmHg')

        // 2. Pulse (LOINC 8867-4)
        const pulseObs = observations.find(o => o.code.coding?.[0].code === '8867-4')
        expect(pulseObs?.valueQuantity?.value).toBe(72)
        expect(pulseObs?.valueQuantity?.unit).toBe('beats/minute')

        // 3. SpO2 (LOINC 2708-6)
        const spo2Obs = observations.find(o => o.code.coding?.[0].code === '2708-6')
        expect(spo2Obs?.valueQuantity?.value).toBe(98)
    })

    it('maps prescription items to official FHIR MedicationRequest', () => {
        const mockPrescription = {
            id: 'rx-7788',
            patient_id: 'pat-12345',
            created_at: new Date('2026-10-26T11:00:00Z')
        }
        const mockItem = {
            id: 'rx-item-1',
            hms_product: { name: 'Amoxicillin 500mg Capsule', sku: 'MED-AMX-500' },
            morning: 1,
            afternoon: 0,
            evening: 1,
            night: 1,
            days: 7
        }

        const medReq = toFHIRMedicationRequest(mockPrescription, mockItem)

        expect(medReq.resourceType).toBe('MedicationRequest')
        expect(medReq.status).toBe('active')
        expect(medReq.intent).toBe('order')
        expect(medReq.subject.reference).toBe('Patient/pat-12345')
        expect(medReq.medicationCodeableConcept.text).toBe('Amoxicillin 500mg Capsule')
        expect(medReq.dosageInstruction?.[0].text).toContain('1-0-1-1 for 7 day(s)')
    })

    it('composes standard FHIR Bundle collection for patient export', () => {
        const mockPatient = toFHIRPatient({
            id: 'pat-1',
            first_name: 'John',
            last_name: 'Doe',
            gender: 'male'
        })
        const mockObs = toFHIRObservations({
            id: 'v-1',
            pulse: 80
        }, 'pat-1')

        const bundle = toFHIRBundle([mockPatient, ...mockObs], 'collection')

        expect(bundle.resourceType).toBe('Bundle')
        expect(bundle.type).toBe('collection')
        expect(bundle.total).toBe(2)
        expect(bundle.entry?.length).toBe(2)
        expect(bundle.entry?.[0].resource.resourceType).toBe('Patient')
        expect(bundle.entry?.[1].resource.resourceType).toBe('Observation')
    })
})
