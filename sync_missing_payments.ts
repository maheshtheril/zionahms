import { prisma } from './src/lib/prisma';
import { AccountingService } from './src/lib/services/accounting';

async function main() {
    console.log("Starting missing payments sync...");
    
    // Find all invoice payments
    const payments = await prisma.hms_invoice_payments.findMany({
        include: { hms_invoice: true }
    });

    console.log(`Found ${payments.length} total payments.`);
    let fixed = 0;

    for (const p of payments) {
        if (!p.hms_invoice || p.hms_invoice.status === 'draft') continue;

        // Check if journal entry exists for this payment
        const paymentRef = `PMT-${p.id}`;
        const existing = await prisma.journal_entries.findFirst({
            where: { ref: paymentRef }
        });

        if (!existing) {
            console.log(`Missing journal entry for Payment ${p.id} (Invoice: ${p.invoice_id}). Fixing...`);
            try {
                await AccountingService.postSalesInvoice(p.invoice_id, p.created_by || undefined);
                fixed++;
                console.log(`Successfully posted payment for Invoice: ${p.invoice_id}`);
            } catch (err: any) {
                console.error(`Error posting for ${p.invoice_id}:`, err.message);
            }
        }
    }
    
    console.log(`Sync complete. Fixed ${fixed} missing payment entries.`);
}

main().finally(() => process.exit(0));
