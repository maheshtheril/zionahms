import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const grn = await prisma.hms_purchase_receipt.findFirst({
        where: { name: 'GRN-2026-0001' },
        include: { hms_purchase_receipt_line: true }
    });
    if (!grn) {
        console.log("GRN not found!");
        return;
    }
    console.log("=== RECEIPT ===");
    console.log(grn.id);
    console.log("Metadata:", JSON.stringify(grn.metadata, null, 2));

    const totalAmount = grn.hms_purchase_receipt_line.reduce((sum, line) => {
        const meta = line.metadata as any || {};
        const taxAmount = meta.tax?.amount ?? meta.tax_amount ?? 0;
        return sum + (Number(line.qty || 0) * Number(line.unit_price || 0)) + Number(taxAmount);
    }, 0) + Number((grn.metadata as any)?.round_off_amount || 0);

    console.log("Calculated Total (List View):", totalAmount);

    console.log("=== INVOICE ===");
    const invoices = await prisma.hms_purchase_invoice.findMany({
        where: { company_id: grn.company_id, supplier_id: grn.supplier_id },
        orderBy: { created_at: 'desc' },
        take: 100
    });
    const invoice = invoices.find(inv => (inv.metadata as any)?.source_receipt_id === grn.id);
    if (invoice) {
        console.log("Invoice ID:", invoice.id);
        console.log("Invoice Name:", invoice.name);
        console.log("Subtotal:", invoice.subtotal);
        console.log("Tax:", invoice.tax_total);
        console.log("Total:", invoice.total_amount);
        console.log("Round Off:", invoice.round_off_amount);
    } else {
        console.log("Invoice not found!");
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
