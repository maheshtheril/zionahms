import { prisma } from './src/lib/prisma';
async function main() {
    const date = new Date();
    date.setHours(date.getHours() - 3);
    
    const companies = await prisma.company.findMany({
        where: { created_at: { gte: date } },
        orderBy: { created_at: 'desc' },
    });
    
    for (const c of companies) {
        const maps = await prisma.company_tax_maps.findMany({
            where: { company_id: c.id },
            include: { tax_rates: true }
        });
        const country = await prisma.countries.findUnique({ where: { id: c.country_id! }});
        console.log({
            name: c.name,
            country: country?.name,
            createdAt: c.created_at,
            taxes: maps.map(m => m.tax_rates.name)
        });
    }
}
main().finally(() => prisma.$disconnect());
