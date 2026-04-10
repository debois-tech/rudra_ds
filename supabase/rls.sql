-- ============================================
-- MOTOADMIN: ROW LEVEL SECURITY POLICIES
-- Run this SECOND in Supabase SQL Editor
-- ============================================

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT org_id INTO v_org_id FROM public.profiles WHERE id = auth.uid();
    RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    ) INTO v_is_admin;
    RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS: ORGANIZATIONS
-- Super admins: full access to all orgs
-- Users: read-only access to their own org
-- ============================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_all_orgs" ON public.organizations;
CREATE POLICY "sa_all_orgs" ON public.organizations
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "user_read_own_org" ON public.organizations;
CREATE POLICY "user_read_own_org" ON public.organizations
    FOR SELECT USING (id = public.get_user_org_id());

-- ============================================
-- RLS: PROFILES
-- Super admins: full access to all profiles
-- Users: read/update own profile only
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_all_profiles" ON public.profiles;
CREATE POLICY "sa_all_profiles" ON public.profiles
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "user_read_own" ON public.profiles;
CREATE POLICY "user_read_own" ON public.profiles
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "user_update_own" ON public.profiles;
CREATE POLICY "user_update_own" ON public.profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ============================================
-- RLS: CUSTOMERS
-- Super admins: full access to all
-- Users: CRUD within their own org only
-- ============================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_all_customers" ON public.customers;
CREATE POLICY "sa_all_customers" ON public.customers
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "user_crud_customers" ON public.customers;
CREATE POLICY "user_crud_customers" ON public.customers
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: VEHICLES
-- Super admins: full access to all
-- Users: CRUD within their own org only
-- ============================================
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_all_vehicles" ON public.vehicles;
CREATE POLICY "sa_all_vehicles" ON public.vehicles
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "user_crud_vehicles" ON public.vehicles;
CREATE POLICY "user_crud_vehicles" ON public.vehicles
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: SERVICE TYPES
-- Super admins: full access
-- Users: read global types (org_id IS NULL) + own org types
-- ============================================
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_all_service_types" ON public.service_types;
CREATE POLICY "sa_all_service_types" ON public.service_types
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "user_read_types" ON public.service_types;
CREATE POLICY "user_read_types" ON public.service_types
    FOR SELECT
    USING (org_id IS NULL OR org_id = public.get_user_org_id());

-- ============================================
-- RLS: SERVICES
-- Super admins: full access to all
-- Users: CRUD within their own org only
-- ============================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_all_services" ON public.services;
CREATE POLICY "sa_all_services" ON public.services
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "user_crud_services" ON public.services;
CREATE POLICY "user_crud_services" ON public.services
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());
