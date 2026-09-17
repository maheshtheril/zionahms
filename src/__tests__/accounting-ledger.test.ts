import { describe, it, expect } from 'vitest';

/**
 * Pure Double-Entry Accounting tests:
 * Tests debit/credit balance invariance across invoicing and payments
 */

interface JournalLine {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
}

function createInvoiceJournal(
  invoiceNumber: string,
  subtotal: number,
  taxAmount: number,
  totalDiscount: number
): { lines: JournalLine[]; isBalanced: boolean; totalDebits: number; totalCredits: number } {
  const netReceivable = Number((subtotal + taxAmount - totalDiscount).toFixed(2));
  const lines: JournalLine[] = [
    // Debit Accounts Receivable (Asset increases)
    { account_code: '1200', account_name: 'Accounts Receivable', debit: netReceivable, credit: 0 },
    // Credit Sales Revenue (Income increases)
    { account_code: '4100', account_name: 'Medical Sales Revenue', debit: 0, credit: subtotal },
  ];

  if (taxAmount > 0) {
    // Credit Output Tax Payable (Liability increases)
    lines.push({ account_code: '2200', account_name: 'GST/Tax Payable', debit: 0, credit: taxAmount });
  }

  if (totalDiscount > 0) {
    // Debit Sales Discount (Expense/Contra-Revenue increases)
    lines.push({ account_code: '4190', account_name: 'Sales Discount Allowed', debit: totalDiscount, credit: 0 });
  }

  const totalDebits = Number(lines.reduce((s, l) => s + l.debit, 0).toFixed(2));
  const totalCredits = Number(lines.reduce((s, l) => s + l.credit, 0).toFixed(2));
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.005;

  return { lines, isBalanced, totalDebits, totalCredits };
}

function createPaymentJournal(
  paymentMethod: 'CASH' | 'BANK' | 'UPI',
  amount: number
): { lines: JournalLine[]; isBalanced: boolean } {
  const cashAccount = paymentMethod === 'CASH' ? '1010' : '1020';
  const cashAccountName = paymentMethod === 'CASH' ? 'Cash in Hand' : 'Bank Account';

  const lines: JournalLine[] = [
    // Debit Cash/Bank (Asset increases)
    { account_code: cashAccount, account_name: cashAccountName, debit: amount, credit: 0 },
    // Credit Accounts Receivable (Asset decreases)
    { account_code: '1200', account_name: 'Accounts Receivable', debit: 0, credit: amount }
  ];

  const totalDebits = Number(lines.reduce((s, l) => s + l.debit, 0).toFixed(2));
  const totalCredits = Number(lines.reduce((s, l) => s + l.credit, 0).toFixed(2));
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.005;

  return { lines, isBalanced };
}

describe('Double-Entry Accounting System', () => {
  it('enforces total debits equal total credits for standard sale', () => {
    const journal = createInvoiceJournal('INV-001', 5000, 900, 0);

    expect(journal.isBalanced).toBe(true);
    expect(journal.totalDebits).toBe(5900);
    expect(journal.totalCredits).toBe(5900);
  });

  it('enforces balance when sales discount is applied', () => {
    // Subtotal: 10,000, Tax: 1800, Discount: 500
    // Net Receivable: 11,300
    // Total Debits: 11,300 (AR) + 500 (Discount) = 11,800
    // Total Credits: 10,000 (Sales) + 1,800 (Tax) = 11,800
    const journal = createInvoiceJournal('INV-002', 10000, 1800, 500);

    expect(journal.isBalanced).toBe(true);
    expect(journal.totalDebits).toBe(11800);
    expect(journal.totalCredits).toBe(11800);
  });

  it('enforces balance on payment collection journal', () => {
    const journal = createPaymentJournal('BANK', 11300);

    expect(journal.isBalanced).toBe(true);
  });
});
