'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getNextVoucherNumber } from "./billing"


export type POSCartItem = {
    productId: string  // May be "realProductId::batchId" composite key for cart uniqueness
    name: string
    quantity: number
    unitPrice: number
    taxRate: number
    taxAmount: number
    netAmount: number
    batchId: string   // Actual batch UUID (empty string if no batch)
    batchNo: string   // Batch number label
    uom?: string      // Unit of measure (can be overridden at POS)
}

export type POSCheckoutPayload = {
    patientId?: string
    items: POSCartItem[]
    subtotal: number
    totalTax: number
    totalDiscount: number
    total: number
    paymentMethod: string // cash, card, upi
}

/**
 * Extracts the real product UUID from a cart key.
 * Cart keys are either:
 *   - "uuid"           (no batch)
 *   - "uuid::batchUuid" (with batch)
 */
function extractProductId(cartKey: string): string {
    return cartKey.split('::')[0]
}

function isValidUUID(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

export async function processPOSCheckout(data: POSCheckoutPayload) {
    const session = await auth()
    if (!session?.user?.id || !session.user.tenantId || !session.user.companyId) {
        return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId
    const companyId = session.user.companyId

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Generate Invoice Number
            const invNoRes = await getNextVoucherNumber(new Date().toISOString(), tx)
            if (invNoRes.error) throw new Error(invNoRes.error)
            const invoiceNumber = invNoRes.data!

            // 2. Create Invoice
            const invoice = await tx.hms_invoice.create({
                data: {
                    tenant_id: tenantId,
                    company_id: companyId,
                    patient_id: data.patientId || null,
                    invoice_number: invoiceNumber,
                    invoice_no: invoiceNumber,
                    issued_at: new Date(),
                    invoice_date: new Date(),
                    subtotal: data.subtotal,
                    total_tax: data.totalTax,
                    total_discount: data.totalDiscount,
                    total: data.total,
                    total_paid: data.total, // Fully paid at POS
                    outstanding: 0,
                    outstanding_amount: 0,
                    status: 'paid', // POS is instant pay
                    created_by: session.user.id
                }
            })

            // 3. Create Invoice Lines (resolve real product_id from composite cart key)
            // batch info is stored in metadata since invoice_lines has no batch columns
            const lineItems = data.items.map((item, idx) => ({
                id: crypto.randomUUID(),
                tenant_id: tenantId,
                company_id: companyId,
                invoice_id: invoice.id,
                line_idx: idx,
                product_id: extractProductId(item.productId),
                description: item.name,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                tax_amount: item.taxAmount,
                net_amount: item.netAmount,
                subtotal: item.netAmount - item.taxAmount,
                metadata: {
                    batch_id: isValidUUID(item.batchId) ? item.batchId : null,
                    batch_no: item.batchNo || null,
                    uom: item.uom || null,
                    source: 'POS',
                }
            }))

            await tx.hms_invoice_lines.createMany({
                data: lineItems
            })

            // 4. Create Payment Record
            await tx.hms_invoice_payments.create({
                data: {
                    tenant_id: tenantId,
                    company_id: companyId,
                    invoice_id: invoice.id,
                    amount: data.total,
                    payment_date: new Date(),
                    payment_method: data.paymentMethod,
                    reference: `POS-${invoiceNumber}`,
                    created_by: session.user.id
                }
            })

            // 5. Deduct stock — batch-wise if batch is specified
            for (const item of data.items) {
                const realProductId = extractProductId(item.productId)
                const hasBatch = isValidUUID(item.batchId)

                if (hasBatch) {
                    // Deduct from specific batch qty_on_hand
                    await tx.hms_product_batch.updateMany({
                        where: { 
                            id: item.batchId,
                            product_id: realProductId,
                            tenant_id: tenantId,
                            company_id: companyId,
                        },
                        data: {
                            qty_on_hand: { decrement: item.quantity }
                        }
                    })
                }

                // Stock ledger entry (audit trail)
                await tx.hms_stock_ledger.create({
                    data: {
                        tenant_id: tenantId,
                        company_id: companyId,
                        product_id: realProductId,
                        batch_id: hasBatch ? item.batchId : null,
                        transaction_type: 'sales',
                        quantity: -item.quantity,
                        reference: `POS-${invoiceNumber}`,
                        created_by: session.user.id
                    }
                })
            }

            // 6. Insurance Claim Engine
            if (data.patientId) {
                const patientInsurance = await tx.hms_patient_insurance.findFirst({
                    where: { patient_id: data.patientId, is_primary: true }
                });

                if (patientInsurance) {
                    const claimId = crypto.randomUUID();
                    await tx.hms_insurance_claim.create({
                        data: {
                            id: claimId,
                            tenant_id: tenantId,
                            company_id: companyId,
                            invoice_id: invoice.id,
                            patient_insurance_id: patientInsurance.id,
                            provider_id: patientInsurance.insurance_provider_id,
                            status: 'draft',
                            amount_billed: data.total,
                            claim_lines: {
                                create: lineItems.map((l) => ({
                                    id: crypto.randomUUID(),
                                    tenant_id: tenantId,
                                    company_id: companyId,
                                    invoice_line_id: l.id,
                                    amount_billed: l.net_amount,
                                    status: 'pending'
                                }))
                            }
                        }
                    });
                }
            }

            return invoice
        })

        // [AUTOMATION] Fetch Dynamic Profile & Trigger Notifications
        try {
            const { getActivePOSPrintConfig } = await import('./print-settings');
            // const { NotificationService } = await import('@/lib/notification-service');
            
            const config = await getActivePOSPrintConfig();
            if (config?.automation) {
                if (config.automation.whatsappOnSave) {
                    // await NotificationService.sendInvoiceWhatsapp(result.id, tenantId).catch(console.error);
                }
                if (config.automation.emailOnSave) {
                    // await NotificationService.sendInvoiceEmail(result.id, tenantId).catch(console.error);
                }
            }

            // [ACCOUNTING INTEGRATION] Post POS Sale to General Ledger instantly
            const { AccountingService } = await import('@/lib/services/accounting');
            await AccountingService.postSalesInvoice(result.id, tenantId, companyId, session.user.id)
                .catch(err => console.error("POS Accounting Posting Error:", err));

        } catch (autoErr) {
            console.error("POS Automation failed (non-blocking):", autoErr);
        }

        revalidatePath('/hms/pharmacy/pos')
        return { success: true, invoiceId: result.id, invoiceNumber: result.invoice_number }
    } catch (e: any) {
        console.error("POS Checkout Error:", e)
        return { success: false, error: e.message }
    }
}
