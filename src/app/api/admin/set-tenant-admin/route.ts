import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || 'maheshtheril@live.com'
    const targetTenantId = searchParams.get('tenantId')
    const password = searchParams.get('password') || 'Admin@12345'

    try {
        // Find patient counts grouped by tenant using raw SQL
        const patientCounts: any[] = await prisma.$queryRaw`
            SELECT tenant_id, count(*)::int as count 
            FROM hms_patient 
            GROUP BY tenant_id 
            ORDER BY count DESC;
        `

        let tenantId = targetTenantId
        if (!tenantId && patientCounts.length > 0) {
            tenantId = patientCounts[0].tenant_id
        }

        // If still no tenantId, fetch the first tenant
        if (!tenantId) {
            const firstTenant: any[] = await prisma.$queryRaw`SELECT id FROM tenant LIMIT 1;`
            if (firstTenant.length > 0) tenantId = firstTenant[0].id
        }

        if (!tenantId) {
            return NextResponse.json({ error: "No tenants found in database" }, { status: 400 })
        }

        // Fetch tenant, company, branch details
        const tenantRows: any[] = await prisma.$queryRaw`
            SELECT id, name, slug FROM tenant WHERE id = ${tenantId}::uuid LIMIT 1;
        `
        const companyRows: any[] = await prisma.$queryRaw`
            SELECT id, name FROM company WHERE tenant_id = ${tenantId}::uuid LIMIT 1;
        `
        const branchRows: any[] = await prisma.$queryRaw`
            SELECT id, name FROM hms_branch WHERE tenant_id = ${tenantId}::uuid LIMIT 1;
        `

        const tenant = tenantRows[0]
        const company = companyRows[0] || null
        const branch = branchRows[0] || null

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Find or create user
        const normalizedEmail = email.toLowerCase().trim()
        const existingUsers: any[] = await prisma.$queryRaw`
            SELECT id FROM app_user WHERE email = ${normalizedEmail} LIMIT 1;
        `

        let userId = existingUsers[0]?.id

        if (userId) {
            await prisma.$executeRaw`
                UPDATE app_user 
                SET tenant_id = ${tenantId}::uuid,
                    company_id = ${company ? company.id : null}::uuid,
                    current_branch_id = ${branch ? branch.id : null}::uuid,
                    password = ${hashedPassword},
                    is_admin = true,
                    is_tenant_admin = true,
                    is_active = true,
                    role = 'admin'
                WHERE id = ${userId}::uuid;
            `
        } else {
            userId = crypto.randomUUID()
            await prisma.$executeRaw`
                INSERT INTO app_user (id, email, name, tenant_id, company_id, current_branch_id, password, is_admin, is_tenant_admin, is_active, role, created_at)
                VALUES (${userId}::uuid, ${normalizedEmail}, 'Mahesh Theril', ${tenantId}::uuid, ${company ? company.id : null}::uuid, ${branch ? branch.id : null}::uuid, ${hashedPassword}, true, true, true, 'admin', now());
            `
        }

        // Ensure user is in user_branch
        if (branch) {
            await prisma.$executeRaw`
                INSERT INTO user_branch (user_id, branch_id, is_default)
                VALUES (${userId}::uuid, ${branch.id}::uuid, true)
                ON CONFLICT DO NOTHING;
            `
        }

        const patientCount = patientCounts.find(p => p.tenant_id === tenantId)?.count || 0

        return NextResponse.json({
            success: true,
            message: `User ${normalizedEmail} is now Super Admin of hospital: "${tenant?.name}"`,
            hospital: {
                tenantId: tenant?.id,
                tenantName: tenant?.name,
                companyName: company?.name,
                branchName: branch?.name,
                totalPatients: patientCount
            },
            user: {
                id: userId,
                email: normalizedEmail,
                passwordSetTo: password
            },
            allHospitalPatientCounts: patientCounts
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
    }
}
