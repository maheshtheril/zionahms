import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const tenants: any[] = await prisma.$queryRaw`
            SELECT t.id, t.name, t.slug, t.created_at,
                   c.id as company_id, c.name as company_name,
                   (SELECT count(*)::int FROM hms_patient p WHERE p.tenant_id = t.id) as patient_count,
                   (SELECT count(*)::int FROM hms_appointments a WHERE a.tenant_id = t.id) as appointment_count
            FROM tenant t
            LEFT JOIN company c ON c.tenant_id = t.id
            ORDER BY patient_count DESC;
        `

        const totalPatients: any[] = await prisma.$queryRaw`SELECT count(*)::int as total FROM hms_patient;`

        return NextResponse.json({
            totalPatients: totalPatients[0]?.total || 0,
            tenants
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
    }
}
