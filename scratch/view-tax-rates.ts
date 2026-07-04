import { prisma } from '../src/lib/prisma';

async function main() {
    const taxes = await prisma.tax_rates.findMany({take: 5});
    console.log(JSON.stringify(taxes, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
