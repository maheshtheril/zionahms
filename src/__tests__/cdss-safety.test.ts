import { describe, it, expect, vi, beforeEach } from 'vitest'
import { evaluatePrescriptionSafety } from '../lib/cdss/engine'
import { prisma } from '../lib/prisma'

vi.mock('../lib/prisma', () => ({
    prisma: {
        hms_patient: {
            findFirst: vi.fn()
        },
        prescription: {
            findMany: vi.fn()
        }
    }
}))

describe('Clinical Decision Support System (CDSS) - Patient Medication Safety', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('detects CRITICAL drug-drug interaction between Warfarin and Aspirin', async () => {
        const report = await evaluatePrescriptionSafety({
            candidateMedicines: [
                { name: 'Warfarin 5mg Tablet' },
                { name: 'Aspirin 75mg Tablet' }
            ]
        })

        expect(report.isSafe).toBe(false)
        expect(report.hasCritical).toBe(true)
        expect(report.alerts.length).toBeGreaterThanOrEqual(1)

        const bleedingAlert = report.alerts.find(a => a.severity === 'CRITICAL' && a.title.includes('Bleeding'))
        expect(bleedingAlert).toBeDefined()
        expect(bleedingAlert?.requiresOverride).toBe(true)
    })

    it('detects CRITICAL hemodynamic collapse between Sildenafil and Nitroglycerin', async () => {
        const report = await evaluatePrescriptionSafety({
            candidateMedicines: [
                'Sildenafil 50mg',
                'Nitroglycerin Sublingual 0.4mg'
            ]
        })

        expect(report.isSafe).toBe(false)
        expect(report.hasCritical).toBe(true)
        const hypoAlert = report.alerts.find(a => a.title.includes('Hypotension'))
        expect(hypoAlert).toBeDefined()
    })

    it('detects CRITICAL beta-lactam cross-reactivity when patient has documented Penicillin allergy', async () => {
        vi.mocked(prisma.hms_patient.findFirst).mockResolvedValue({
            metadata: { allergies: ['Penicillin'] }
        } as any)
        vi.mocked(prisma.prescription.findMany).mockResolvedValue([])

        const report = await evaluatePrescriptionSafety({
            candidateMedicines: ['Tab. Augmentin 625mg (Amoxicillin + Clavulanate)'],
            patientId: 'patient-allergic-uuid',
            tenantId: 'tenant-uuid'
        })

        expect(report.isSafe).toBe(false)
        expect(report.hasCritical).toBe(true)
        const allergyAlert = report.alerts.find(a => a.category === 'DRUG_ALLERGY')
        expect(allergyAlert).toBeDefined()
        expect(allergyAlert?.title).toContain('Penicillin')
    })

    it('reports 100% CLEAR / SAFE when no interactions exist', async () => {
        const report = await evaluatePrescriptionSafety({
            candidateMedicines: [
                'Paracetamol 500mg',
                'Pantoprazole 40mg'
            ]
        })

        expect(report.isSafe).toBe(true)
        expect(report.hasCritical).toBe(false)
        expect(report.alerts.length).toBe(0)
    })

    it('detects conflict between new candidate medicine and ongoing active prescription on patient chart', async () => {
        vi.mocked(prisma.hms_patient.findFirst).mockResolvedValue({ metadata: {} } as any)
        
        // Patient is already on Lisinopril
        vi.mocked(prisma.prescription.findMany).mockResolvedValue([
            {
                prescription_items: [
                    { hms_product: { name: 'Lisinopril 10mg' } }
                ]
            }
        ] as any)

        // Doctor is now prescribing Spironolactone
        const report = await evaluatePrescriptionSafety({
            candidateMedicines: ['Spironolactone 25mg'],
            patientId: 'patient-with-active-meds',
            tenantId: 'tenant-uuid'
        })

        expect(report.isSafe).toBe(false)
        expect(report.hasCritical).toBe(true)
        const hyperkalemiaAlert = report.alerts.find(a => a.title.includes('Hyperkalemia'))
        expect(hyperkalemiaAlert).toBeDefined()
    })
})
