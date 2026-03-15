-- ============================================
-- 03: ADD org_id TO EXISTING TABLES + CLEANUP
-- Run this THIRD in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Drop unused/duplicate tables
-- These exist in the DB but are NOT used in the app code
-- ============================================
DROP TABLE IF EXISTS public.notification_failures CASCADE;
DROP TABLE IF EXISTS public.notification_schedules CASCADE;
DROP TABLE IF EXISTS public.notification_settings CASCADE;
DROP TABLE IF EXISTS public.notifications_log CASCADE;

-- ============================================
-- STEP 2: Clean out test data (fresh start)
-- ============================================
DELETE FROM public.notification_logs;
DELETE FROM public.documents;
DELETE FROM public.vehicles;
DELETE FROM public.customers;
DELETE FROM public.app_settings;

-- ============================================
-- STEP 3: Add org_id to CUSTOMERS
-- Also fix c_registration_id to be unique per-org, not globally
-- ============================================
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Drop old global unique constraint on registration_id
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_c_registration_id_key;
-- Add per-org unique constraint
ALTER TABLE public.customers ADD CONSTRAINT customers_org_registration_unique
  UNIQUE (org_id, c_registration_id);

CREATE INDEX IF NOT EXISTS idx_customers_org_id ON public.customers(org_id);

-- ============================================
-- STEP 4: Add org_id to VEHICLES
-- Also fix v_number to be unique per-org, not globally
-- ============================================
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Drop old global unique constraint on v_number
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_v_number_key;
-- Add per-org unique constraint
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_org_vnumber_unique
  UNIQUE (org_id, v_number);

CREATE INDEX IF NOT EXISTS idx_vehicles_org_id ON public.vehicles(org_id);

-- ============================================
-- STEP 5: Add org_id to DOCUMENTS
-- ============================================
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_documents_org_id ON public.documents(org_id);

-- ============================================
-- STEP 6: Add org_id to DOCUMENT_TYPES
-- NULL org_id = shared/global type (visible to all orgs)
-- Set org_id = org's uuid for org-specific custom doc types
-- ============================================
ALTER TABLE public.document_types
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_document_types_org_id ON public.document_types(org_id);

-- ============================================
-- STEP 7: Add org_id to NOTIFICATION_LOGS
-- ============================================
ALTER TABLE public.notification_logs
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notification_logs_org_id ON public.notification_logs(org_id);

-- ============================================
-- STEP 8: Restructure APP_SETTINGS for multi-tenant
-- Currently PK is just 'key' (varchar).
-- For multi-tenant, each org has its own settings.
-- We need to drop old PK and add composite PK (key, org_id).
-- ============================================
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Drop old primary key (just 'key')
ALTER TABLE public.app_settings DROP CONSTRAINT IF EXISTS app_settings_pkey;

-- Add composite primary key (org can have its own set of settings)
ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key, org_id);

CREATE INDEX IF NOT EXISTS idx_app_settings_org_id ON public.app_settings(org_id);
