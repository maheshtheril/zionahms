import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const tenantId = '41537389-7316-4a86-97a3-de21ff9833f7'

        // 1. Find INR currency
        const inrCurrency = await prisma.currencies.findFirst({
            where: { code: 'INR' }
        })

        if (inrCurrency) {
            // Update company settings to INR
            const companies = await prisma.company.findMany({
                where: { tenant_id: tenantId }
            })

            for (const comp of companies) {
                await prisma.company_settings.upsert({
                    where: { company_id: comp.id },
                    update: { currency_id: inrCurrency.id },
                    create: {
                        company_id: comp.id,
                        tenant_id: tenantId,
                        currency_id: inrCurrency.id
                    }
                })
            }
        }

        // 2. Fetch Latest Invoices / Bills
        const latestInvoices: any[] = await prisma.$queryRaw`
            SELECT i.id, i.invoice_number, i.patient_id, p.full_name as patient_name, 
                   i.total, i.currency, i.status, i.created_at, i.updated_at
            FROM hms_invoice i
            LEFT JOIN hms_patient p ON p.id = i.patient_id
            WHERE i.tenant_id = ${tenantId}::uuid
            ORDER BY i.created_at DESC
            LIMIT 10;
        `

        // 3. Fetch Latest OP Bookings / Appointments
        const latestAppointments: any[] = await prisma.$queryRaw`
            SELECT a.id, a.token_number, a.patient_id, p.full_name as patient_name,
                   a.starts_at, a.status, a.created_at, a.updated_at
            FROM hms_appointments a
            LEFT JOIN hms_patient p ON p.id = a.patient_id
            WHERE a.tenant_id = ${tenantId}::uuid
            ORDER BY a.created_at DESC
            LIMIT 10;
        `

        // 4. Fetch Latest Patients Registered
        const latestPatients: any[] = await prisma.$queryRaw`
            SELECT id, patient_id, full_name, mobile_primary, created_at, updated_at
            FROM hms_patient
            WHERE tenant_id = ${tenantId}::uuid
            ORDER BY created_at DESC
            LIMIT 10;
        `

        return NextResponse.json({
            currencyUpdated: "INR (₹)",
            latestInvoices,
            latestAppointments,
            latestPatients
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
    }
}
