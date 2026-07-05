import { prisma } from './src/lib/prisma';
async function main() {
    await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS company_tax_maps_company_tax_type_uniq;');
    console.log('Index dropped successfully!');
}
main().finally(() => prisma.$disconnect());
