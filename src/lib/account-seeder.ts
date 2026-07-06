import { prisma } from "@/lib/prisma"
import crypto from 'crypto'

export async function ensureDefaultAccounts(companyId: string, tenantId: string) {
    // 1. Determine Tax Terminology based on Country
    const company = await prisma.company.findUnique({
        where: { id: companyId }
    });

    let country = null;
    if (company?.country_id) {
        country = await prisma.countries.findUnique({ where: { id: company.country_id } });
    }

    let taxLabel = "Tax";
    const countryName = country?.name?.toLowerCase() || '';

    if (countryName.includes('india') || countryName.includes('canada') || countryName.includes('australia')) {
        taxLabel = "GST";
    } else if (countryName.includes('united kingdom') || countryName.includes('uae') || countryName.includes('europe')) {
        taxLabel = "VAT";
    } else if (countryName.includes('usa') || countryName.includes('united states')) {
        taxLabel = "Sales Tax";
    }

    // 2. Fetch existing accounts to check what is missing
    const existingAccounts = await prisma.accounts.findMany({
        where: { company_id: companyId },
        select: { code: true }
    });
    const existingCodes = new Set(existingAccounts.map(a => a.code || ''));

    // 3. Define Standard COA Template (1000-9999 range)
    const templates = [
        // ASSETS (1000-1999)
        { code: '1000', name: 'Fixed Assets', type: 'Asset', isGroup: true },
        { code: '1010', name: 'Office Equipment', type: 'Asset', parentCode: '1000' },
        { code: '1020', name: 'Medical Equipment', type: 'Asset', parentCode: '1000' },
        { code: '1030', name: 'Furniture & Fixtures', type: 'Asset', parentCode: '1000' },

        { code: '1500', name: 'Current Assets', type: 'Asset', isGroup: true },
        { code: '1600', name: 'Cash on Hand', type: 'Asset', parentCode: '1500', isGroup: true },
        { code: '1610', name: 'Cash', type: 'Asset', parentCode: '1600' },
        { code: '1620', name: 'Petty Cash', type: 'Asset', parentCode: '1600' },

        { code: '1700', name: 'Bank Accounts', type: 'Asset', parentCode: '1500', isGroup: true },
        { code: '1710', name: 'Bank Account - Primary', type: 'Asset', parentCode: '1700' },
        { code: '1720', name: 'UPI Collection Account', type: 'Asset', parentCode: '1700' },
        { code: '1730', name: 'Card Settlement Account', type: 'Asset', parentCode: '1700' },

        { code: '1800', name: 'Sundry Debtors', type: 'Asset', parentCode: '1500', isGroup: true },
        { code: '1810', name: 'Accounts Receivable (Patients)', type: 'Asset', parentCode: '1800' },
        { code: '1820', name: 'Insurance Debtors', type: 'Asset', parentCode: '1800' },
        { code: '1830', name: 'Corporate Debtors', type: 'Asset', parentCode: '1800' },

        { code: '1900', name: 'Inventory / Stock-in-Hand', type: 'Asset', parentCode: '1500', isGroup: true },
        { code: '1910', name: 'Medicine Stock', type: 'Asset', parentCode: '1900' },
        { code: '1920', name: 'Consumables Stock', type: 'Asset', parentCode: '1900' },

        // LIABILITIES (2000-2999)
        { code: '2000', name: 'Current Liabilities', type: 'Liability', isGroup: true },
        { code: '2100', name: 'Sundry Creditors', type: 'Liability', parentCode: '2000', isGroup: true },
        { code: '2110', name: 'Accounts Payable (Vendors)', type: 'Liability', parentCode: '2100' },
        { code: '2120', name: 'Accrued Expenses', type: 'Liability', parentCode: '2000' },
        { code: '2200', name: `${taxLabel} Duties & Taxes`, type: 'Liability', parentCode: '2000', isGroup: true },
        { code: '2210', name: `Output ${taxLabel} (Collected)`, type: 'Liability', parentCode: '2200' },
        { code: '2220', name: `Input ${taxLabel} Credit (Paid)`, type: 'Asset', parentCode: '2200' },
        { code: '2300', name: 'Salaries Payable', type: 'Liability', parentCode: '2000' },

        // EQUITY (3000-3999)
        { code: '3000', name: 'Owner Capital / Equity', type: 'Equity', isGroup: true },
        { code: '3200', name: 'Retained Earnings', type: 'Equity', parentCode: '3000' },

        // REVENUE (4000-4999)
        { code: '4000', name: 'Direct Income (Revenue)', type: 'Revenue', isGroup: true },
        { code: '4010', name: 'Patient Consultation Fees', type: 'Revenue', parentCode: '4000' },
        { code: '4020', name: 'OP Income', type: 'Revenue', parentCode: '4000' },
        { code: '4030', name: 'Casualty Income', type: 'Revenue', parentCode: '4000' },
        { code: '4040', name: 'IP Income / Ward Charges', type: 'Revenue', parentCode: '4000' },
        { code: '4100', name: 'Lab Test Revenue', type: 'Revenue', parentCode: '4000' },
        { code: '4200', name: 'Pharmacy Sales', type: 'Revenue', parentCode: '4000' },
        { code: '4300', name: 'Procedure / Surgery Charges', type: 'Revenue', parentCode: '4000' },
        { code: '4900', name: 'Other Income', type: 'Revenue' },
        { code: '4950', name: 'Purchase Discounts Received', type: 'Revenue' },

        // EXPENSES (5000-8999)
        { code: '5000', name: 'Direct Expenses (COGS)', type: 'Expense', isGroup: true },
        { code: '5100', name: 'Cost of Goods Sold', type: 'Expense', parentCode: '5000' },
        { code: '5200', name: 'Inventory Shrinkage / Wastage', type: 'Expense', parentCode: '5000' },

        { code: '6000', name: 'Indirect Expenses (Admin)', type: 'Expense', isGroup: true },
        { code: '6010', name: 'Rent', type: 'Expense', parentCode: '6000' },
        { code: '6020', name: 'Utilities (Electricity/Water)', type: 'Expense', parentCode: '6000' },
        { code: '6030', name: 'Telephone & Internet', type: 'Expense', parentCode: '6000' },
        { code: '6040', name: 'Printing & Stationery', type: 'Expense', parentCode: '6000' },

        { code: '6600', name: 'Personnel Expenses', type: 'Expense', isGroup: true },
        { code: '6610', name: 'Staff Salaries', type: 'Expense', parentCode: '6600' },
        { code: '6620', name: 'Staff Welfare', type: 'Expense', parentCode: '6600' },

        // SUSPENSE (9000) — World Standard: Catches any unmapped transaction
        { code: '9000', name: 'Suspense Account', type: 'Asset' },
    ];

    const missing = templates.filter(t => !existingCodes.has(t.code));

    if (missing.length > 0) {
        await prisma.accounts.createMany({
            data: missing.map(acc => ({
                company_id: companyId,
                tenant_id: tenantId,
                code: acc.code,
                name: acc.name,
                type: acc.type,
                is_active: true,
                is_group: acc.isGroup || false,
                is_reconcilable: ['1200', '1210', '1220', '2001'].includes(acc.code)
            })),
            skipDuplicates: true
        });
    }

    // Always ensure parent-child links are established (even for existing accounts)
    const allAccounts = await prisma.accounts.findMany({
        where: { company_id: companyId }
    });
    const accountMap = new Map(allAccounts.map(a => [a.code, a.id]));

    for (const t of templates as any[]) {
        const childId = accountMap.get(t.code);
        if (!childId) continue;

        const updateData: any = {
            is_group: t.isGroup || false
        };

        if (t.parentCode) {
            const parentId = accountMap.get(t.parentCode);
            if (parentId) {
                updateData.parent_id = parentId;
            }
        }

        await prisma.accounts.update({
            where: { id: childId },
            data: updateData
        });
    }
    // 6. Ensure Company Accounting Settings exist and are linked to default accounts
    const settings = await prisma.company_accounting_settings.findUnique({
        where: { company_id: companyId }
    });

    const findId = (code: string) => accountMap.get(code);

    if (!settings) {
        // Find currency from company_settings if not passed
        const companySettings = await prisma.company_settings.findUnique({
            where: { company_id: companyId }
        });

        await prisma.company_accounting_settings.create({
            data: {
                tenant_id: tenantId,
                company_id: companyId,
                currency_id: companySettings?.currency_id || undefined,
                // AR: Use Patient AR account (1810) — the leaf account under Sundry Debtors
                ar_account_id: findId('1810') || findId('1800'),
                // AP: Use Accounts Payable Vendors (2110) — the leaf account under Sundry Creditors
                ap_account_id: findId('2110') || findId('2100'),
                // Sales Revenue
                sales_account_id: findId('4000'),
                // Purchase Expense
                purchase_account_id: findId('5100') || findId('5000'),
                // Output Tax (GST collected)
                output_tax_account_id: findId('2210'),
                // Input Tax (GST paid)
                input_tax_account_id: findId('2220'),
                // Inventory & COGS
                inventory_asset_account_id: findId('1900'),
                cogs_account_id: findId('5100'),
                fiscal_year_start: new Date(new Date().getFullYear(), 3, 1), // April 1st (Indian FY)
                fiscal_year_end: new Date(new Date().getFullYear() + 1, 2, 31), // March 31st
            }
        });
    }

    // 7. Auto-seed Payment Method Mapping (only if not already configured)
    const existingMapping = await prisma.hms_settings.findFirst({
        where: { company_id: companyId, key: 'payment_method_mapping' }
    });

    if (!existingMapping) {
        const cashId = accountMap.get('1610');
        const bankId = accountMap.get('1710');
        const upiId = accountMap.get('1720') || accountMap.get('1710');
        const cardId = accountMap.get('1730') || accountMap.get('1710');

        if (cashId || bankId) {
            await prisma.hms_settings.create({
                data: {
                    id: crypto.randomUUID(),
                    tenant_id: tenantId,
                    company_id: companyId,
                    key: 'payment_method_mapping',
                    value: {
                        cash: cashId || null,
                        upi: upiId || bankId || null,
                        card: cardId || bankId || null,
                        bank_transfer: bankId || null,
                        cheque: bankId || null,
                        neft: bankId || null,
                        rtgs: bankId || null,
                    },
                    scope: 'company',
                    version: 1,
                    is_active: true,
                }
            });
            console.log('[account-seeder] Auto-seeded payment method mapping.');
        }
    }
}
