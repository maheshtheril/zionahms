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

    const numQ = Number(q)
    const isNum = !isNaN(numQ) && numQ > 0

    await Promise.all([
        // Patients
        prisma.hms_patient.findMany({
            where: {
                company_id: companyId,
                OR: [
                    { full_name: { contains: q, mode: 'insensitive' } },
                    { first_name: { contains: q, mode: 'insensitive' } },
                    { last_name: { contains: q, mode: 'insensitive' } },
                    { patient_number: { contains: q, mode: 'insensitive' } },
                    { contact: { path: ['phone'], string_contains: q } },
                ],
            },
            take: 5,
            select: { id: true, full_name: true, first_name: true, last_name: true, patient_number: true, contact: true },
        }).then(patients => {
            patients.forEach(p => {
                const name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Patient'
                results.push({
                    id: p.id,
                    type: 'patient',
                    title: name,
                    subtitle: [p.patient_number, p.contact].filter(Boolean).join(' · '),
                    url: `/hms/patients/${p.id}`,
                    badge: 'Patient',
                })
            })
        }),

        // Bills / Invoices
        prisma.hms_invoice.findMany({
            where: {
                company_id: companyId,
                invoice_number: { contains: q, mode: 'insensitive' },
            },
            take: 5,
            select: {
                id: true,
                invoice_number: true,
                total: true,
                status: true,
                hms_patient: { select: { full_name: true, first_name: true, last_name: true } }
            },
        }).then(bills => {
            bills.forEach(b => {
                const pName = b.hms_patient?.full_name || [b.hms_patient?.first_name, b.hms_patient?.last_name].filter(Boolean).join(' ') || ''
                results.push({
                    id: b.id,
                    type: 'bill',
                    title: b.invoice_number || `Bill #${b.id.slice(0, 8)}`,
                    subtitle: `${pName} · ₹${Number(b.total || 0).toLocaleString('en-IN')}`,
                    url: `/hms/billing/${b.id}`,
                    badge: b.status || 'Bill',
                })
            })
        }),

        // Appointments
        prisma.hms_appointments.findMany({
            where: {
                company_id: companyId,
                ...(isNum ? { token_number: numQ } : {}),
            },
            take: 4,
            include: {
                hms_patient: { select: { full_name: true, first_name: true, last_name: true } },
                hms_clinician: { select: { first_name: true, last_name: true, salutation: true } }
            },
        }).then(apts => {
            apts.forEach(a => {
                const patName = a.hms_patient?.full_name || [a.hms_patient?.first_name, a.hms_patient?.last_name].filter(Boolean).join(' ') || 'Appointment'
                const docName = a.hms_clinician ? `${a.hms_clinician.salutation || 'Dr.'} ${[a.hms_clinician.first_name, a.hms_clinician.last_name].filter(Boolean).join(' ')}` : ''
                results.push({
                    id: a.id,
                    type: 'appointment',
                    title: patName,
                    subtitle: `${docName} · Token: ${a.token_number || '—'}`,
                    url: `/hms/appointments/${a.id}`,
                    badge: 'Appointment',
                })
            })
        }),

        // Doctors
        prisma.hms_clinicians.findMany({
            where: {
                company_id: companyId,
                OR: [
                    { first_name: { contains: q, mode: 'insensitive' } },
                    { last_name: { contains: q, mode: 'insensitive' } },
                    { specialization: { contains: q, mode: 'insensitive' } },
                ],
            },
            take: 3,
            select: { id: true, first_name: true, last_name: true, salutation: true, specialization: true },
        }).then(docs => {
            docs.forEach(d => {
                const docFullName = [d.first_name, d.last_name].filter(Boolean).join(' ')
                results.push({
                    id: d.id,
                    type: 'doctor',
                    title: `${d.salutation || 'Dr.'} ${docFullName}`,
                    subtitle: d.specialization || 'Doctor',
                    url: `/hms/doctors/${d.id}`,
                    badge: 'Doctor',
                })
            })
        }),
    ])

    return results.slice(0, 12)
}
