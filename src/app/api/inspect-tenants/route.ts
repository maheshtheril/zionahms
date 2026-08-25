import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                created_at: true,
                companies: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                _count: {
                    select: {
                        hms_patient: true,
                        hms_appointments: true,
                        hms_clinicians: true,
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        })

        const users = await prisma.app_user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                tenant_id: true,
                company_id: true,
                current_branch_id: true,
            }
        })

        const totalPatients = await prisma.hms_patient.count()

        return NextResponse.json({
            totalPatients,
            tenants,
            users
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
    }
}
