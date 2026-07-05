import { prisma } from './src/lib/prisma';
async function main() {
    const rates = await prisma.tax_rates.findMany({ include: { tax_types: true } });
    console.log(JSON.stringify(rates, null, 2));
}
main().finally(() => prisma.$disconnect());
