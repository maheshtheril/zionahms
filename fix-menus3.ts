import { prisma } from './src/lib/prisma';

async function main() {
    try {
        const existingPos = await prisma.menu_items.findFirst({
            where: { key: 'inv-pos' }
        });

        if (!existingPos) {
            await prisma.menu_items.create({
                data: {
                    parent_id: null,
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
            console.log("Inserted inv-pos menu item as root under inventory.");
        } else {
            console.log("inv-pos already exists.");
        }
    } catch (e: any) {
        console.error("Error updating DB:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
