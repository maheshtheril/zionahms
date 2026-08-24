import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateUniversalPDF } from "@/lib/pdf/universal-engine";
import { getCurrentCompany } from "@/app/actions/company";
import { generateV2HTML } from "@/lib/pdf/v2-html-renderer";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const session = await auth();
        
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 1. Fetch Comprehensive Invoice Data
        const invoice = await prisma.hms_invoice.findUnique({
            where: { id },
            include: {
                hms_patient: true,
                hms_invoice_lines: { include: { hms_product: true } },
                hms_appointment: { include: { hms_clinician: true } }
            }
        });

        if (!invoice) {
            return new NextResponse(`Invoice not found for ID: ${id}`, { status: 404 });
        }

        let companyData = await getCurrentCompany();
        if (!companyData) {
            companyData = await prisma.company.findUnique({ where: { id: invoice.company_id } });
            if (!companyData) {
                companyData = await prisma.company.findFirst({ orderBy: { created_at: 'asc' } });
                if (!companyData) {
                    return new NextResponse(`CRITICAL: Company not found`, { status: 404 });
                }
            }
        }

        const autoPrint = request.nextUrl.searchParams.get('autoPrint') === 'true';
        if (invoice) (invoice as any).total_amount = Number(invoice.total || 0).toFixed(2);

        // 2. CHECK FOR PRINT STUDIO V2 TEMPLATE
        try {
            if (session.user.companyId && session.user.tenantId) {
                const activeV2 = await prisma.hms_print_template.findFirst({
                    where: {
                        company_id: session.user.companyId,
                        tenant_id: session.user.tenantId,
                        usage: 'sale_bill',
                        is_active: true,
                        is_default: true,
                    }
                });
                const cfg = activeV2?.config as any;
                if (cfg?.source === 'print_studio_v2' && cfg?.blocks && cfg?.theme) {
                    const html = generateV2HTML(cfg.blocks, cfg.theme, invoice, companyData, autoPrint);
                    return new NextResponse(html, {
                        headers: {
                            'Content-Type': 'text/html; charset=utf-8',
                            'Cache-Control': 'no-store',
                        }
                    });
                }
            }
        } catch (v2err) {
            console.warn('[INVOICE-PRINTER] V2 check failed, falling back to PDF:', v2err);
        }

        // 3. FALLBACK: Legacy PDF engine
        const pdfBase64 = await generateUniversalPDF(
            'sale_bill',
            invoice,
            companyData,
            invoice.branch_id || session.user.current_branch_id as string,
            autoPrint
        );
        
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="Invoice_${invoice.id}.pdf"`,
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error: any) {
        console.error("[PRINTER-API] Error:", error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
