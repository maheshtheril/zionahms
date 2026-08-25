import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
    const tenantId = '41537389-7316-4a86-97a3-de21ff9833f7'
    const results: any = { status: "OK", tenantId }

    // 1. Update Currency to INR
    try {
        const inrCurrency = await prisma.currencies.findFirst({
            where: { code: 'INR' }
        })

        if (inrCurrency) {
            await prisma.$executeRaw`
                UPDATE company_settings 
                SET currency_id = ${inrCurrency.id}::uuid 
                WHERE tenant_id = ${tenantId}::uuid;
            `
            results.currency = "INR (₹) updated successfully"
        }
    } catch (e: any) {
        results.currencyError = e.message
    }

    // 2. Fetch Latest Invoices
    try {
        const invoices: any[] = await prisma.$queryRaw`
            SELECT id, invoice_number, patient_id, total, currency, status, created_at
            FROM hms_invoice
            WHERE tenant_id = ${tenantId}::uuid
            ORDER BY created_at DESC
            LIMIT 10;
        `
        results.latestInvoices = invoices
    } catch (e: any) {
        results.invoicesError = e.message
    }

    // 3. Fetch Latest Appointments
    try {
        const appointments: any[] = await prisma.$queryRaw`
            SELECT id, patient_id, starts_at, status, created_at
            FROM hms_appointments
            WHERE tenant_id = ${tenantId}::uuid
            ORDER BY created_at DESC
            LIMIT 10;
        `
        results.latestAppointments = appointments
    } catch (e: any) {
        results.appointmentsError = e.message
    }

    // 4. Fetch Latest Patients
    try {
        const patients: any[] = await prisma.$queryRaw`
            SELECT id, patient_id, full_name, mobile_primary, created_at
            FROM hms_patient
            WHERE tenant_id = ${tenantId}::uuid
            ORDER BY created_at DESC
            LIMIT 10;
        `
        results.latestPatients = patients
    } catch (e: any) {
        results.patientsError = e.message
    }

    return NextResponse.json(results)
}
