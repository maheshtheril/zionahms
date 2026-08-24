import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUniversalPDF, PDFUsage } from "@/lib/pdf/universal-engine";
import { getCurrentCompany } from "@/app/actions/company";
import { ensureAppointmentToken } from "@/app/actions/appointment";
import { getShiftSummary } from "@/app/actions/shift";
import { generateV2HTML } from "@/lib/pdf/v2-html-renderer";

export async function GET(
    req: NextRequest, 
    { params }: { params: Promise<{ type: string; id: string }> }
) {
    try {
        const { type, id } = await params;
        const session = await auth();
        if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

        const companyData = await getCurrentCompany();
        if (!companyData) return new NextResponse("Company configuration not found", { status: 404 });

        // 1. RESOLVE USAGE
        let usage: PDFUsage = 'sale_bill';
        if (type === 'prescription') usage = 'prescription';
        else if (type === 'appointment' || type === 'op_slip') usage = 'op_slip';
        else if (type === 'lab_report') usage = 'lab_report';
        else if (type === 'payment_voucher') usage = 'payment_voucher';
        else if (type === 'shift_close') usage = 'shift_close';
        else if (type === 'lab_catalog') usage = 'lab_catalog' as any;
        else if (type === 'pos_bill') usage = 'pos_bill' as any;

        // 2. FETCH COMPREHENSIVE DATA
        let data: any = null;
        if (usage === 'op_slip') {
            // [ELITE-GUARD] Auto-generate token if missing before printing
            const tokenRes = await ensureAppointmentToken(id);
            if (tokenRes.success) data = tokenRes.data;

            if (!data) {
                data = await prisma.hms_appointments.findFirst({ 
                    where: { id }, 
                    include: { hms_patient: true, hms_clinician: true } 
                });
            }
        } else if (usage === 'prescription') {
            data = await prisma.hms_appointments.findFirst({
                where: { id },
                include: { 
                    hms_patient: true, 
                    hms_clinician: true,
                    prescription: { include: { medicines: true } }
                }
            });
            // Flatten for engine
            if (data?.prescription?.[0]) {
                data.medicines = data.prescription[0].medicines;
            }
        } else if (usage === 'lab_report') {
            data = await prisma.hms_lab_order.findFirst({
                where: { id },
                include: {
                    hms_patient: true,
                    hms_lab_order_line: {
                        include: { 
                            hms_lab_test: true
                        }
                    },
                    hms_lab_order_lines: {
                        include: { 
                            hms_lab_test: true,
                            hms_lab_result: true
                        }
                    }
                }
            });

            if (data) {
                const allLines = [
                    ...(data.hms_lab_order_lines || []),
                    ...(data.hms_lab_order_line || [])
                ];
                
                // Filter out panels so they don't print as empty test rows
                data.hms_lab_order_lines = allLines.filter((line: any) => !line.hms_lab_test?.is_panel);
            }
        } else if (usage === 'sale_bill' || (usage as any) === 'pos_bill') {
            data = await prisma.hms_invoice.findFirst({ 
                where: { id }, 
                include: { 
                    hms_patient: true, 
                    hms_invoice_lines: { include: { hms_product: true } },
                    hms_appointment: {
                        include: { hms_clinician: true }
                    }
                }
            });
            // Total mapping for engine placeholders
            if (data) data.total_amount = Number(data.total || 0).toFixed(2);
        } else if (usage === 'payment_voucher') {
            data = await prisma.payments.findFirst({
                where: { id },
                include: {
                    payment_lines: true
                }
            });
            
            if (data) {
                // Map fields to match engine's expected sale_bill/voucher structure
                const metadata = data.metadata as any || {};
                const payee = metadata.payee_name || data.partner_id || 'Payee';
                data.hms_patient = { name: payee, first_name: payee }; // Map Payee to "Patient" field for header
                data.invoice_number = data.payment_number;
                data.total_amount = Number(data.amount || 0).toFixed(2);
                data.items = data.payment_lines; // Engine uses `items` if present
            }
        } else if (usage === 'shift_close') {
            const shiftRes = await getShiftSummary(id);
            if (shiftRes.success && shiftRes.shift && shiftRes.summary) {
                const shift = shiftRes.shift;
                
                // Fetch actual user name properly mapping Prisma schema fields
                let userName = "CASHIER / STAFF";
                try {
                    // Try to find in app_user using the raw uuid if it has a hyphen, or as is.
                    // If supabase auth is used, user name might be in metadata, but we'll try the fields we have
                    const userRecord = await prisma.app_user.findUnique({ where: { id: shift.user_id } });
                    if (userRecord) {
                        userName = userRecord.name || [userRecord.first_name, userRecord.last_name].filter(Boolean).join(" ") || userRecord.email?.split('@')[0] || "CASHIER / STAFF";
                    } else {
                        // Fallback to displaying the short ID if not found
                        userName = "STAFF-" + shift.user_id.split('-')[0].toUpperCase();
                    }
                } catch(e) {
                    console.error("Failed to fetch user name for shift close print:", e);
                    userName = "STAFF-" + shift.user_id.split('-')[0].toUpperCase();
                }

                const summary = shiftRes.summary;
                const ledger = shiftRes.ledger;
                
                // Calculate Dynamic Variance if not closed or if database value is 0 but there is a real difference
                const expectedCash = Number(shift.opening_balance) + summary.netCash;
                const actualCash = Number(shift.closing_balance || 0);
                const isClosed = !!shift.end_time;
                
                // If closed, use DB difference. If open, use dynamic calculation to show what the variance *would* be if they declared 0.
                let variance = isClosed && shift.difference ? Number(shift.difference) : (actualCash - expectedCash);
                
                // Ensure Variance is not NaN
                if (isNaN(variance)) variance = 0;

                data = {
                    ...shift,
                    hms_patient: { name: userName, first_name: userName },
                    invoice_number: shift.id.split('-')[0],
                    // World-Standard Z-Report Metrics passed explicitly
                    shift_summary: {
                        revenue: summary.totalRevenue,
                        pending: summary.pendingBillsTotal,
                        cashCollected: summary.cashCollected,
                        upi: summary.upi,
                        card: summary.card,
                        expectedCash: expectedCash,
                        actualCash: actualCash,
                        variance: variance,
                        startedAt: shift.start_time ? new Date(shift.start_time).toLocaleString() : 'N/A',
                        endedAt: isClosed ? new Date(shift.end_time).toLocaleString() : 'Active (Not Closed)'
                    },
                    // We will map the major totals as lines so they render nicely
                    items: [
                        // INBOUND (CREDIT) - Source of Funds
                        { category: { name: "OPENING FLOAT" }, amount: Number(shift.opening_balance).toFixed(2), type: 'INBOUND', memo: "Starting cash" },
                        // Only add actual collections and expenses to the balancing ledger. Pending is NOT cash!
                        ...(ledger || []).filter((l: any) => l.type !== 'PENDING').map((l: any) => ({
                            category: { name: `[${l.type}] ${l.category || l.method.toUpperCase()}` },
                            amount: l.amount,
                            type: l.type === 'IN' ? 'INBOUND' : 'OUTBOUND',
                            memo: `${l.description || 'N/A'}`
                        })),
                        
                        // OUTBOUND (DEBIT) - Application of Funds
                        { category: { name: "DIGITAL / BANK TRANSFER" }, amount: (summary.upi + summary.card + summary.other).toFixed(2), type: 'OUTBOUND', memo: "Auto-Deposited Non-Cash" },
                        { category: { name: "ACTUAL CLOSING FLOAT" }, amount: actualCash.toFixed(2), type: 'OUTBOUND', memo: "Declared Cash" },
                        
                        ...(variance < 0 
                            ? [{ category: { name: "CASH SHORTAGE (VARIANCE)" }, amount: Math.abs(variance).toFixed(2), type: 'OUTBOUND', memo: "Missing Cash" }]
                            : variance > 0 
                                ? [{ category: { name: "CASH SURPLUS (VARIANCE)" }, amount: variance.toFixed(2), type: 'INBOUND', memo: "Extra Cash" }]
                                : []
                        )
                    ],
                    total_amount: actualCash.toFixed(2)
                };
                data.expectedCash = expectedCash.toFixed(2);
                data.actualCash = actualCash.toFixed(2);
                data.variance = (actualCash - expectedCash).toFixed(2);
            }
        } else if (usage === 'lab_catalog') {
            const companyId = session.user.companyId;
            data = await prisma.hms_lab_test.findMany({
                where: { company_id: companyId },
                include: {
                    hms_lab_test_panel_member_hms_lab_test_panel_member_panel_idTohms_lab_test: {
                        include: {
                            hms_lab_test_hms_lab_test_panel_member_member_test_idTohms_lab_test: true
                        }
                    }
                },
                orderBy: { name: 'asc' }
            });
            // For lab_catalog, data is an array - never null, so skip the null check below
            if (data.length === 0) console.warn('[PRINT] lab_catalog: no tests found for companyId:', companyId);
        }

        if (!data) return new NextResponse("Document Data Not Found", { status: 404 });

        const autoPrint = req.nextUrl.searchParams.get('autoPrint') === 'true';
        const templateId = req.nextUrl.searchParams.get('templateId') || undefined;

        // 3. CHECK FOR PRINT STUDIO V2 TEMPLATE
        try {
            const session2 = await auth();
            if (session2?.user?.companyId && session2?.user?.tenantId) {
                const activeV2 = await prisma.hms_print_template.findFirst({
                    where: {
                        company_id: session2.user.companyId,
                        tenant_id: session2.user.tenantId,
                        usage,
                        is_active: true,
                        is_default: true,
                    }
                })
                const cfg = activeV2?.config as any
                if (cfg?.source === 'print_studio_v2' && cfg?.blocks && cfg?.theme) {
                    const html = generateV2HTML(cfg.blocks, cfg.theme, data, companyData, autoPrint)
                    return new NextResponse(html, {
                        headers: {
                            'Content-Type': 'text/html; charset=utf-8',
                            'Cache-Control': 'no-store',
                        }
                    })
                }
            }
        } catch (v2err) {
            console.warn('[PRINT] V2 template check failed, falling back to PDF engine:', v2err)
        }

        // 4. FALLBACK: GENERATE LEGACY PDF
        const pdfBase64 = await generateUniversalPDF(
            usage,
            data,
            companyData,
            data.branch_id || session.user.branchId as string,
            autoPrint,
            undefined, // configOverride
            templateId
        );

        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${usage}_${id}.pdf"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error: any) {
        console.error("[API_PRINT_FAIL]", error);
        return new NextResponse(`Print Engine Failure: ${error.message}`, { status: 500 });
    }
}
