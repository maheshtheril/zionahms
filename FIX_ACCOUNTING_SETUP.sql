-- ============================================================
-- ZIONA HEALTHCARE ERP - ACCOUNTING SETUP FIX
-- Run this on the customer's local PostgreSQL database (hms_db)
-- Safe to run multiple times - uses ON CONFLICT DO NOTHING
-- ============================================================

DO 
DECLARE
    v_company_id UUID;
    v_tenant_id  UUID := '41537389-7316-4a86-97a3-de21ff9833f7';
    v_acc        RECORD;

    -- Account IDs we'll need for settings
    id_1810 UUID; -- AR Patients
    id_2110 UUID; -- AP Vendors
    id_4000 UUID; -- Sales Revenue
    id_5100 UUID; -- COGS
    id_2210 UUID; -- Output GST
    id_2220 UUID; -- Input GST
    id_1900 UUID; -- Inventory
    id_1610 UUID; -- Cash
    id_1710 UUID; -- Bank
    id_1720 UUID; -- UPI
    id_1730 UUID; -- Card
BEGIN

    -- Step 1: Find company_id for this tenant
    SELECT id INTO v_company_id FROM company WHERE tenant_id = v_tenant_id LIMIT 1;
    IF v_company_id IS NULL THEN
        RAISE EXCEPTION 'Company not found for tenant %. Check tenant ID.', v_tenant_id;
    END IF;
    RAISE NOTICE 'Found company_id: %', v_company_id;

    -- Step 2: Insert all standard Chart of Accounts (skip if already exist)
    INSERT INTO accounts (id, company_id, tenant_id, code, name, type, is_active, is_group, is_reconcilable)
    VALUES
      -- ASSETS
      (gen_random_uuid(), v_company_id, v_tenant_id, '1000', 'Fixed Assets',                      'Asset',     true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1010', 'Office Equipment',                  'Asset',     true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1020', 'Medical Equipment',                 'Asset',     true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1030', 'Furniture & Fixtures',              'Asset',     true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1500', 'Current Assets',                    'Asset',     true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1600', 'Cash on Hand',                      'Asset',     true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1610', 'Cash',                              'Asset',     true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1620', 'Petty Cash',                        'Asset',     true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1700', 'Bank Accounts',                     'Asset',     true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1710', 'Bank Account - Primary',            'Asset',     true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1720', 'UPI Collection Account',            'Asset',     true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1730', 'Card Settlement Account',           'Asset',     true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1800', 'Sundry Debtors',                    'Asset',     true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1810', 'Accounts Receivable (Patients)',    'Asset',     true, false, true),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1820', 'Insurance Debtors',                 'Asset',     true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1830', 'Corporate Debtors',                 'Asset',     true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1900', 'Inventory / Stock-in-Hand',         'Asset',     true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1910', 'Medicine Stock',                    'Asset',     true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '1920', 'Consumables Stock',                 'Asset',     true, false, false),
      -- LIABILITIES
      (gen_random_uuid(), v_company_id, v_tenant_id, '2000', 'Current Liabilities',               'Liability', true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '2100', 'Sundry Creditors',                  'Liability', true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '2110', 'Accounts Payable (Vendors)',        'Liability', true, false, true),
      (gen_random_uuid(), v_company_id, v_tenant_id, '2120', 'Accrued Expenses',                  'Liability', true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '2200', 'GST Duties & Taxes',                'Liability', true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '2210', 'Output GST (Collected)',            'Liability', true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '2220', 'Input GST Credit (Paid)',           'Asset',     true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '2300', 'Salaries Payable',                  'Liability', true, false, false),
      -- EQUITY
      (gen_random_uuid(), v_company_id, v_tenant_id, '3000', 'Owner Capital / Equity',            'Equity',    true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '3200', 'Retained Earnings',                 'Equity',    true, false, false),
      -- REVENUE
      (gen_random_uuid(), v_company_id, v_tenant_id, '4000', 'Direct Income (Revenue)',           'Revenue',   true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '4010', 'Patient Consultation Fees',         'Revenue',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '4020', 'OP Income',                         'Revenue',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '4030', 'Casualty Income',                   'Revenue',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '4040', 'IP Income / Ward Charges',          'Revenue',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '4100', 'Lab Test Revenue',                  'Revenue',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '4200', 'Pharmacy Sales',                    'Revenue',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '4300', 'Procedure / Surgery Charges',       'Revenue',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '4900', 'Other Income',                      'Revenue',   true, false, false),
      -- EXPENSES
      (gen_random_uuid(), v_company_id, v_tenant_id, '5000', 'Direct Expenses (COGS)',            'Expense',   true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '5100', 'Cost of Goods Sold',                'Expense',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '5200', 'Inventory Shrinkage / Wastage',     'Expense',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '6000', 'Indirect Expenses (Admin)',         'Expense',   true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '6010', 'Rent',                              'Expense',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '6020', 'Utilities (Electricity/Water)',     'Expense',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '6030', 'Telephone & Internet',              'Expense',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '6040', 'Printing & Stationery',             'Expense',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '6600', 'Personnel Expenses',                'Expense',   true, true,  false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '6610', 'Staff Salaries',                    'Expense',   true, false, false),
      (gen_random_uuid(), v_company_id, v_tenant_id, '6620', 'Staff Welfare',                     'Expense',   true, false, false),
      -- SUSPENSE
      (gen_random_uuid(), v_company_id, v_tenant_id, '9000', 'Suspense Account',                  'Asset',     true, false, false)
    ON CONFLICT (company_id, code) DO NOTHING;

    RAISE NOTICE 'Chart of Accounts seeded successfully.';

    -- Step 3: Fetch the IDs we need for settings
    SELECT id INTO id_1810 FROM accounts WHERE company_id = v_company_id AND code = '1810';
    SELECT id INTO id_2110 FROM accounts WHERE company_id = v_company_id AND code = '2110';
    SELECT id INTO id_4000 FROM accounts WHERE company_id = v_company_id AND code = '4000';
    SELECT id INTO id_5100 FROM accounts WHERE company_id = v_company_id AND code = '5100';
    SELECT id INTO id_2210 FROM accounts WHERE company_id = v_company_id AND code = '2210';
    SELECT id INTO id_2220 FROM accounts WHERE company_id = v_company_id AND code = '2220';
    SELECT id INTO id_1900 FROM accounts WHERE company_id = v_company_id AND code = '1900';
    SELECT id INTO id_1610 FROM accounts WHERE company_id = v_company_id AND code = '1610';
    SELECT id INTO id_1710 FROM accounts WHERE company_id = v_company_id AND code = '1710';
    SELECT id INTO id_1720 FROM accounts WHERE company_id = v_company_id AND code = '1720';
    SELECT id INTO id_1730 FROM accounts WHERE company_id = v_company_id AND code = '1730';

    -- Step 4: Create or update company_accounting_settings
    INSERT INTO company_accounting_settings (
        id, tenant_id, company_id,
        ar_account_id, ap_account_id, sales_account_id, purchase_account_id,
        output_tax_account_id, input_tax_account_id,
        inventory_asset_account_id, cogs_account_id,
        fiscal_year_start, fiscal_year_end
    ) VALUES (
        gen_random_uuid(), v_tenant_id, v_company_id,
        id_1810, id_2110, id_4000, id_5100,
        id_2210, id_2220,
        id_1900, id_5100,
        DATE_TRUNC('year', NOW()) + INTERVAL '3 months',
        DATE_TRUNC('year', NOW()) + INTERVAL '15 months' - INTERVAL '1 day'
    )
    ON CONFLICT (company_id) DO UPDATE SET
        ar_account_id              = EXCLUDED.ar_account_id,
        ap_account_id              = EXCLUDED.ap_account_id,
        sales_account_id           = EXCLUDED.sales_account_id,
        purchase_account_id        = EXCLUDED.purchase_account_id,
        output_tax_account_id      = EXCLUDED.output_tax_account_id,
        input_tax_account_id       = EXCLUDED.input_tax_account_id,
        inventory_asset_account_id = EXCLUDED.inventory_asset_account_id,
        cogs_account_id            = EXCLUDED.cogs_account_id;

    RAISE NOTICE 'Company accounting settings configured successfully.';

    -- Step 5: Seed payment method mapping in hms_settings
    INSERT INTO hms_settings (id, tenant_id, company_id, key, value, scope, version, is_active)
    SELECT
        gen_random_uuid(), v_tenant_id, v_company_id,
        'payment_method_mapping',
        jsonb_build_object(
            'cash',         id_1610,
            'upi',          COALESCE(id_1720, id_1710),
            'card',         COALESCE(id_1730, id_1710),
            'bank_transfer',id_1710,
            'cheque',       id_1710,
            'neft',         id_1710,
            'rtgs',         id_1710
        ),
        'company', 1, true
    WHERE NOT EXISTS (
        SELECT 1 FROM hms_settings
        WHERE company_id = v_company_id AND key = 'payment_method_mapping'
    );

    RAISE NOTICE 'Payment method mapping seeded.';
    RAISE NOTICE '=== ALL DONE. Billing should now work correctly. ===';

END ;
