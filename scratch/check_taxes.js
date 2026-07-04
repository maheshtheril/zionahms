const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const taxes = await prisma.company_taxes.findMany({take: 5});
    console.log(JSON.stringify(taxes, null, 2));

    const settings = await prisma.companies.findFirst({
        select: { id: true, name: true, settings: true, base_currency: true, country: true, tax_id: true }
    });
    console.log("COMPANY SETTINGS:");
    console.log(JSON.stringify(settings, null, 2));
}

main().finally(() => prisma.$disconnect());
