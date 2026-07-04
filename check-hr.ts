import { prisma } from './src/lib/prisma'

async function run() {
    const items = await prisma.menu_items.findMany({ where: { module_key: 'hr' } });
    console.log("DB MENUS:");
    console.log(items.map(i => i.label + ' -> ' + i.url));
}

run().finally(() => prisma.$disconnect());
