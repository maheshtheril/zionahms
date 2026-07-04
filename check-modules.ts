import { prisma } from './src/lib/prisma';

async function checkModules() {
    try {
        const tenantModules = await prisma.tenant_module.findMany();
        console.log("Tenant Modules:", JSON.stringify(tenantModules, null, 2));
    } catch (e: any) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkModules();
