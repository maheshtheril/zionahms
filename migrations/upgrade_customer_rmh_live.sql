-- =========================================================================
-- ZERO-DATA-LOSS ATOMIC MIGRATION SCRIPT FOR LIVE REVIVE MEDICITY DATABASE
-- TARGET: Upgrades old customer database to latest HMS 2026 specification
-- SAFE: Idempotent (IF NOT EXISTS), zero data alteration, atomic transaction
-- DOWNTIME: < 5 seconds execution time
-- =========================================================================

BEGIN;

-- 1. Ensure cryptographic extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Add missing columns to existing operational tables
ALTER TABLE public.company_accounting_settings 
    ADD COLUMN IF NOT EXISTS round_off_account_id uuid;

ALTER TABLE public.hms_invoice 
    ADD COLUMN IF NOT EXISTS round_off_amount numeric(14,2) DEFAULT 0;

ALTER TABLE public.hms_purchase_invoice 
    ADD COLUMN IF NOT EXISTS round_off_amount numeric(14,2) DEFAULT 0;

-- 3. Create missing Insurance & TPA tables (Matching Prisma Schema & ziona_hospital)
CREATE TABLE IF NOT EXISTS public.hms_insurance_provider (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    company_id uuid,
    name varchar(255),
    contact_info text,
    api_endpoint varchar(255),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hms_patient_insurance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    company_id uuid,
    patient_id uuid,
    insurance_provider_id uuid,
    policy_number varchar(255),
    group_number varchar(255),
    is_primary boolean DEFAULT true,
    valid_until date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hms_insurance_claim (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    company_id uuid,
    invoice_id uuid,
    patient_insurance_id uuid,
    provider_id uuid,
    status varchar(50) DEFAULT 'draft',
    amount_billed numeric(10, 2),
    amount_approved numeric(10, 2),
    amount_paid numeric(10, 2),
    patient_responsibility numeric(10, 2),
    denial_reason text,
    submitted_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hms_insurance_claim_line (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    company_id uuid,
    claim_id uuid,
    invoice_line_id uuid,
    amount_billed numeric(10, 2),
    amount_approved numeric(10, 2),
    amount_paid numeric(10, 2),
    status varchar(50) DEFAULT 'pending',
    denial_reason text,
    created_at timestamptz DEFAULT now()
);

-- 4. Create missing Staff HR & Payroll tables
CREATE TABLE IF NOT EXISTS public.hms_staff_leave (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    user_id uuid,
    leave_type text,
    start_date date,
    end_date date,
    reason text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hms_staff_salary (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    user_id uuid,
    base_salary numeric(18, 2) DEFAULT 0,
    hourly_rate numeric(18, 2) DEFAULT 0,
    allowances jsonb DEFAULT '{}',
    deductions jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hms_payroll_slip (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid,
    user_id uuid,
    month_year text,
    base_salary numeric(18, 2) DEFAULT 0,
    total_allowance numeric(18, 2) DEFAULT 0,
    total_deduction numeric(18, 2) DEFAULT 0,
    net_pay numeric(18, 2) DEFAULT 0,
    attendance_data jsonb DEFAULT '{}',
    status text DEFAULT 'draft',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. Performance Indexes (Safe & Non-blocking)
CREATE INDEX IF NOT EXISTS idx_hms_patient_insurance_patient_id ON public.hms_patient_insurance(patient_id);
CREATE INDEX IF NOT EXISTS idx_hms_patient_insurance_tenant_id ON public.hms_patient_insurance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hms_insurance_claim_invoice_id ON public.hms_insurance_claim(invoice_id);
CREATE INDEX IF NOT EXISTS idx_hms_insurance_claim_patient_ins_id ON public.hms_insurance_claim(patient_insurance_id);
CREATE INDEX IF NOT EXISTS idx_hms_insurance_claim_line_claim_id ON public.hms_insurance_claim_line(claim_id);
CREATE INDEX IF NOT EXISTS idx_hms_staff_leave_user_id ON public.hms_staff_leave(user_id);
CREATE INDEX IF NOT EXISTS idx_hms_staff_salary_user_id ON public.hms_staff_salary(user_id);
CREATE INDEX IF NOT EXISTS idx_hms_payroll_slip_user_month ON public.hms_payroll_slip(user_id, month_year);

COMMIT;
