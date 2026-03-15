-- ============================================
-- 05: ROW LEVEL SECURITY POLICIES
-- Run this FIFTH in Supabase SQL Editor
-- ============================================

-- ============================================
-- HELPER FUNCTIONS (in public schema, not auth)
-- ============================================

-- Get current user's org_id from profiles
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================
-- ORGANIZATIONS
-- ============================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_orgs" ON public.organizations
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "users_read_own_org" ON public.organizations
  FOR SELECT USING (id = public.get_user_org_id());


-- ============================================
-- PROFILES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_profiles" ON public.profiles
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ============================================
-- CUSTOMERS
-- ============================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_customers" ON public.customers
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "users_crud_own_org_customers" ON public.customers
  FOR ALL USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());


-- ============================================
-- VEHICLES
-- ============================================
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_vehicles" ON public.vehicles
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "users_crud_own_org_vehicles" ON public.vehicles
  FOR ALL USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());


-- ============================================
-- DOCUMENTS
-- ============================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_documents" ON public.documents
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "users_crud_own_org_documents" ON public.documents
  FOR ALL USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());


-- ============================================
-- DOCUMENT_TYPES
-- ============================================
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_doc_types" ON public.document_types
  FOR ALL USING (public.is_super_admin());

-- Users can read shared types (org_id IS NULL) or their own org types
CREATE POLICY "users_read_doc_types" ON public.document_types
  FOR SELECT USING (org_id IS NULL OR org_id = public.get_user_org_id());

-- Users can only manage their own org's custom types
CREATE POLICY "users_manage_own_doc_types" ON public.document_types
  FOR INSERT WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "users_update_own_doc_types" ON public.document_types
  FOR UPDATE USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "users_delete_own_doc_types" ON public.document_types
  FOR DELETE USING (org_id = public.get_user_org_id());


-- ============================================
-- NOTIFICATION_LOGS
-- ============================================
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_notifications" ON public.notification_logs
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "users_crud_own_org_notifications" ON public.notification_logs
  FOR ALL USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());


-- ============================================
-- APP_SETTINGS
-- ============================================
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_settings" ON public.app_settings
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "users_crud_own_org_settings" ON public.app_settings
  FOR ALL USING (org_id = public.get_user_org_id())
  WITH CHECK (org_id = public.get_user_org_id());
