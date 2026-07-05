import { prisma } from './src/lib/prisma';
import { currenciesList } from './src/lib/static-data';

async function fixCurrencies() {
    console.log("Fixing currency symbols...");
    for (const curr of currenciesList) {
        if (!curr.symbol) continue;
        await prisma.currencies.updateMany({
            where: { code: curr.code },
            data: { symbol: curr.symbol }
        });
        console.log(`Updated ${curr.code} to ${curr.symbol}`);
    }
    console.log("Done!");
}

fixCurrencies().catch(console.error).finally(() => prisma.$disconnect());
