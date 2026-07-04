import { prisma } from './src/lib/prisma';

async function fix() {
    try {
        await prisma.menu_items.deleteMany({
            where: { key: 'inv-pos' }
        });
        console.log("Deleted inv-pos from DB to allow fallback to inject it properly.");
    } catch (e: any) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
fix();
