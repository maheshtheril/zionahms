import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("Checking DB...");
    const inv = await prisma.hms_purchase_invoice.findMany({
        where: {
            metadata: { path: ['source_receipt_id'], not: { equals: null } }
        }
    });
    console.log('Invoices with source_receipt_id in metadata:', inv.length);
    const invoices = await prisma.hms_purchase_invoice.findMany({ take: 5, orderBy: { created_at: 'desc' }});
    invoices.forEach(i => console.log(i.id, i.metadata));
}
main().catch(console.error).finally(() => prisma.$disconnect());
