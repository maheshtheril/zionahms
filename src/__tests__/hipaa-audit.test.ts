import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logPhiAccess, logBreakGlassAccess } from '../lib/hipaa-audit'
import { prisma } from '../lib/prisma'

vi.mock('../lib/prisma', () => ({
    prisma: {
        hms_patient_history: {
            create: vi.fn(),
            findMany: vi.fn()
        },
        audit_log: {
            create: vi.fn()
        },
        app_user: {
            findMany: vi.fn()
        }
    }
}))

describe('HIPAA § 164.312(b) & 21 CFR Part 11 Audit Core', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('successfully logs ePHI chart view event with HIPAA metadata', async () => {
        const mockCreateHistory = vi.mocked(prisma.hms_patient_history.create).mockResolvedValue({} as any)
        const mockCreateAudit = vi.mocked(prisma.audit_log.create).mockResolvedValue({} as any)

        await logPhiAccess({
            patientId: 'patient-uuid-123',
            tenantId: 'tenant-uuid-456',
            actorId: 'doctor-uuid-789',
            actorName: 'Dr. Gregory House',
            actorRole: 'Diagnostic Specialist',
            action: 'VIEW',
            resource: 'PATIENT_CHART',
            reason: 'Differential Diagnosis Review'
        })

        // Verify write to clinical patient history
        expect(mockCreateHistory).toHaveBeenCalledTimes(1)
        expect(mockCreateHistory).toHaveBeenCalledWith({
            data: expect.objectContaining({
                patient_id: 'patient-uuid-123',
                tenant_id: 'tenant-uuid-456',
                operation: 'VIEW',
                changed_by: 'doctor-uuid-789',
                new_data: expect.objectContaining({
                    actorName: 'Dr. Gregory House',
                    actorRole: 'Diagnostic Specialist',
                    hipaaStandard: '45 CFR 164.312(b)',
                    fdaStandard: '21 CFR Part 11',
                    reason: 'Differential Diagnosis Review'
                })
            })
        })

        // Verify write to enterprise cross-system audit log
        expect(mockCreateAudit).toHaveBeenCalledTimes(1)
        expect(mockCreateAudit).toHaveBeenCalledWith({
            data: expect.objectContaining({
                tenant_id: 'tenant-uuid-456',
                actor_id: 'doctor-uuid-789',
                table_name: 'hms_patient',
                record_id: 'patient-uuid-123',
                operation: 'VIEW',
                event: 'ePHI_VIEW_PATIENT_CHART'
            })
        })
    })

    it('records Emergency Break-Glass access with high legal severity', async () => {
        const mockCreateHistory = vi.mocked(prisma.hms_patient_history.create).mockResolvedValue({} as any)
        const mockCreateAudit = vi.mocked(prisma.audit_log.create).mockResolvedValue({} as any)

        await logBreakGlassAccess(
            'patient-uuid-emergency',
            'tenant-uuid-456',
            'er-doctor-uuid',
            'Dr. James Wilson',
            'Patient unconscious in trauma bay without family consent'
        )

        expect(mockCreateHistory).toHaveBeenCalledWith({
            data: expect.objectContaining({
                patient_id: 'patient-uuid-emergency',
                operation: 'BREAK_GLASS',
                new_data: expect.objectContaining({
                    actorRole: 'EMERGENCY_OVERRIDE',
                    severity: 'CRITICAL',
                    overrideType: 'EMERGENCY_UNRESTRICTED_ACCESS',
                    acknowledgedLegalLiability: true
                })
            })
        })
    })

    it('gracefully handles database failure without throwing error to clinical UI (Fail-Safe)', async () => {
        vi.mocked(prisma.hms_patient_history.create).mockRejectedValue(new Error('Connection Pool Exhausted'))
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        // Should NOT throw
        await expect(logPhiAccess({
            patientId: 'patient-123',
            tenantId: 'tenant-123',
            action: 'VIEW'
        })).resolves.not.toThrow()

        expect(consoleSpy).toHaveBeenCalled()
        consoleSpy.mockRestore()
    })
})
