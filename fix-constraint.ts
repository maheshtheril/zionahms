import { prisma } from './src/lib/prisma';
async function main() {
    await prisma.$executeRawUnsafe('ALTER TABLE company_tax_maps DROP CONSTRAINT IF EXISTS company_tax_maps_company_tax_type_uniq;');
    await prisma.$executeRawUnsafe('ALTER TABLE company_tax_maps ADD CONSTRAINT company_tax_maps_company_tax_rate_uniq UNIQUE (company_id, tax_rate_id);');
    console.log('Constraint updated successfully!');
}
main().finally(() => prisma.$disconnect());
