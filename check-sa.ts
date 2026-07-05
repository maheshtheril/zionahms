import { prisma } from './src/lib/prisma';
async function main() {
    const sa = await prisma.countries.findFirst({ where: { iso2: 'SA' }});
    const companies = await prisma.company.findMany({
        where: { country_id: sa?.id },
        orderBy: { created_at: 'desc' },
        take: 5
    });
    
    for (const c of companies) {
        const maps = await prisma.company_tax_maps.findMany({
            where: { company_id: c.id },
            include: { tax_rates: true }
        });
        console.log({
            name: c.name,
            createdAt: c.created_at,
            taxes: maps.map(m => m.tax_rates.name)
        });
    }
}
main().finally(() => prisma.$disconnect());
