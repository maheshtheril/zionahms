'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export interface SearchResult {
    id: string
    type: 'patient' | 'bill' | 'appointment' | 'doctor' | 'medicine'
    title: string
    subtitle: string
    url: string
    badge?: string
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
    const session = await auth()
    if (!session?.user?.companyId || !query || query.length < 2) return []

    const q = query.trim()
    const companyId = session.user.companyId
    const results: SearchResult[] = []

    await Promise.all([
        // Patients
        prisma.hms_patient.findMany({
            where: {
                company_id: companyId,
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { patient_id: { contains: q, mode: 'insensitive' } },
                    { phone: { contains: q } },
                    { op_number: { contains: q, mode: 'insensitive' } },
                ],
            },
            take: 5,
            select: { id: true, name: true, patient_id: true, phone: true, op_number: true },
        }).then(patients => {
            patients.forEach(p => results.push({
                id: p.id,
                type: 'patient',
                title: p.name || 'Patient',
                subtitle: [p.patient_id, p.phone].filter(Boolean).join(' · '),
                url: `/hms/patients/${p.id}`,
                badge: 'Patient',
            }))
        }),

        // Bills / Invoices
        prisma.hms_invoice.findMany({
            where: {
                company_id: companyId,
                OR: [
                    { invoice_number: { contains: q, mode: 'insensitive' } },
                    { hms_patient: { name: { contains: q, mode: 'insensitive' } } },
                ],
            },
            take: 5,
            select: { id: true, invoice_number: true, total: true, status: true, hms_patient: { select: { name: true } } },
        }).then(bills => {
            bills.forEach(b => results.push({
                id: b.id,
                type: 'bill',
                title: b.invoice_number || `Bill #${b.id.slice(0, 8)}`,
                subtitle: `${b.hms_patient?.name || ''} · ₹${Number(b.total || 0).toLocaleString('en-IN')}`,
                url: `/hms/billing/${b.id}`,
                badge: b.status || 'Bill',
            }))
        }),

        // Appointments
        prisma.hms_appointments.findMany({
            where: {
                company_id: companyId,
                OR: [
                    { hms_patient: { name: { contains: q, mode: 'insensitive' } } },
                    { token_number: { contains: q, mode: 'insensitive' } },
                ],
            },
            take: 4,
            include: { hms_patient: { select: { name: true } }, hms_clinician: { select: { name: true } } },
        }).then(apts => {
            apts.forEach(a => results.push({
                id: a.id,
                type: 'appointment',
                title: a.hms_patient?.name || 'Appointment',
                subtitle: `${a.hms_clinician?.name ? 'Dr. ' + a.hms_clinician.name : ''} · Token: ${a.token_number || '—'}`,
                url: `/hms/appointments/${a.id}`,
                badge: 'Appointment',
            }))
        }),

        // Doctors
        prisma.hms_clinicians.findMany({
            where: {
                company_id: companyId,
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { specialization: { contains: q, mode: 'insensitive' } },
                ],
            },
            take: 3,
            select: { id: true, name: true, specialization: true },
        }).then(docs => {
            docs.forEach(d => results.push({
                id: d.id,
                type: 'doctor',
                title: `Dr. ${d.name || ''}`,
                subtitle: d.specialization || 'Doctor',
                url: `/hms/doctors/${d.id}`,
                badge: 'Doctor',
            }))
        }),
    ])

    return results.slice(0, 12)
}
