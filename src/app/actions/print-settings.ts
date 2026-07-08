'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

const DEFAULT_CONFIG = {
    automation: {
        autoPrint: false,
        previewBeforePrint: true,
        whatsappOnSave: false,
        emailOnSave: false,
        actionAfterSave: 'success_screen'
    },
    columns: {
        showTax: true,
        showDiscount: true,
        showUOM: true,
        showHsn: false
    }
};

const SEED_TEMPLATES = [
    {
        name: "Standard A4 (Detailed)",
        usage: "sale_bill",
        config: { pageSizeSettings: { format: "a4" }, source: "stable", ...DEFAULT_CONFIG }
    },
    {
        name: "Standard A5 (Compact)",
        usage: "sale_bill",
        config: { pageSizeSettings: { format: "a5" }, source: "stable", ...DEFAULT_CONFIG }
    },
    {
        name: "Legacy Thermal (HTML)",
        usage: "pos_bill",
        config: { source: "legacy_html", ...DEFAULT_CONFIG } 
    },
    {
        name: "80mm Thermal (PDF Engine)",
        usage: "pos_bill",
        config: { pageSizeSettings: { format: "roll80" }, source: "stable", ...DEFAULT_CONFIG }
    }
];

export async function getPrintTemplates() {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.tenantId) {
        return { success: false, error: "Unauthorized" };
    }
    const { companyId, tenantId } = session.user;

    try {
        // Ensure default templates exist for this company
        for (const tpl of SEED_TEMPLATES) {
            const exists = await prisma.hms_print_template.findFirst({
                where: { tenant_id: tenantId, company_id: companyId, usage: tpl.usage, name: tpl.name }
            });
            if (!exists) {
                const isDefault = (tpl.usage === 'pos_bill' && tpl.name.includes("Legacy")) || 
                                  (tpl.usage === 'sale_bill' && tpl.name.includes("A4"));
                
                await prisma.hms_print_template.create({
                    data: {
                        tenant_id: tenantId,
                        company_id: companyId,
                        name: tpl.name,
                        usage: tpl.usage,
                        config: tpl.config,
                        is_default: isDefault,
                        is_active: true
                    }
                });
            }
        }

        const templates = await prisma.hms_print_template.findMany({
            where: { tenant_id: tenantId, company_id: companyId, is_active: true },
            orderBy: [{ usage: 'asc' }, { name: 'asc' }]
        });

        const grouped = {
            sale_bill: templates.filter(t => t.usage === 'sale_bill'),
            pos_bill: templates.filter(t => t.usage === 'pos_bill')
        };

        return { success: true, data: grouped };
    } catch (e: any) {
        console.error("Failed to get print templates:", e);
        return { success: false, error: e.message };
    }
}

export async function setPrintTemplateActive(id: string, usage: string) {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.tenantId) {
        return { success: false, error: "Unauthorized" };
    }
    const { companyId, tenantId } = session.user;

    try {
        await prisma.$transaction(async (tx) => {
            await tx.hms_print_template.updateMany({
                where: { tenant_id: tenantId, company_id: companyId, usage: usage },
                data: { is_default: false }
            });
            
            await tx.hms_print_template.update({
                where: { id },
                data: { is_default: true }
            });
        });

        revalidatePath('/hms/settings/print');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updatePrintTemplateConfig(id: string, newConfig: any) {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.tenantId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.hms_print_template.update({
            where: { id, tenant_id: session.user.tenantId, company_id: session.user.companyId },
            data: { config: newConfig }
        });
        revalidatePath('/hms/settings/print');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getActivePOSPrintConfig() {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.tenantId) return null;

    try {
        const activeTemplate = await prisma.hms_print_template.findFirst({
            where: { 
                tenant_id: session.user.tenantId, 
                company_id: session.user.companyId, 
                usage: 'pos_bill',
                is_default: true
            }
        });
        
        if (activeTemplate) {
            return activeTemplate.config;
        }
        return { source: "legacy_html", ...DEFAULT_CONFIG };
    } catch (e) {
        return { source: "legacy_html", ...DEFAULT_CONFIG };
    }
}

export async function getActiveGeneralBillingConfig() {
    const session = await auth();
    if (!session?.user?.companyId || !session?.user?.tenantId) return null;

    try {
        const activeTemplate = await prisma.hms_print_template.findFirst({
            where: { 
                tenant_id: session.user.tenantId, 
                company_id: session.user.companyId, 
                usage: 'sale_bill',
                is_default: true
            }
        });
        
        if (activeTemplate) {
            return activeTemplate.config;
        }
        return { source: "stable", pageSizeSettings: { format: "a4" }, ...DEFAULT_CONFIG };
    } catch (e) {
        return { source: "stable", pageSizeSettings: { format: "a4" }, ...DEFAULT_CONFIG };
    }
}
