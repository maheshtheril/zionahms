import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAccounts } from "@/lib/account-seeder";
import { ensureDefaultJournals } from "@/lib/journal-seeder";
import { seedCompanyTaxes } from "@/lib/services/tax-seed";
import { initializeTenantMasters } from "@/lib/services/tenant-init";

export const dynamic = 'force-dynamic';

export async function GET() {
    const report: any[] = [];

    try {
        const companies = await prisma.company.findMany({
            select: {
                id: true,
                name: true,
                tenant_id: true,
            }
        });

        for (const comp of companies) {
            const compReport: any = {
                companyId: comp.id,
                companyName: comp.name,
                tenantId: comp.tenant_id,
            };

            // Count before
            const countBefore = await prisma.accounts.count({
                where: { company_id: comp.id }
            });
            compReport.accountsBefore = countBefore;

            try {
                // 1. Seed Chart of Accounts & Linked Settings
                await ensureDefaultAccounts(comp.id, comp.tenant_id);
                
                // 2. Seed Default Journals (Sales, Purchase, Bank, Cash, General)
                await ensureDefaultJournals(comp.id, comp.tenant_id);

                // 3. Seed Default Company Taxes
                await seedCompanyTaxes(comp.id, prisma);

                // 4. Seed Standard Masters (Departments, UOMs, Locations)
                await initializeTenantMasters(comp.tenant_id, comp.id);

                // Count after
                const countAfter = await prisma.accounts.count({
                    where: { company_id: comp.id }
                });
                compReport.accountsAfter = countAfter;
                compReport.status = "SUCCESS";
            } catch (err: any) {
                compReport.status = "ERROR";
                compReport.error = err.message || String(err);
            }

            report.push(compReport);
        }

        return NextResponse.json({
            success: true,
            message: "Chart of Accounts and Accounting Settings seeded successfully.",
            timestamp: new Date().toISOString(),
            companiesProcessed: report.length,
            details: report
        });
    } catch (error: any) {
        console.error("[SeedAccountingRoute] Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || String(error)
        }, { status: 500 });
    }
}
