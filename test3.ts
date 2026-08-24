import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
async function main() {
    console.log("Checking metadata type...");
    const receipts = await prisma.hms_purchase_receipt.findMany({ take: 5, orderBy: { created_at: 'desc' }});
    receipts.forEach(r => console.log(r.id, "meta type:", typeof r.metadata, "value:", r.metadata));
}
main().catch(console.error).finally(() => prisma.$disconnect());
