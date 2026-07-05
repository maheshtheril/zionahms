import { prisma } from './src/lib/prisma';
async function main() {
    await prisma.$executeRawUnsafe('ALTER TABLE hms_uom ALTER COLUMN ratio TYPE numeric(16,6);');
    await prisma.$executeRawUnsafe('ALTER TABLE hms_uom ALTER COLUMN rounding TYPE numeric(16,6);');
    console.log('Columns updated successfully!');
}
main().finally(() => prisma.$disconnect());
