import { prisma } from './src/lib/prisma';
async function main() {
    const mappings = await prisma.country_tax_mappings.count();
    console.log('country_tax_mappings count:', mappings);

    const rates = await prisma.tax_rates.count();
    console.log('tax_rates count:', rates);
}
main().finally(() => prisma.$disconnect());
