-- ============================================
-- MOTOADMIN: COMPLETE DATABASE SCHEMA
-- Run this FIRST in Supabase SQL Editor
-- ============================================

-- ============================================
-- UTILITY: Auto-update updated_at column
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. ORGANIZATIONS (multi-tenant root)
-- Each row = one business/shop (tenant)
-- ============================================
CREATE TABLE public.organizations (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    phone       TEXT,
    email       TEXT,
    address     TEXT,
    logo_url    TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON public.organizations(slug);

CREATE TRIGGER set_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. PROFILES (linked to Supabase Auth)
-- Two roles: super_admin (platform), user (shop agent)
-- ============================================
CREATE TYPE public.user_role AS ENUM ('super_admin', 'user');

CREATE TABLE public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id      UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    role        public.user_role DEFAULT 'user' NOT NULL,
    full_name   TEXT,
    email       TEXT,
    avatar_url  TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_org ON public.profiles(org_id);

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile when Supabase auth user is created
-- org_id and role are passed via raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, org_id, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        (NEW.raw_user_meta_data->>'org_id')::UUID,
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. CUSTOMERS
-- ============================================
CREATE TABLE public.customers (
    c_id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    c_name              TEXT NOT NULL,
    c_mobile            VARCHAR(15) NOT NULL,
    c_whatsapp          VARCHAR(15),
    c_email             TEXT,
    c_address           TEXT,
    c_dob               DATE,
    c_registration_id   TEXT NOT NULL DEFAULT '',
    org_id              UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, c_registration_id)
);

CREATE INDEX idx_customers_org ON public.customers(org_id);

CREATE TRIGGER set_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-generate registration ID: SLUG-0001, SLUG-0002, ...
CREATE OR REPLACE FUNCTION public.generate_registration_id()
RETURNS TRIGGER AS $$
DECLARE
    org_slug TEXT;
    next_num INT;
BEGIN
    SELECT slug INTO org_slug FROM public.organizations WHERE id = NEW.org_id;
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(c_registration_id FROM '[0-9]+$') AS INT)
    ), 0) + 1 INTO next_num
    FROM public.customers WHERE org_id = NEW.org_id;
    NEW.c_registration_id := UPPER(org_slug) || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_customer_registration_id
    BEFORE INSERT ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.generate_registration_id();

-- ============================================
-- 4. VEHICLES (belong to customers)
-- ============================================
CREATE TABLE public.vehicles (
    v_id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id    UUID NOT NULL REFERENCES public.customers(c_id) ON DELETE CASCADE,
    v_number    VARCHAR(20) NOT NULL,
    v_name      TEXT,
    v_type      VARCHAR(50) DEFAULT 'car',
    org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, v_number)
);

CREATE INDEX idx_vehicles_org ON public.vehicles(org_id);
CREATE INDEX idx_vehicles_owner ON public.vehicles(owner_id);

CREATE TRIGGER set_vehicles_updated_at
    BEFORE UPDATE ON public.vehicles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. SERVICE TYPES (master list of services)
-- org_id = NULL means global/shared type
-- ============================================
CREATE TABLE public.service_types (
    st_id       SERIAL PRIMARY KEY,
    category    VARCHAR(20) NOT NULL CHECK (category IN ('vehicle', 'licence')),
    name        VARCHAR(100) NOT NULL,
    org_id      UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_service_types_category ON public.service_types(category);

-- ============================================
-- 6. SERVICES (core business table)
-- Each row = one service provided to a customer
-- ============================================
CREATE TABLE public.services (
    s_id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id     UUID NOT NULL REFERENCES public.customers(c_id) ON DELETE CASCADE,
    service_type_id INT NOT NULL REFERENCES public.service_types(st_id),
    category        VARCHAR(20) NOT NULL CHECK (category IN ('vehicle', 'licence')),

    -- Vehicle service fields (populated when category = 'vehicle')
    vehicle_id          UUID REFERENCES public.vehicles(v_id) ON DELETE SET NULL,
    vehicle_type        VARCHAR(50),
    vehicle_number      VARCHAR(20),

    -- Licence service fields (populated when category = 'licence')
    vehicle_class       VARCHAR(20),
    vehicle_type_licence VARCHAR(20),
    mdl_number          VARCHAR(50),
    renewal_date        DATE,

    -- Common fields
    issue_date      DATE NOT NULL,
    expiry_date     DATE,
    total_cost      DECIMAL(10,2) NOT NULL DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'cancelled')),
    notes           TEXT,

    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_services_org ON public.services(org_id);
CREATE INDEX idx_services_customer ON public.services(customer_id);
CREATE INDEX idx_services_category ON public.services(category);

CREATE TRIGGER set_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
