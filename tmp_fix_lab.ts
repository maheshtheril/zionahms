import { prisma } from './src/lib/prisma'

async function main() {
    const parentMenu = await prisma.menu_items.findFirst({
        where: { key: 'hms-lab' }
    });

    if (parentMenu) {
        await prisma.menu_items.update({
            where: { id: parentMenu.id },
            data: { url: '#' }
        });

        const child1 = await prisma.menu_items.findFirst({ where: { key: 'hms-lab-orders' }});
        if (!child1) {
            await prisma.menu_items.create({
                data: {
                    label: 'Lab Orders',
                    url: '/hms/lab',
                    key: 'hms-lab-orders',
                    module_key: 'hms',
                    icon: 'List',
                    sort_order: 1,
                    parent_id: parentMenu.id,
                    is_global: true,
                    permission_code: 'lab:view'
                }
            })
        }
        
        const child2 = await prisma.menu_items.findFirst({ where: { key: 'hms-lab-tests' }});
        if (!child2) {
            await prisma.menu_items.create({
                data: {
                    label: 'Test Catalog',
                    url: '/hms/lab/tests',
                    key: 'hms-lab-tests',
                    module_key: 'hms',
                    icon: 'TestTube',
                    sort_order: 2,
                    parent_id: parentMenu.id,
                    is_global: true,
                    permission_code: 'lab:view'
                }
            })
        }
    }
    console.log("Updated Lab menu");
}

main().catch(console.error).finally(() => prisma.())
