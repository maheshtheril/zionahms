import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { POSClient } from "@/components/pharmacy/pos-client"
import { AccountingWarningBanner } from "@/components/accounting/accounting-warning-banner"

export const metadata = {
    title: 'POS Terminal | Pharmacy | Enterprise ERP'
}

export default async function POSPage() {
    const session = await auth()
    if (!session?.user?.tenantId || !session.user.companyId) {
        redirect("/login")
    }

    const tenantId = session.user.tenantId
    const companyId = session.user.companyId

    const taxes = await prisma.tax_rates.findMany({
        where: { is_active: true },
        select: { id: true, name: true, rate: true },
        orderBy: { rate: 'asc' }
    })
    const availableTaxes = taxes.map(t => ({
        id: t.id,
        name: t.name,
        rate: Number(t.rate) / 100
    }))

    // Load active products with batches + UOM conversions
    const products = await prisma.hms_product.findMany({
        where: { 
            tenant_id: tenantId,
            company_id: companyId,
            is_active: true
        },
        select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            uom: true,
            default_barcode: true,
            hms_product_category_rel: {
                include: {
                    hms_product_category: { 
                        select: { 
                            name: true,
                            tax_rates: { select: { rate: true } }
                        } 
                    }
                }
            },
            product_tax_rules: {
                where: { is_active: true },
                include: {
                    tax_rates: { select: { rate: true } }
                }
            },
            hms_product_batch: {
                where: { qty_on_hand: { gt: 0 } },
                select: {
                    id: true,
                    batch_no: true,
                    expiry_date: true,
                    qty_on_hand: true,
                    mrp: true,
                    sale_price: true,
                },
                orderBy: { expiry_date: 'asc' } // FEFO
            },
            // Per-product UOM conversions (from_uom -> to_uom with factor)
            hms_product_uom_conversion: {
                select: {
                    from_uom: true,
                    to_uom: true,
                    factor: true,
                }
            }
        },
        take: 500
    })

    const formattedProducts = products.map(p => {
        const baseUom   = p.uom || 'NOS'
        const basePrice = Number(p.price || 0)

        // Build uomOptions: always include the base UOM (factor=1)
        // then add all configured conversions
        const conversionUoms = p.hms_product_uom_conversion.map(c => ({
            uom:    c.to_uom,
            factor: Number(c.factor),
            price:  basePrice * Number(c.factor),
        }))

        const uomOptions = [
            { uom: baseUom, factor: 1, price: basePrice }, // base always first
            ...conversionUoms,
        ]

        // Resolve Tax Rate:
        // 1. Product-specific active tax rule
        // 2. Category default tax rule
        // 3. Fallback to 0
        let taxPercent = 0
        if (p.product_tax_rules?.length > 0 && p.product_tax_rules[0].tax_rates?.rate) {
            taxPercent = Number(p.product_tax_rules[0].tax_rates.rate)
        } else if (p.hms_product_category_rel?.[0]?.hms_product_category?.tax_rates?.rate) {
            taxPercent = Number(p.hms_product_category_rel[0].hms_product_category.tax_rates.rate)
        }
        const taxRateMultiplier = taxPercent / 100 // e.g. 5 -> 0.05

        return {
            id:       p.id,
            name:     p.name,
            sku:      p.sku,
            price:    basePrice,
            uom:      baseUom,
            barcode:  p.default_barcode,
            category: p.hms_product_category_rel?.[0]?.hms_product_category?.name || 'General',
            taxRate:  taxRateMultiplier,
            uomOptions,  // [{uom, factor, price}] — only what's configured for THIS product
            batches: p.hms_product_batch.map(b => ({
                id:          b.id,
                batchNo:     b.batch_no,
                expiryDate:  b.expiry_date ? b.expiry_date.toISOString() : null,
                qtyOnHand:   Number(b.qty_on_hand),
                mrp:         b.mrp         ? Number(b.mrp)         : null,
                salePrice:   b.sale_price  ? Number(b.sale_price)  : null,
            }))
        }
    })

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-zinc-950 overflow-hidden flex flex-col">
            <div className="shrink-0">
                <AccountingWarningBanner />
            </div>
            <POSClient products={formattedProducts} availableTaxes={availableTaxes} />
        </div>
    )
}
