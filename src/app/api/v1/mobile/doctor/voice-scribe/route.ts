import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileAuth, mobileResponse } from '@/lib/mobile-auth'
import { parseSpokenClinicalNote } from '@/app/actions/voice-clinical-parser'

export async function POST(req: NextRequest) {
    const auth = await verifyMobileAuth(req)
    if (!auth.authenticated || auth.payload?.role !== 'DOCTOR') {
        return auth.errorResponse || NextResponse.json({ error: 'Unauthorized: Doctor role required' }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { transcript, patientId } = body

        if (!transcript || transcript.trim().length < 5) {
            return NextResponse.json({ error: 'Clinical voice transcript is required (minimum 5 characters)' }, { status: 400 })
        }

        // Call the ambient clinical parser
        const parseResult = await parseSpokenClinicalNote(transcript)

        if (!parseResult.success || !parseResult.data) {
            return NextResponse.json({ error: parseResult.error || 'Failed to parse clinical voice dictation' }, { status: 500 })
        }

        const structured = parseResult.data

        // Return FHIR-compliant 2050 clinical draft
        return mobileResponse({
            resourceType: 'EncounterDraft',
            patientId: patientId || null,
            clinicianId: auth.payload.clinicianId || null,
            recordedAt: new Date().toISOString(),
            rawTranscript: transcript,
            clinicalObservation: {
                chiefComplaints: structured.complaints || [],
                clinicalImpression: structured.diagnosis || '',
                lifestyleAdvice: structured.vitalsAdvice || '',
                followUpDays: structured.followUpDays || 7
            },
            proposedMedications: (structured.medicines || []).map((med, index) => ({
                id: `rx-draft-${index + 1}`,
                name: med.name,
                dosage: med.dosage || 'Standard dose',
                frequency: med.frequency || '1-0-1',
                duration: med.duration || '5 days',
                instructions: med.instructions || 'After food'
            })),
            proposedLabInvestigations: structured.labTests || [],
            doctorNotes: structured.doctorNotes || ''
        }, 200, 'ClinicalVoiceScribeBundle')

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
