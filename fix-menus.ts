import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. Move HMS Dashboard to Top
    const hmsDash = await prisma.menu_items.findFirst({
        where: { key: 'hms-dashboard' }
    })
    
    if (hmsDash) {
        await prisma.menu_items.update({
            where: { id: hmsDash.id },
            data: { sort_order: 1 } // ensure it's at the top
        })
        console.log("Moved HMS Dashboard to top.")
    }

    // 2. Insert POS Menu Item under Pharmacy
    const pharmacyParent = await prisma.menu_items.findFirst({
        where: { key: 'inv-pharmacy' }
    })
    const invParent = await prisma.menu_items.findFirst({
        where: { key: 'inv-dashboard' }
    })
    
    const parent = pharmacyParent?.parent_id || invParent?.parent_id
    if (!parent) {
        console.log("Could not find Inventory parent menu!")
        return
    }

    const existingPos = await prisma.menu_items.findFirst({
        where: { key: 'inv-pos' }
    })

    if (!existingPos) {
        await prisma.menu_items.create({
            data: {
                parent_id: parent,
                module_key: 'inventory',
                key: 'inv-pos',
                label: 'POS Terminal',
                icon: 'MonitorSmartphone',
                url: '/hms/pharmacy/pos',
                sort_order: 10,
                permission_code: 'pharmacy:view',
                is_global: true
            }
        })
        console.log("POS Menu created successfully in Database!")
    } else {
        console.log("POS Menu already exists in DB.")
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())
