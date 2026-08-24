import { prisma } from './src/lib/prisma';
import crypto from 'crypto';

async function main() {
    const cashbookMenu = await prisma.menu_items.findFirst({
        where: { url: '/hms/accounting/cashbook' }
    });

    if (cashbookMenu) {
        await prisma.menu_items.update({
            where: { id: cashbookMenu.id },
            data: { label: 'Cashbook' }
        });
        console.log("Updated Cashbook menu label.");

        const bankbookMenu = await prisma.menu_items.findFirst({
            where: { url: '/hms/accounting/bankbook' }
        });

        if (!bankbookMenu) {
            await prisma.menu_items.create({
                data: {
                    id: crypto.randomUUID(),
                    label: 'Bankbook',
                    url: '/hms/accounting/bankbook',
                    icon: 'CreditCard',
                    parent_id: cashbookMenu.parent_id,
                    sort_order: (cashbookMenu.sort_order || 0) + 1,
                    module_key: cashbookMenu.module_key,
                    key: 'hms_accounting_bankbook'
                }
            });
            console.log("Created Bankbook menu.");
        } else {
            console.log("Bankbook menu already exists.");
        }
    } else {
        console.log("Cashbook menu not found.");
    }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
