import { prisma } from '@/lib/prisma'

export type PhiAuditAction = 
    | 'VIEW'
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'EXPORT'
    | 'PRINT'
    | 'BREAK_GLASS'
    | 'SEARCH'

export interface LogPhiAccessParams {
    patientId: string
    tenantId: string
    actorId?: string | null
    actorName?: string | null
    actorRole?: string | null
    action: PhiAuditAction
    resource?: 'PATIENT_CHART' | 'PRESCRIPTION' | 'LAB_REPORT' | 'VITALS' | 'INVOICE' | 'ADMISSION'
    reason?: string
    metadata?: Record<string, any>
    oldData?: Record<string, any> | null
    newData?: Record<string, any> | null
    diff?: Record<string, any> | null
}

/**
 * HIPAA § 164.312(b) & 21 CFR Part 11 Compliant Audit Logger.
 * Records all electronic Protected Health Information (ePHI) access events.
 * 
 * DESIGN PRINCIPLE: Non-blocking & Fail-Safe.
 * Clinical workflow is NEVER blocked or failed if an audit log write encounters an edge error.
 */
export async function logPhiAccess(params: LogPhiAccessParams): Promise<void> {
    const {
        patientId,
        tenantId,
        actorId,
        actorName,
        actorRole,
        action,
        resource = 'PATIENT_CHART',
        reason = 'Standard Clinical Workflow',
        metadata = {},
        oldData = null,
        newData = null,
        diff = null
    } = params

    if (!patientId || !tenantId) return

    // Execute asynchronously to keep clinical UI instant
    try {
        const enrichedMetadata = {
            ...metadata,
            actorName: actorName || 'Unknown Clinician',
            actorRole: actorRole || 'Staff',
            resource,
            reason,
            timestamp: new Date().toISOString(),
            hipaaStandard: '45 CFR 164.312(b)',
            fdaStandard: '21 CFR Part 11'
        }

        // 1. Write to clinical patient history
        await prisma.hms_patient_history.create({
            data: {
                patient_id: patientId,
                tenant_id: tenantId,
                operation: action,
                changed_by: actorId || null,
                old_data: oldData ?? undefined,
                new_data: newData ?? enrichedMetadata,
                diff: diff ?? (action === 'VIEW' ? { viewedResource: resource } : undefined)
            }
        })

        // 2. Also log to central multi-tenant enterprise audit log
        await prisma.audit_log.create({
            data: {
                tenant_id: tenantId,
                actor_id: actorId || null,
                table_name: 'hms_patient',
                record_id: patientId,
                operation: action,
                event: `ePHI_${action}_${resource}`,
                diff: enrichedMetadata
            }
        })
    } catch (err: any) {
        // Fail-safe: Log error without crashing patient care
        console.error('[HIPAA-AUDIT] Non-blocking audit record error:', err?.message || err)
    }
}

/**
 * Specialized helper for emergency Break-Glass access (ER doctors overriding permissions)
 */
export async function logBreakGlassAccess(
    patientId: string, 
    tenantId: string, 
    actorId: string, 
    actorName: string, 
    clinicalJustification: string
): Promise<void> {
    return logPhiAccess({
        patientId,
        tenantId,
        actorId,
        actorName,
        actorRole: 'EMERGENCY_OVERRIDE',
        action: 'BREAK_GLASS',
        reason: clinicalJustification,
        metadata: {
            severity: 'CRITICAL',
            overrideType: 'EMERGENCY_UNRESTRICTED_ACCESS',
            acknowledgedLegalLiability: true
        }
    })
}
