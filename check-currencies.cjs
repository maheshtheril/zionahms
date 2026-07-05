const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const currencies = await prisma.currencies.findMany();
    console.log(currencies);
}
main().catch(console.error).finally(() => prisma.$disconnect());
