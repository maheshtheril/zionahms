import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const template = await prisma.hms_print_template.findUnique({
        where: { id: 'e8c67c86-7609-4c08-839b-833e5d53467f' }
    });
    console.log(JSON.stringify(template, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
