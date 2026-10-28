-- =========================================================================
-- ZIONA HEALTHCARE ERP - LIVE CUSTOMER DATABASE UPGRADE LEDGER
-- SAFE: Idempotent (IF NOT EXISTS), zero data alteration, zero downtime
-- INSTRUCTIONS: Run this file in pgAdmin 4 Query Tool against customer DB (e.g. hms_db)
-- =========================================================================

-- =========================================================================
-- PATCH #01
-- DATE & TIME : 2026-10-28 16:25:00 IST (28-OCT-2026)
-- MODULE      : Lab Management & Walk-in Guest Orders
-- DESCRIPTION : 
--   1. Ensures crypto extensions (uuid-ossp, pgcrypto)
--   2. Creates hms_lab_test, hms_lab_order, hms_lab_order_line if missing
--   3. Makes hms_lab_order.patient_id NULLABLE (for walk-in guests)
--   4. Adds metadata & report_url columns to hms_lab_order
--   5. Adds price, metadata, and company_id to hms_lab_order_line
--   6. Creates performance indexes
-- =========================================================================

BEGIN;

-- 1. Ensure required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Lab Tests catalog table if missing
CREATE TABLE IF NOT EXISTS public.hms_lab_test (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    company_id uuid,
    code text,
    loinc_code text,
    name text,
    method text,
    units text,
    reference_range jsonb DEFAULT '{}',
    group_id uuid,
    is_panel boolean DEFAULT false,
    metadata jsonb DEFAULT '{}',
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    price numeric(14, 2) DEFAULT 0
);

-- 3. Create Lab Orders table if missing
CREATE TABLE IF NOT EXISTS public.hms_lab_order (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    company_id uuid,
    order_number text,
    patient_id uuid,
    encounter_id uuid,
    ordered_by uuid,
    ordered_at timestamptz DEFAULT now(),
    status text DEFAULT 'requested',
    clinical_notes text,
    priority text DEFAULT 'routine',
    billing_code text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    report_url text
);

-- Make patient_id nullable (allows walk-in guests without registered patient profile)
ALTER TABLE public.hms_lab_order 
    ALTER COLUMN patient_id DROP NOT NULL;

-- Ensure missing columns exist in hms_lab_order
ALTER TABLE public.hms_lab_order 
    ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

ALTER TABLE public.hms_lab_order 
    ADD COLUMN IF NOT EXISTS report_url text;

-- 4. Create Lab Order Lines table if missing
CREATE TABLE IF NOT EXISTS public.hms_lab_order_line (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    company_id uuid,
    order_id uuid,
    test_id uuid,
    sample_id uuid,
    price numeric(14, 2) DEFAULT 0,
    status text DEFAULT 'requested',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- Ensure missing columns exist in hms_lab_order_line
ALTER TABLE public.hms_lab_order_line 
    ADD COLUMN IF NOT EXISTS price numeric(14, 2) DEFAULT 0;

ALTER TABLE public.hms_lab_order_line 
    ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

ALTER TABLE public.hms_lab_order_line 
    ADD COLUMN IF NOT EXISTS company_id uuid;

-- 5. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_hms_lab_order_tenant ON public.hms_lab_order(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hms_lab_order_patient ON public.hms_lab_order(patient_id);
CREATE INDEX IF NOT EXISTS idx_hms_lab_order_line_order ON public.hms_lab_order_line(order_id);
CREATE INDEX IF NOT EXISTS idx_hms_lab_order_line_test ON public.hms_lab_order_line(test_id);
CREATE INDEX IF NOT EXISTS idx_hms_lab_test_tenant ON public.hms_lab_test(tenant_id);

COMMIT;

-- =========================================================================
-- FUTURE PATCHES WILL BE APPENDED BELOW WITH NEW DATE & TIME HEADERS
-- =========================================================================
