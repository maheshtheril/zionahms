import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("Fetching recent invoices...");
    const invoices = await prisma.hms_purchase_invoice.findMany({ take: 5, orderBy: { updated_at: 'desc' }});
    invoices.forEach(i => console.log(i.id, "subtotal:", i.subtotal, "tax:", i.tax_total, "total:", i.total_amount, "roundoff:", i.round_off_amount, "meta:", typeof i.metadata, i.metadata));

    console.log("Fetching recent receipts...");
    const receipts = await prisma.hms_purchase_receipt.findMany({ take: 5, orderBy: { updated_at: 'desc' }});
    receipts.forEach(r => console.log(r.id, "name:", r.name, "meta:", typeof r.metadata, r.metadata));
}
main().catch(console.error).finally(() => prisma.$disconnect());
