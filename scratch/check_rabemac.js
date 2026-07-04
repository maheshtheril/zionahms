const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const p = await prisma.hms_product.findFirst({
        where: { name: { contains: 'RABEMAC DSR SYP', mode: 'insensitive' } },
        include: { product_tax_rules: true }
    });
    console.log(JSON.stringify(p, null, 2));
}

main().finally(() => prisma.$disconnect());
