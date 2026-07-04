'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { differenceInDays } from 'date-fns';

export async function getStockAgeingData() {
    const session = await auth();
    const companyId = session?.user?.companyId || session?.user?.tenantId;
    if (!companyId) return { error: "Unauthorized" };

    try {
        const products = await prisma.hms_product.findMany({
            where: { company_id: companyId, is_active: true },
            select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                metadata: true,
                hms_product_category_rel: {
                    include: { hms_product_category: { select: { name: true } } }
                },
                hms_product_batch: {
                    where: { qty_on_hand: { gt: 0 } },
                    select: { id: true, qty_on_hand: true, created_at: true, cost: true, mrp: true }
                },
                hms_stock_levels: {
                    select: { quantity: true }
                },
                hms_stock_ledger: {
                    where: {
                        movement_type: { in: ['in', 'RECEIPT', 'hms_purchase_receipt', 'adjustment-in', 'OPENING', 'adjustment_in'] }
                    },
                    orderBy: { created_at: 'desc' },
                    select: { qty: true, created_at: true, unit_cost: true }
                }
            }
        });

        let totalValue = 0;
        let deadStockValue = 0;
        const bucketTotals = {
            '0-30': 0,
            '31-60': 0,
            '61-90': 0,
            '91-120': 0,
            '120+': 0
        };

        const detailedGrid = [];
        const now = new Date();

        for (const p of products) {
            let totalQty = 0;
            let productTotalValue = 0;
            const pBuckets = { 
                '0-30': { qty: 0, val: 0 }, 
                '31-60': { qty: 0, val: 0 }, 
                '61-90': { qty: 0, val: 0 }, 
                '91-120': { qty: 0, val: 0 }, 
                '120+': { qty: 0, val: 0 } 
            };

            const categoryName = p.hms_product_category_rel?.[0]?.hms_product_category?.name || 'Uncategorized';
            
            if (p.hms_product_batch && p.hms_product_batch.length > 0) {
                for (const b of p.hms_product_batch) {
                    const qty = Number(b.qty_on_hand);
                    if (qty <= 0) continue;
                    totalQty += qty;
                    
                    const unitPrice = Number(b.cost) || Number(p.price) || 0;
                    const val = qty * unitPrice;
                    productTotalValue += val;

                    const days = differenceInDays(now, new Date(b.created_at));
                    let bKey = '120+';
                    if (days <= 30) bKey = '0-30';
                    else if (days <= 60) bKey = '31-60';
                    else if (days <= 90) bKey = '61-90';
                    else if (days <= 120) bKey = '91-120';

                    pBuckets[bKey as keyof typeof pBuckets].qty += qty;
                    pBuckets[bKey as keyof typeof pBuckets].val += val;
                }
            } else {
                let currentQty = p.hms_stock_levels.reduce((sum, lvl) => sum + Number(lvl.quantity || 0), 0);
                totalQty = currentQty;
                const unitPrice = Number(p.price) || 0; 
                
                if (currentQty > 0) {
                    for (const ledger of p.hms_stock_ledger) {
                        if (currentQty <= 0) break;
                        const ledgerQty = Number(ledger.qty);
                        if (ledgerQty <= 0) continue;

                        const allocationQty = Math.min(ledgerQty, currentQty);
                        currentQty -= allocationQty;

                        const val = allocationQty * (Number(ledger.unit_cost) || unitPrice);
                        productTotalValue += val;

                        const days = differenceInDays(now, new Date(ledger.created_at));
                        let bKey = '120+';
                        if (days <= 30) bKey = '0-30';
                        else if (days <= 60) bKey = '31-60';
                        else if (days <= 90) bKey = '61-90';
                        else if (days <= 120) bKey = '91-120';

                        pBuckets[bKey as keyof typeof pBuckets].qty += allocationQty;
                        pBuckets[bKey as keyof typeof pBuckets].val += val;
                    }

                    if (currentQty > 0) {
                        const val = currentQty * unitPrice;
                        productTotalValue += val;
                        pBuckets['120+'].qty += currentQty;
                        pBuckets['120+'].val += val;
                    }
                }
            }

            if (totalQty > 0) {
                totalValue += productTotalValue;
                deadStockValue += pBuckets['91-120'].val + pBuckets['120+'].val;
                
                bucketTotals['0-30'] += pBuckets['0-30'].val;
                bucketTotals['31-60'] += pBuckets['31-60'].val;
                bucketTotals['61-90'] += pBuckets['61-90'].val;
                bucketTotals['91-120'] += pBuckets['91-120'].val;
                bucketTotals['120+'] += pBuckets['120+'].val;

                detailedGrid.push({
                    id: p.id,
                    name: p.name,
                    sku: p.sku || 'N/A',
                    category: categoryName,
                    totalQty,
                    totalValue: productTotalValue,
                    buckets: {
                        '0-30': pBuckets['0-30'].qty,
                        '31-60': pBuckets['31-60'].qty,
                        '61-90': pBuckets['61-90'].qty,
                        '91-120': pBuckets['91-120'].qty,
                        '120+': pBuckets['120+'].qty,
                    }
                });
            }
        }

        const riskPercentage = totalValue > 0 ? (deadStockValue / totalValue) * 100 : 0;

        return {
            success: true,
            data: {
                totalValue,
                deadStockValue,
                riskPercentage,
                bucketTotals,
                detailedGrid: detailedGrid.sort((a, b) => b.totalValue - a.totalValue)
            }
        };

    } catch (error: any) {
        console.error("Ageing Error:", error);
        return { error: "Failed to generate report" };
    }
}
