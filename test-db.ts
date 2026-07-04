import { prisma } from './src/lib/prisma';
async function run() {
    const emptyStringPerms = await prisma.menu_items.count({ where: { permission_code: '' } });
    console.log(`Empty String Perms: ${emptyStringPerms}`);
}
run().catch(console.error);
