-- ============================================================================
-- SAFE & IDEMPOTENT CUSTOMER DATABASE UPDATE SCRIPT
-- Purpose:
--   1. Repair any legacy rows in hms_product where id is NULL (assigns a fresh UUID).
--   2. Enforce NOT NULL and DEFAULT gen_random_uuid() on hms_product.id so future rows are always valid.
--   3. Add Primary Key constraint on hms_product.id if not present.
--   4. Ensure default hospital stock locations exist in global_stock_location (safe, non-duplicate).
-- Safety Guarantee:
--   - ZERO DATA LOSS: No tables, columns, or rows are dropped.
--   - NON-DESTRUCTIVE: Existing live records, batches, stock, and relations are 100% preserved.
--   - IDEMPOTENT: Safe to run once or multiple times without error.
-- ============================================================================

BEGIN;

-- 1. Ensure pgcrypto extension exists for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Populate UUIDs for any legacy products that had a NULL id
UPDATE hms_product 
SET id = gen_random_uuid() 
WHERE id IS NULL;

-- 3. Set the default UUID generator for hms_product.id
ALTER TABLE hms_product 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Ensure id cannot be null
ALTER TABLE hms_product 
ALTER COLUMN id SET NOT NULL;

-- 5. Add primary key constraint on hms_product.id if not already existing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'hms_product'::regclass AND contype = 'p'
    ) THEN
        ALTER TABLE hms_product ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added primary key constraint hms_product_pkey.';
    ELSE
        RAISE NOTICE 'Primary key on hms_product already exists. Skipped.';
    END IF;
END $$;

-- 6. Provision standard hospital stores into global_stock_location for any company that has none
INSERT INTO global_stock_location (id, tenant_id, company_id, name, code, location_type, is_active, created_at)
SELECT 
    gen_random_uuid(),
    COALESCE(c.tenant_id, c.id),
    c.id,
    stores.name,
    stores.code,
    stores.location_type,
    true,
    NOW()
FROM company c
CROSS JOIN (
    VALUES 
        ('Pharmacy Main Store', 'PHARM-MAIN', 'internal'),
        ('Central Medical Store', 'CMS-01', 'internal'),
        ('OPD Pharmacy Dispensary', 'OPD-PHARM', 'dispensary'),
        ('IPD Pharmacy Store', 'IPD-PHARM', 'internal'),
        ('Emergency Crash Cart', 'EMERG-01', 'emergency'),
        ('OT Pharmacy Store', 'OT-PHARM', 'internal')
) AS stores(name, code, location_type)
WHERE NOT EXISTS (
    SELECT 1 
    FROM global_stock_location gsl 
    WHERE gsl.company_id = c.id
);

COMMIT;
