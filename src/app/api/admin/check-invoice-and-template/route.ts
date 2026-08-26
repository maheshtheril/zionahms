import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const id = '4dac1518-74d2-403e-817b-064c1a74c714'
        const invoice = await prisma.hms_invoice.findUnique({
            where: { id },
            include: {
                hms_patient: true,
                hms_invoice_lines: true,
                hms_appointment: true
            }
        })

        const templates = await prisma.hms_print_template.findMany({
            where: { tenant_id: '41537389-7316-4a86-97a3-de21ff9833f7' }
        })

        const company = await prisma.company.findFirst({
            where: { tenant_id: '41537389-7316-4a86-97a3-de21ff9833f7' }
        })

        return NextResponse.json({
            invoice,
            templatesCount: templates.length,
            templates: templates.map(t => ({ id: t.id, name: t.name, usage: t.usage, is_active: t.is_active, is_default: t.is_default, config: t.config })),
            company
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
