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

        console.log(`[PRINTER] Fetching Purchase Receipt ID: ${id}`);
        const receipt = await prisma.hms_purchase_receipt.findUnique({
            where: { id: id },
            include: {
                hms_supplier: true,
                hms_purchase_receipt_line: true
            }
        });

        if (!receipt) {
            console.error(`[PRINTER] Error 404 - Receipt not found for ID: ${id}`);
            return new NextResponse(`Receipt not found for ID: ${id}`, { status: 404 });
        }

        console.log(`[PRINTER] Receipt found! Company ID is: ${receipt.company_id}`);
        let companyData = await getCurrentCompany();
        if (!companyData) {
            companyData = await prisma.company.findUnique({
                where: { id: receipt.company_id }
            });
            if (!companyData) {
                companyData = await prisma.company.findFirst({
                    orderBy: { created_at: 'asc' }
                });
            }
        }

        const autoPrint = request.nextUrl.searchParams.get('autoPrint') === 'true';

        // Load products for line items
        const productIds = receipt.hms_purchase_receipt_line.map((line: any) => line.product_id).filter(Boolean);
        const products = await prisma.hms_product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true }
        });
        const productMap = new Map(products.map(p => [p.id, p.name]));

        // Calculate totals for PDF rendering
        let totalSubtotal = 0;
        let totalTax = 0;
        const mappedLines = receipt.hms_purchase_receipt_line.map((l: any) => {
            const qty = Number(l.qty || 0);
            const price = Number(l.unit_price || 0);
            const meta = l.metadata as any || {};
            const taxAmt = meta.tax?.amount ?? meta.tax_amount ?? 0;
            const lineTotal = (qty * price) + Number(taxAmt);
            totalSubtotal += (qty * price);
            totalTax += Number(taxAmt);

            return {
                ...l,
                description: productMap.get(l.product_id) || meta.product_name || "Received Item",
                quantity: qty,
                unit_price: price,
                net_amount: lineTotal
            };
        });

        const printData = {
            ...receipt,
            receipt_number: receipt.name,
            subtotal: totalSubtotal.toFixed(2),
            tax_amount: totalTax.toFixed(2),
            total_amount: (totalSubtotal + totalTax).toFixed(2),
            patient_name: receipt.hms_supplier?.name || "Vendor / Supplier",
            patient_phone: receipt.hms_supplier?.phone || (receipt.metadata as any)?.reference || "N/A",
            items: mappedLines,
            created_at: receipt.receipt_date || receipt.created_at
        };

        // 2. CHECK FOR PRINT STUDIO V2 TEMPLATE
        try {
            if (session.user.companyId && session.user.tenantId) {
                const activeV2 = await prisma.hms_print_template.findFirst({
                    where: {
                        company_id: session.user.companyId,
                        tenant_id: session.user.tenantId,
                        usage: 'pos_bill',
                        is_active: true,
                        is_default: true,
                    }
                });
                const cfg = activeV2?.config as any;
                if (cfg?.source === 'print_studio_v2' && cfg?.blocks && cfg?.theme) {
                    const html = generateV2HTML(cfg.blocks, cfg.theme, printData, companyData, autoPrint);
                    return new NextResponse(html, {
                        headers: {
                            'Content-Type': 'text/html; charset=utf-8',
                            'Cache-Control': 'no-store',
                        }
                    });
                }
            }
        } catch (v2err) {
            console.warn('[RECEIPT-PRINTER] V2 check failed, falling back to PDF:', v2err);
        }

        // 3. FALLBACK: Legacy PDF engine
        const pdfBase64 = await generateUniversalPDF(
            'purchase_receipt',
            printData,
            companyData,
            session.user.current_branch_id as string,
            autoPrint
        );
        
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${receipt.name}.pdf"`,
                'Cache-Control': 'no-cache'
            }
        });
    } catch (error: any) {
        console.error("[PRINTER-API] Error:", error);
        return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
