import { prisma } from '@/lib/prisma'
import { 
    CLINICAL_INTERACTION_RULES, 
    ALLERGY_CLASS_RULES, 
    AlertSeverity, 
    AlertCategory 
} from './interaction-rules'

export interface ClinicalAlert {
    id: string
    severity: AlertSeverity
    category: AlertCategory
    title: string
    drugA: string
    drugB?: string
    mechanism: string
    recommendation: string
    evidenceLevel?: string
    requiresOverride: boolean
}

export interface CDSSReport {
    isSafe: boolean
    hasCritical: boolean
    hasModerate: boolean
    alerts: ClinicalAlert[]
    checkedMedicinesCount: number
    patientAllergiesFound: string[]
    summary: string
}

export interface CandidateMedicineInput {
    name: string
    id?: string
    medicineId?: string
}

/**
 * Normalizes drug text (e.g., "Tab. Augmentin 625mg DUO" -> "augmentin 625mg duo")
 */
function normalizeDrugString(name: string): string {
    if (!name) return ''
    return name
        .toLowerCase()
        .replace(/^(tab|cap|inj|syp|susp|ointment|cream|drops|infusion|tablet|capsule|injection)\.?\s+/i, '')
        .trim()
}

/**
 * Checks if a drug string matches a specific pharmacologic root or synonym
 */
function matchesDrug(drugText: string, targetRoot: string): boolean {
    const clean = normalizeDrugString(drugText)
    const target = targetRoot.toLowerCase().trim()
    
    // Exact or substring word boundary match
    const regex = new RegExp(`(^|\\b|\\s|_|-)${target}(\\b|\\s|_|-|\\d)`, 'i')
    return regex.test(clean) || clean.includes(target)
}

/**
 * World-Standard Clinical Decision Support Engine (CDSS)
 * Evaluates Drug-Drug Interactions (DDI), Duplicate Therapy, and Allergy Contraindications.
 */
