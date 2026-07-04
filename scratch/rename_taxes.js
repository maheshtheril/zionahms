const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const taxes = await prisma.company_taxes.findMany();
    for (const tax of taxes) {
        if (tax.name.includes('VAT')) {
            const newName = tax.name.replace('VAT', 'GST');
            await prisma.company_taxes.update({
                where: { id: tax.id },
                data: { name: newName }
            });
            console.log(`Updated ${tax.name} to ${newName}`);
        }
    }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
