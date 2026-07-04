import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const menus = await prisma.hms_menu_items.findMany({
        where: { label: { contains: 'Lab', mode: 'insensitive' } }
    })
    console.dir(menus, { depth: null });
}

main().catch(console.error).finally(() => prisma.())
