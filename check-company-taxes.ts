import { prisma } from './src/lib/prisma';
async function main() {
    const companies = await prisma.company.findMany({
        orderBy: { created_at: 'desc' }
    });
    
    const taxMaps = await prisma.company_tax_maps.findMany({
        include: { tax_rates: true }
    });

    const result = companies.map(c => {
        const maps = taxMaps.filter(t => t.company_id === c.id);
        return {
            name: c.name,
            countryId: c.country_id,
            createdAt: c.created_at,
            taxes: maps.map(m => m.tax_rates.name)
        };
    });

    console.log(JSON.stringify(result, null, 2));
}
main().finally(() => prisma.$disconnect());
