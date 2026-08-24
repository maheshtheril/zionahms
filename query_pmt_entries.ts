import { prisma } from './src/lib/prisma';
async function main() {
    const c = await prisma.companies.findFirst();
    const jes = await prisma.journal_entry_lines.findMany({
        where: { journal_entries: { ref: { startsWith: 'PMT-' } } },
        include: { accounts: true, journal_entries: true },
        take: 10,
        orderBy: { created_at: 'desc' }
    });
    console.log("PAYMENT JEs:", JSON.stringify(jes.map(j => ({
        id: j.id,
        account: j.accounts.name,
        code: j.accounts.code,
        debit: j.debit,
        credit: j.credit,
        date: j.journal_entries.date,
        posted: j.journal_entries.posted,
        ref: j.journal_entries.ref
    })), null, 2));
}
main().finally(() => process.exit(0));
