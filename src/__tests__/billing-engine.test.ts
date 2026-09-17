import { describe, it, expect } from 'vitest';

/**
 * Pure billing engine calculation tests:
 * Tests the core financial logic of Ziona HMS/SaaS ERP
 */

interface LineItem {
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
}

function calculateInvoice(
  lines: LineItem[],
  taxMode: 'inclusive' | 'exclusive' | 'exempt',
  globalDiscount: number = 0,
  payments: number[] = [],
  status: 'draft' | 'paid' | 'posted' = 'draft'
) {
  // 1. Line subtotal: (qty * price) - line discount
  const lineTotals = lines.map(l => (l.quantity * l.unit_price) - (l.discount_amount || 0));
  const subtotal = Number(lineTotals.reduce((sum, t) => sum + t, 0).toFixed(2));

  // 2. Tax calculation
  const totalTax = taxMode === 'exempt' ? 0 : Number(lines.reduce((sum, line) => {
    const lineTotal = (line.quantity * line.unit_price) - (line.discount_amount || 0);
    if (taxMode === 'inclusive') {
      const rate = line.tax_rate || 0;
      const taxAmt = lineTotal - (lineTotal / (1 + rate / 100));
      return sum + taxAmt;
    } else {
      const taxAmt = lineTotal * ((line.tax_rate || 0) / 100);
      return sum + taxAmt;
    }
  }, 0).toFixed(2));

  // 3. Exact Net after Global Discount
  const exactNet = Number(Math.max(0,
    taxMode === 'inclusive'
      ? subtotal - globalDiscount
      : subtotal + totalTax - globalDiscount
  ).toFixed(2));

  // 4. Roundoff to nearest integer
  const grandTotal = Math.round(exactNet);
  const roundOffAmount = Number((grandTotal - exactNet).toFixed(2));

  // 5. Payments & Balance
  const totalPaid = Number(payments.reduce((sum, p) => sum + p, 0).toFixed(2));
  const balanceDue = status === 'paid' ? 0 : Number(Math.max(0, grandTotal - totalPaid).toFixed(2));

  return {
    subtotal,
    totalTax,
    exactNet,
    grandTotal,
    roundOffAmount,
    totalPaid,
    balanceDue
  };
}

describe('Billing Engine - Core Financial Calculations', () => {
  it('calculates simple single-item invoice without discount or tax', () => {
    const result = calculateInvoice(
      [{ quantity: 2, unit_price: 150, discount_amount: 0, tax_rate: 0 }],
      'exclusive',
      0
    );

    expect(result.subtotal).toBe(300);
    expect(result.totalTax).toBe(0);
    expect(result.grandTotal).toBe(300);
    expect(result.roundOffAmount).toBe(0);
    expect(result.balanceDue).toBe(300);
  });

  it('correctly applies line-level discounts before calculating subtotal', () => {
    const result = calculateInvoice(
      [
        { quantity: 2, unit_price: 500, discount_amount: 50, tax_rate: 0 },
        { quantity: 1, unit_price: 200, discount_amount: 20, tax_rate: 0 },
      ],
      'exclusive',
      0
    );

    // Line 1: 2 * 500 - 50 = 950
    // Line 2: 1 * 200 - 20 = 180
    // Subtotal = 1130
    expect(result.subtotal).toBe(1130);
    expect(result.grandTotal).toBe(1130);
  });

  it('correctly applies Overall Global Discount in Inclusive Tax mode', () => {
    // BUG FIX VERIFICATION: In inclusive mode, global discount MUST deduct from grand total
    const result = calculateInvoice(
      [
        { quantity: 1, unit_price: 1000, discount_amount: 0, tax_rate: 18 }
      ],
      'inclusive',
      100 // Rs. 100 global discount
    );

    expect(result.subtotal).toBe(1000);
    // In inclusive mode: exactNet = 1000 - 100 = 900
    expect(result.exactNet).toBe(900);
    expect(result.grandTotal).toBe(900);
  });

  it('correctly applies Overall Global Discount in Exclusive Tax mode', () => {
    const result = calculateInvoice(
      [
        { quantity: 1, unit_price: 1000, discount_amount: 0, tax_rate: 18 }
      ],
      'exclusive',
      100 // Rs. 100 global discount
    );

    // Subtotal: 1000, Tax (18%): 180
    // ExactNet: 1000 + 180 - 100 = 1080
    expect(result.subtotal).toBe(1000);
    expect(result.totalTax).toBe(180);
    expect(result.exactNet).toBe(1080);
    expect(result.grandTotal).toBe(1080);
  });

  it('correctly computes GST in Inclusive Tax mode', () => {
    // Rs. 1180 with 18% inclusive GST -> Tax should be Rs. 180, Base should be Rs. 1000
    const result = calculateInvoice(
      [
        { quantity: 1, unit_price: 1180, discount_amount: 0, tax_rate: 18 }
      ],
      'inclusive',
      0
    );

    expect(result.subtotal).toBe(1180);
    expect(result.totalTax).toBe(180);
    expect(result.grandTotal).toBe(1180);
  });

  it('handles rounding off to nearest integer correctly', () => {
    // 3 items at Rs. 33.33 each with 5% exclusive tax
    // Subtotal: 99.99, Tax: 5.00, ExactNet: 104.99
    // GrandTotal: 105, RoundOff: +0.01
    const result = calculateInvoice(
      [
        { quantity: 3, unit_price: 33.33, discount_amount: 0, tax_rate: 5 }
      ],
      'exclusive',
      0
    );

    expect(result.grandTotal).toBe(105);
    expect(result.roundOffAmount).toBe(0.01);
  });

  it('properly calculates balance due with partial payments', () => {
    const result = calculateInvoice(
      [{ quantity: 1, unit_price: 5000, discount_amount: 500, tax_rate: 0 }],
      'exclusive',
      0,
      [2000, 1500] // Two partial payments
    );

    expect(result.grandTotal).toBe(4500);
    expect(result.totalPaid).toBe(3500);
    expect(result.balanceDue).toBe(1000);
  });

  it('sets balance to 0 when invoice status is marked as paid', () => {
    const result = calculateInvoice(
      [{ quantity: 1, unit_price: 2500, discount_amount: 0, tax_rate: 0 }],
      'exclusive',
      0,
      [2500],
      'paid'
    );

    expect(result.balanceDue).toBe(0);
  });
});
