import { prisma } from '../src/lib/prisma';

async function main() {
    const taxes = await prisma.company_taxes.findMany();
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
