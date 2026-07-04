import { prisma } from './src/lib/prisma'

async function run() {
    const tenant = await prisma.tenant.findFirst()
    const user = await prisma.app_user.findFirst({ where: { tenant_id: tenant.id, is_active: true } })

    console.log("Setting up Salary Structure for:", user.name)

    await prisma.hms_staff_salary.upsert({
        where: { user_id: user.id },
        update: {
            base_salary: 50000,
            allowances: { "HRA": 15000, "Transport": 5000 },
            deductions: { "PF": 1800, "Tax": 1000 }
        },
        create: {
            tenant_id: tenant.id,
            user_id: user.id,
            base_salary: 50000,
            allowances: { "HRA": 15000, "Transport": 5000 },
            deductions: { "PF": 1800, "Tax": 1000 }
        }
    })

    console.log("Injecting Absences for July 2026...")
    const month = 7
    const year = 2026

    // Delete existing attendance
    await prisma.hms_staff_attendance.deleteMany({
        where: { user_id: user.id }
    })

    // Create 20 days of check-ins
    for(let i=1; i<=20; i++) {
        await prisma.hms_staff_attendance.create({
            data: {
                tenant_id: tenant.id,
                user_id: user.id,
                check_in: new Date(Date.UTC(year, month-1, i, 9, 0, 0)),
                status: 'present'
            }
        })
    }

    console.log("Done! Test user:", user.name, user.id)
}

run().catch(console.error).finally(() => prisma.$disconnect())
