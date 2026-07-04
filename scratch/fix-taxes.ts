import { prisma } from '../src/lib/prisma';

async function main() {
    const taxes = await prisma.company_taxes.findMany();
    let count = 0;
    for (const tax of taxes) {
        if (tax.name.includes('VAT')) {
            const newName = tax.name.replace('VAT', 'GST');
            await prisma.company_taxes.update({
                where: { id: tax.id },
                data: { name: newName }
            });
            console.log(`Updated ${tax.name} to ${newName}`);
            count++;
        }
    }
    console.log(`Successfully updated ${count} tax records.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
