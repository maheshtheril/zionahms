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
        // If targetTenantId is not provided, find the tenant with the most patients/data
        let tenantId = targetTenantId
        if (!tenantId) {
            const tenantsWithCounts = await prisma.tenant.findMany({
                include: {
                    _count: {
                        select: { hms_patient: true, hms_appointments: true }
                    },
                    companies: true,
                    hms_branch: true,
                }
            })

            // Sort by patient count desc
            tenantsWithCounts.sort((a, b) => b._count.hms_patient - a._count.hms_patient)
            const topTenant = tenantsWithCounts[0]
            if (topTenant) {
                tenantId = topTenant.id
            }
        }

        if (!tenantId) {
            return NextResponse.json({ error: "No tenants found" }, { status: 400 })
        }

        // Get tenant details
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                companies: true,
                hms_branch: true,
            }
        })

        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 })
        }

        const company = tenant.companies[0] || null
        const branch = tenant.hms_branch[0] || null

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Find or create user
        let user = await prisma.app_user.findFirst({
            where: { email: email.toLowerCase().trim() }
        })

        if (user) {
            user = await prisma.app_user.update({
                where: { id: user.id },
                data: {
                    tenant_id: tenant.id,
                    company_id: company?.id || null,
                    current_branch_id: branch?.id || null,
                    password: hashedPassword,
                    is_admin: true,
                    is_tenant_admin: true,
                    is_active: true,
                    role: 'admin'
                }
            })
        } else {
            user = await prisma.app_user.create({
                data: {
                    id: crypto.randomUUID(),
                    email: email.toLowerCase().trim(),
                    name: 'Mahesh Theril',
                    tenant_id: tenant.id,
                    company_id: company?.id || null,
                    current_branch_id: branch?.id || null,
                    password: hashedPassword,
                    is_admin: true,
                    is_tenant_admin: true,
                    is_active: true,
                    role: 'admin'
                }
            })
        }

        // Ensure user is in user_branch
        if (branch) {
            const existingUserBranch = await prisma.user_branch.findFirst({
                where: { user_id: user.id, branch_id: branch.id }
            })
            if (!existingUserBranch) {
                await prisma.user_branch.create({
                    data: {
                        user_id: user.id,
                        branch_id: branch.id,
                        is_default: true
                    }
                })
            }
        }

        // Check patient count for this tenant
        const patientCount = await prisma.hms_patient.count({
            where: { tenant_id: tenant.id }
        })

        return NextResponse.json({
            success: true,
            message: `User ${email} is now Super Admin of tenant: "${tenant.name}"`,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                company: company?.name,
                branch: branch?.name,
                patientCount: patientCount
            },
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isAdmin: user.is_admin
            }
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
    }
}
