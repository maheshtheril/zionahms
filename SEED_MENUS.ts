import { ensureHmsMenus, ensureAdminMenus, ensureCrmMenus, ensurePurchasingMenus, ensureAccountingMenu } from './src/lib/menu-seeder';
import { prisma } from './src/lib/prisma';

async function main() {
    console.log("=========================================");
    console.log("  ZIONA HMS - SAFE MENU SEEDER");
    console.log("=========================================");
    console.log("Running safe database sync to ensure all standard menus exist...");
    
    try {
        await ensureHmsMenus();
        await ensureAdminMenus();
        await ensureCrmMenus();
        await ensurePurchasingMenus();
        await ensureAccountingMenu();
        
        console.log("\n[SUCCESS] Menu seed complete!");
        console.log("All default menus and permissions have been restored or updated.");
    } catch (err) {
        console.error("\n[ERROR] Menu seed failed:", err);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