export async function evaluatePrescriptionSafety(params: {
    candidateMedicines: (CandidateMedicineInput | string)[]
    patientId?: string
    tenantId?: string
    explicitAllergies?: string[]
}): Promise<CDSSReport> {
    const { candidateMedicines = [], patientId, tenantId, explicitAllergies = [] } = params

    const medicineNames = candidateMedicines
        .map(m => (typeof m === 'string' ? m : m?.name))
        .filter(Boolean) as string[]

    const alerts: ClinicalAlert[] = []
    const allergiesList = new Set<string>(explicitAllergies.map(a => a.toLowerCase().trim()))

    // 1. Fetch patient clinical profile (Allergies + Ongoing Medications) if patientId is present
    let activeMedications: string[] = []
    if (patientId && tenantId) {
        try {
            const patient = await prisma.hms_patient.findFirst({
                where: { id: patientId, tenant_id: tenantId },
                select: { metadata: true }
            })

            const meta = (patient?.metadata as any) || {}
            if (Array.isArray(meta.allergies)) {
                meta.allergies.forEach((a: string) => allergiesList.add(String(a).toLowerCase().trim()))
            }

            // Fetch active medications from past 30 days
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            const recentPrescriptions = await prisma.prescription.findMany({
                where: {
                    patient_id: patientId,
                    tenant_id: tenantId,
                    created_at: { gte: thirtyDaysAgo }
                },
                include: {
                    prescription_items: {
                        include: { hms_product: { select: { name: true } } }
                    }
                },
                take: 5
            })

            recentPrescriptions.forEach(p => {
                p.prescription_items.forEach(item => {
                    if (item.hms_product?.name) {
                        activeMedications.push(item.hms_product.name)
                    }
                })
            })
        } catch (err: any) {
            console.error('[CDSS] Non-blocking patient profile retrieval error:', err?.message || err)
        }
    }

    const patientAllergiesFound = Array.from(allergiesList)

    // 2. CHECK ALLERGIES CONTRAINDICATIONS
    if (patientAllergiesFound.length > 0) {
        for (const med of medicineNames) {
            for (const allergen of patientAllergiesFound) {
                // Find matching allergy class rule
                const matchedRule = ALLERGY_CLASS_RULES.find(rule => 
                    allergen.includes(rule.allergyKeyword) || rule.allergyKeyword.includes(allergen)
                )

                if (matchedRule) {
                    const isContraindicated = matchedRule.medicationKeywords.some(kw => matchesDrug(med, kw))
                    if (isContraindicated) {
                        alerts.push({
                            id: `allergy-${med}-${allergen}`,
                            severity: matchedRule.severity,
                            category: 'DRUG_ALLERGY',
                            title: matchedRule.title,
                            drugA: med,
                            drugB: allergen,
                            mechanism: matchedRule.mechanism,
                            recommendation: matchedRule.recommendation,
                            requiresOverride: matchedRule.severity === 'CRITICAL'
                        })
                    }
                } else if (matchesDrug(med, allergen)) {
                    // Direct name match fallback
                    alerts.push({
                        id: `allergy-direct-${med}-${allergen}`,
                        severity: 'CRITICAL',
                        category: 'DRUG_ALLERGY',
                        title: `Direct Allergy Contraindication: ${allergen.toUpperCase()}`,
                        drugA: med,
                        drugB: allergen,
                        mechanism: `Patient has documented allergy to "${allergen}". Prescribed medicine matches allergen record.`,
                        recommendation: 'Strictly avoid. Select an alternative non-cross-reactive medication.',
                        requiresOverride: true
                    })
                }
            }
        }
    }

    // 3. CHECK INTRA-PRESCRIPTION DRUG-DRUG INTERACTIONS (Candidate vs Candidate)
    for (let i = 0; i < medicineNames.length; i++) {
        for (let j = i + 1; j < medicineNames.length; j++) {
            const med1 = medicineNames[i]
            const med2 = medicineNames[j]

            for (const rule of CLINICAL_INTERACTION_RULES) {
                const matchForward = matchesDrug(med1, rule.drugA) && matchesDrug(med2, rule.drugB)
                const matchReverse = matchesDrug(med1, rule.drugB) && matchesDrug(med2, rule.drugA)

                if (matchForward || matchReverse) {
                    alerts.push({
                        id: `ddi-${i}-${j}-${rule.drugA}-${rule.drugB}`,
                        severity: rule.severity,
                        category: rule.category,
                        title: rule.title,
                        drugA: med1,
                        drugB: med2,
                        mechanism: rule.mechanism,
                        recommendation: rule.recommendation,
                        evidenceLevel: rule.evidenceLevel,
                        requiresOverride: rule.severity === 'CRITICAL'
                    })
                }
            }
        }
    }

    // 4. CHECK CONCURRENT ACTIVE MEDICATIONS (Candidate vs Patient Active Chart)
    if (activeMedications.length > 0) {
        for (const candidate of medicineNames) {
            for (const active of activeMedications) {
                // Avoid self-interaction if same medicine is being re-prescribed
                if (normalizeDrugString(candidate) === normalizeDrugString(active)) continue

                for (const rule of CLINICAL_INTERACTION_RULES) {
                    const matchForward = matchesDrug(candidate, rule.drugA) && matchesDrug(active, rule.drugB)
                    const matchReverse = matchesDrug(candidate, rule.drugB) && matchesDrug(active, rule.drugA)

                    if (matchForward || matchReverse) {
                        alerts.push({
                            id: `ddi-active-${rule.drugA}-${rule.drugB}`,
                            severity: rule.severity,
                            category: rule.category,
                            title: `Concurrent Therapy Conflict: ${rule.title}`,
                            drugA: candidate,
                            drugB: `${active} (Active on Patient Chart)`,
                            mechanism: rule.mechanism,
                            recommendation: rule.recommendation,
                            evidenceLevel: rule.evidenceLevel,
                            requiresOverride: rule.severity === 'CRITICAL'
                        })
                    }
                }
            }
        }
    }

    const hasCritical = alerts.some(a => a.severity === 'CRITICAL')
    const hasModerate = alerts.some(a => a.severity === 'MODERATE')
    const isSafe = alerts.length === 0

    let summary = 'No clinical interactions or allergy contraindications detected.'
    if (hasCritical) {
        summary = `⚠️ Critical clinical safety alerts detected (${alerts.filter(a => a.severity === 'CRITICAL').length} severe). Requires review & clinical override.`
    } else if (hasModerate) {
        summary = `ℹ️ Moderate drug interactions detected (${alerts.length} advisory alerts). Close clinical monitoring advised.`
    }

    return {
        isSafe,
        hasCritical,
        hasModerate,
        alerts,
        checkedMedicinesCount: medicineNames.length,
        patientAllergiesFound,
        summary
    }
}
