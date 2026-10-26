'use server'

import { auth } from '@/auth'
import { evaluatePrescriptionSafety, CandidateMedicineInput, CDSSReport } from '@/lib/cdss/engine'

/**
 * Server Action: Real-Time Clinical Decision Support (CDSS)
 * Runs instantaneous drug-drug and drug-allergy safety validation for prescribers.
 */
export async function checkPrescriptionSafetyAction(params: {
    medicines: (CandidateMedicineInput | string)[]
    patientId?: string
    explicitAllergies?: string[]
}): Promise<CDSSReport> {
    const session = await auth()
    const tenantId = session?.user?.tenantId

    return evaluatePrescriptionSafety({
        candidateMedicines: params.medicines,
        patientId: params.patientId,
        tenantId: tenantId || undefined,
        explicitAllergies: params.explicitAllergies
    })
}
