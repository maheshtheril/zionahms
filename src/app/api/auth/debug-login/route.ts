import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const email = (searchParams.get('email') || 'maheshtheril@live.com').trim().toLowerCase()
    const password = (searchParams.get('password') || 'Admin@12345').trim()

    const stepLogs: string[] = []

    try {
        stepLogs.push(`1. Looking up user in DB for email: "${email}"`)
        const user: any = await prisma.app_user.findFirst({
            where: {
                email: email,
                is_active: true
            }
        })

        if (!user) {
            stepLogs.push(`FAIL: User not found in DB or is_active is false.`)
            // List all users
            const allUsers = await prisma.app_user.findMany({
                select: { id: true, email: true, is_active: true }
            })
            return NextResponse.json({
                success: false,
                stepLogs,
                allUsersInDb: allUsers
            })
        }

        stepLogs.push(`SUCCESS: User found with ID: ${user.id}, tenant_id: ${user.tenant_id}`)

        stepLogs.push(`2. Comparing password against bcrypt hash...`)
        if (!user.password) {
            stepLogs.push(`FAIL: User has no password in DB!`)
            return NextResponse.json({ success: false, stepLogs })
        }

        const passwordsMatch = await bcrypt.compare(password, user.password)
        stepLogs.push(`Password match result: ${passwordsMatch}`)

        if (!passwordsMatch) {
            stepLogs.push(`FAIL: Password does not match hash. Resetting password to ${password}...`)
            const newHash = await bcrypt.hash(password, 10)
            await prisma.app_user.update({
                where: { id: user.id },
                data: { password: newHash, is_active: true }
            })
            stepLogs.push(`SUCCESS: Password hash forcibly updated to match "${password}".`)
        }

        stepLogs.push(`3. Testing session enrichment queries...`)
        const [branchResult, tenantInfo, company, tenantModules] = await Promise.all([
            user.current_branch_id
                ? prisma.hms_branch.findUnique({ where: { id: user.current_branch_id }, select: { name: true } })
                : Promise.resolve(null),
            user.tenant_id
                ? prisma.tenant.findUnique({ where: { id: user.tenant_id }, select: { db_url: true, slug: true, name: true, metadata: true } })
                : Promise.resolve(null),
            user.company_id
                ? prisma.company.findFirst({ where: { id: user.company_id }, include: { company_settings: { include: { currencies: true } } } })
                : Promise.resolve(null),
            user.tenant_id
                ? prisma.tenant_module.findMany({ where: { tenant_id: user.tenant_id, enabled: true }, select: { module_key: true } })
                : Promise.resolve([])
        ])

        stepLogs.push(`SUCCESS: Enrichment completed. Branch: ${branchResult?.name}, Tenant: ${tenantInfo?.name}, Modules: ${(tenantModules as any[]).length}`)

        return NextResponse.json({
            success: true,
            stepLogs,
            authenticatedUser: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantName: tenantInfo?.name,
                companyName: company?.name,
                branchName: branchResult?.name
            }
        })
    } catch (e: any) {
        stepLogs.push(`CRITICAL ERROR: ${e.message}`)
        return NextResponse.json({
            success: false,
            error: e.message,
            stack: e.stack,
            stepLogs
        }, { status: 500 })
    }
}
