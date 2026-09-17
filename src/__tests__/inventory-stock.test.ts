import { describe, it, expect } from 'vitest';

/**
 * Pure Inventory & Stock Ledger tests:
 * Tests FIFO allocation, expiry handling, and negative stock prevention
 */

interface StockBatch {
  id: string;
  batch_no: string;
  available_qty: number;
  expiry_date: Date;
  unit_cost: number;
}

interface AllocationResult {
  batchId: string;
  batchNo: string;
  allocatedQty: number;
  unitCost: number;
}

function allocateStockFIFO(
  batches: StockBatch[],
  requiredQty: number
): { success: boolean; allocations: AllocationResult[]; remainingShortfall: number; error?: string } {
  if (requiredQty <= 0) {
    return { success: false, allocations: [], remainingShortfall: 0, error: 'Required quantity must be greater than 0' };
  }

  const now = new Date();
  // Filter out expired batches and batches with 0 qty
  const validBatches = batches
    .filter(b => b.available_qty > 0 && b.expiry_date.getTime() > now.getTime())
    // Sort by expiry date ascending (FEFO / FIFO for pharmaceuticals)
    .sort((a, b) => a.expiry_date.getTime() - b.expiry_date.getTime());

  const totalAvailable = validBatches.reduce((sum, b) => sum + b.available_qty, 0);
  if (totalAvailable < requiredQty) {
    return {
      success: false,
      allocations: [],
      remainingShortfall: requiredQty - totalAvailable,
      error: `Insufficient stock. Required: ${requiredQty}, Available non-expired: ${totalAvailable}`
    };
  }

  const allocations: AllocationResult[] = [];
  let remaining = requiredQty;

  for (const batch of validBatches) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, batch.available_qty);
    allocations.push({
      batchId: batch.id,
      batchNo: batch.batch_no,
      allocatedQty: take,
      unitCost: batch.unit_cost
    });
    remaining -= take;
  }

  return {
    success: true,
    allocations,
    remainingShortfall: 0
  };
}

describe('Inventory & Stock Engine', () => {
  const futureDate1 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead
  const futureDate2 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead
  const expiredDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);  // 5 days ago

  it('allocates stock from single batch when sufficient', () => {
    const batches: StockBatch[] = [
      { id: 'b1', batch_no: 'BATCH-001', available_qty: 50, expiry_date: futureDate1, unit_cost: 10 }
    ];

    const result = allocateStockFIFO(batches, 20);
    expect(result.success).toBe(true);
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].allocatedQty).toBe(20);
    expect(result.allocations[0].batchNo).toBe('BATCH-001');
  });

  it('allocates stock across multiple batches in FEFO order (earliest expiry first)', () => {
    const batches: StockBatch[] = [
      { id: 'b2', batch_no: 'LATER-BATCH', available_qty: 100, expiry_date: futureDate2, unit_cost: 12 },
      { id: 'b1', batch_no: 'SOONER-BATCH', available_qty: 30, expiry_date: futureDate1, unit_cost: 10 }
    ];

    // Need 45 units -> Should take all 30 from SOONER-BATCH, then 15 from LATER-BATCH
    const result = allocateStockFIFO(batches, 45);
    expect(result.success).toBe(true);
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0].batchNo).toBe('SOONER-BATCH');
    expect(result.allocations[0].allocatedQty).toBe(30);
    expect(result.allocations[1].batchNo).toBe('LATER-BATCH');
    expect(result.allocations[1].allocatedQty).toBe(15);
  });

  it('rejects allocation when stock is insufficient and prevents negative balance', () => {
    const batches: StockBatch[] = [
      { id: 'b1', batch_no: 'BATCH-A', available_qty: 10, expiry_date: futureDate1, unit_cost: 5 }
    ];

    const result = allocateStockFIFO(batches, 25);
    expect(result.success).toBe(false);
    expect(result.remainingShortfall).toBe(15);
    expect(result.allocations).toHaveLength(0);
    expect(result.error).toContain('Insufficient stock');
  });

  it('strictly ignores expired batches even if they have stock', () => {
    const batches: StockBatch[] = [
      { id: 'b-exp', batch_no: 'EXPIRED-BATCH', available_qty: 500, expiry_date: expiredDate, unit_cost: 5 },
      { id: 'b-valid', batch_no: 'VALID-BATCH', available_qty: 10, expiry_date: futureDate1, unit_cost: 10 }
    ];

    // Request 15 units. Expired has 500 but should be ignored!
    const result = allocateStockFIFO(batches, 15);
    expect(result.success).toBe(false);
    expect(result.remainingShortfall).toBe(5); // Only 10 valid units available
  });
});
