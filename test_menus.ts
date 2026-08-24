import { getMenuItems } from './src/app/actions/navigation';

async function test() {
    // Mock global object to prevent audit
    (global as any).__hms_menu_audited = true;

    const items = await getMenuItems();
    // find finance group
    const financeGroup = items.find(g => g.module?.module_key === 'finance' || g.module?.module_key === 'accounting');
    if (financeGroup) {
        // Find the accounting menu which has the cashbook
        const accMenu = financeGroup.items.find((i: any) => i.key === 'hms_accounting' || i.label === 'Accounting');
        if (accMenu) {
            console.log("Accounting Menu Children:");
            accMenu.other_menu_items.forEach((c: any) => {
                console.log(`- ${c.label} (url: ${c.url}, key: ${c.key})`);
            });
        } else {
            console.log("Accounting parent not found in group", financeGroup.items.map((i: any) => i.label));
        }
    } else {
        console.log("Finance group not found");
    }
}

test().catch(console.error);
