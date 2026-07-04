import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const products = await prisma.hms_product.findMany({
        orderBy: { updated_at: 'desc' },
        take: 1,
        include: { product_tax_rules: true }
    });
    console.log(JSON.stringify(products, null, 2));
}

main().finally(() => prisma.$disconnect());
