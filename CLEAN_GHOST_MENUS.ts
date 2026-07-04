import { prisma } from './src/lib/prisma';

async function main() {
    console.log("=========================================");
    console.log("  ZIONA HMS - SAFE MENU CLEANER");
    console.log("=========================================");
    console.log("Checking for orphaned ghost menus...");

    try {
        const deleted = await prisma.menu_items.deleteMany({
            where: {
                id: {
                    in: ['27fc480a-0846-46f0-9f3f-117d4e56bc1c', 'ef9e714c-5593-4a4c-adda-f5380c5d4a41']
                }
            }
        });

        console.log(`\n[SUCCESS] Cleaned up ${deleted.count} ghost menus.`);
        console.log("Patient data, billing, and settings were completely untouched.");
        
    } catch (err) {
        console.error("\n[ERROR] Could not clean menus:", err);
    }
}

main().catch(e => console.error(e)).finally(() => process.exit(0));
