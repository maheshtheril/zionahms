import { prisma } from './src/lib/prisma';

async function main() {
    console.log("Starting DB fix...");
    try {
        // 1. Move HMS Dashboard to Top
        const hmsDash = await prisma.menu_items.findFirst({
            where: { key: 'hms-dashboard' }
        });
        
        if (hmsDash) {
            await prisma.menu_items.update({
                where: { id: hmsDash.id },
                data: { sort_order: 1 }
            });
            console.log("Updated hms-dashboard sort_order to 1.");
        } else {
            console.log("hms-dashboard not found in DB.");
        }

        // 2. Insert POS Menu Item under Pharmacy
        const pharmacyParent = await prisma.menu_items.findFirst({
            where: { key: 'inv-pharmacy' }
        });
        const invParent = await prisma.menu_items.findFirst({
            where: { key: 'inv-dashboard' }
        });
        
        const parent = pharmacyParent?.parent_id || invParent?.parent_id;
        
        if (parent) {
            const existingPos = await prisma.menu_items.findFirst({
                where: { key: 'inv-pos' }
            });

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
                });
                console.log("Inserted inv-pos menu item.");
            } else {
                console.log("inv-pos already exists.");
            }
        } else {
            console.log("Could not find parent for inv-pos.");
        }
    } catch (e: any) {
        console.error("Error updating DB:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
