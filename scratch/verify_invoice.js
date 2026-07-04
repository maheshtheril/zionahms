const { prisma } = require('../src/lib/prisma');

async function main() {
  const inv = await prisma.hms_invoice.findFirst({
    orderBy: { created_at: 'desc' },
    include: { hms_invoice_lines: true }
  });
  if (!inv) {
    console.log('No invoice found in the system.');
    return;
  }
  const gl = await prisma.journal_entries.findFirst({
    where: { invoice_id: inv.id },
    include: { journal_entry_lines: true }
  });
  const stock = await prisma.hms_stock_ledger.findMany({
    where: { related_type: 'hms_invoice', related_id: inv.id },
    include: { hms_product_batch: true }
  });
  console.log('=== Invoice Summary ===');
  console.log(`ID: ${inv.id}`);
  console.log(`Number: ${inv.invoice_number}`);
  console.log(`Total: ${inv.total}`);
  console.log('Lines:', inv.hms_invoice_lines.length);
  console.log('\n=== General Ledger Entry ===');
  if (gl) {
    console.log(`JE ID: ${gl.id}, Ref: ${gl.ref}, Amount: ${gl.amount_in_company_currency}`);
    console.log('Lines:');
    gl.journal_entry_lines.forEach(l => {
      console.log(`  Account ${l.account_id}: Debit ${l.debit}, Credit ${l.credit}, Desc: ${l.description}`);
    });
  } else {
    console.log('No journal entry found for this invoice.');
  }
  console.log('\n=== Stock Ledger Movements ===');
  console.log(`Found ${stock.length} stock ledger rows linked to the invoice.`);
  stock.forEach(s => {
    console.log(`  Product ${s.product_id}, Qty ${s.qty}, Batch ${s.batch_id}, Ref ${s.reference}`);
  });
}

main()
  .catch(e => {
    console.error('Verification script error:', e);
    process.exit(1);
  });
