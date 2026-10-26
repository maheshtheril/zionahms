import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyMobileAuth, mobileResponse } from '@/lib/mobile-auth'

export async function GET(req: NextRequest) {
    const auth = await verifyMobileAuth(req)
    if (!auth.authenticated || auth.payload?.role !== 'DOCTOR') {
        return auth.errorResponse || NextResponse.json({ error: 'Unauthorized: Doctor role required' }, { status: 403 })
    }

    try {
        const tenantId = auth.payload.tenantId

        // Fetch active admissions
        const admissions = await prisma.hms_admission.findMany({
            where: {
                tenant_id: tenantId,
                status: 'admitted'
            },
            include: {
                hms_patient: {
                    select: {
                        id: true,
                        patient_number: true,
                        first_name: true,
                        last_name: true,
                        full_name: true,
                        gender: true,
                        blood_group: true,
                        hms_vitals: {
                            orderBy: { recorded_at: 'desc' },
                            take: 1
                        }
                    }
                }
            },
            orderBy: { admitted_at: 'desc' },
            take: 40
        })

        // Fetch wards for resolving bed names
        const wards = await prisma.hms_ward.findMany({
            where: { tenant_id: tenantId },
            include: { hms_bed: true }
        })

        const bedMap = new Map<string, { bedNo: string; wardName: string }>()
        wards.forEach(w => {
            w.hms_bed.forEach(b => {
                bedMap.set(b.id, { bedNo: b.bed_no, wardName: w.name })
            })
        })

        const mapped = admissions.map(adm => {
            const p = adm.hms_patient
            const latestVital = p?.hms_vitals?.[0]
            const bedId = (adm.metadata as any)?.bed_id
            const bedInfo = bedId ? bedMap.get(bedId) : null

            return {
                admissionId: adm.id,
                admissionDate: adm.admitted_at,
                reason: ((adm.metadata as any)?.reason) || 'Inpatient Observation',
                ward: bedInfo?.wardName || 'General Ward',
                bed: bedInfo?.bedNo || 'Bed #1',
                patient: {
                    id: p?.id,
                    mrn: p?.patient_number,
                    name: p?.full_name || `${p?.first_name || ''} ${p?.last_name || ''}`.trim(),
                    gender: p?.gender,
                    bloodGroup: p?.blood_group,
                    vitals: latestVital ? {
                        bp: latestVital.systolic && latestVital.diastolic ? `${latestVital.systolic}/${latestVital.diastolic} mmHg` : null,
                        pulse: latestVital.pulse,
                        temp: latestVital.temperature ? Number(latestVital.temperature) : null,
                        spo2: latestVital.spo2
                    } : null
                }
            }
        })

        return mobileResponse(mapped, 200, 'InpatientRoundsBundle')

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

