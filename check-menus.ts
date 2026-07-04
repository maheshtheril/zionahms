import { prisma } from './src/lib/prisma';

async function checkMenus() {
    try {
        const menus = await prisma.menu_items.findMany({
            where: {
                OR: [
                    { label: { contains: 'billing', mode: 'insensitive' } },
                    { label: { contains: 'pharmacy', mode: 'insensitive' } },
                    { label: { contains: 'pos', mode: 'insensitive' } }
                ]
            }
        });
        console.log(JSON.stringify(menus, null, 2));
    } catch (e: any) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkMenus();
