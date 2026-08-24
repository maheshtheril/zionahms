import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const receipts = await prisma.$queryRaw`
    SELECT 
      r.name as receipt_no, 
      r.metadata->>'round_off_amount' as receipt_round_off,
      i.name as invoice_no,
      i.subtotal,
      i.tax_total,
      i.round_off_amount as invoice_round_off,
      i.total_amount
    FROM hms_purchase_receipt r
    LEFT JOIN hms_purchase_invoice i ON i.metadata->>'source_receipt_id' = r.id::text
    ORDER BY r.created_at DESC
    LIMIT 5
  `;
  console.log(JSON.stringify(receipts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
