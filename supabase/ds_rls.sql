-- ============================================
-- DRIVING SCHOOL: ROW LEVEL SECURITY POLICIES
-- Run this SECOND in Supabase SQL Editor
-- (after ds_schema.sql)
-- ============================================

-- ============================================
-- RLS: ds_instructors
-- ============================================
ALTER TABLE public.ds_instructors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_all_ds_instructors" ON public.ds_instructors;
CREATE POLICY "sa_all_ds_instructors" ON public.ds_instructors
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "user_crud_ds_instructors" ON public.ds_instructors;
CREATE POLICY "user_crud_ds_instructors" ON public.ds_instructors
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: ds_fleet_vehicles
-- ============================================
ALTER TABLE public.ds_fleet_vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_all_ds_fleet_vehicles" ON public.ds_fleet_vehicles;
CREATE POLICY "sa_all_ds_fleet_vehicles" ON public.ds_fleet_vehicles
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "user_crud_ds_fleet_vehicles" ON public.ds_fleet_vehicles;
CREATE POLICY "user_crud_ds_fleet_vehicles" ON public.ds_fleet_vehicles
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: ds_driving_logs
-- ============================================
ALTER TABLE public.ds_driving_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_all_ds_driving_logs" ON public.ds_driving_logs;
CREATE POLICY "sa_all_ds_driving_logs" ON public.ds_driving_logs
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "user_crud_ds_driving_logs" ON public.ds_driving_logs;
CREATE POLICY "user_crud_ds_driving_logs" ON public.ds_driving_logs
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: ds_students
-- ============================================
ALTER TABLE public.ds_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_all_ds_students" ON public.ds_students;
CREATE POLICY "sa_all_ds_students" ON public.ds_students
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "user_crud_ds_students" ON public.ds_students;
CREATE POLICY "user_crud_ds_students" ON public.ds_students
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: ds_fee_payments
-- ============================================
ALTER TABLE public.ds_fee_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_all_ds_fee_payments" ON public.ds_fee_payments;
CREATE POLICY "sa_all_ds_fee_payments" ON public.ds_fee_payments
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "user_crud_ds_fee_payments" ON public.ds_fee_payments;
CREATE POLICY "user_crud_ds_fee_payments" ON public.ds_fee_payments
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: ds_attendance
-- ============================================
ALTER TABLE public.ds_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sa_all_ds_attendance" ON public.ds_attendance;
CREATE POLICY "sa_all_ds_attendance" ON public.ds_attendance
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "user_crud_ds_attendance" ON public.ds_attendance;
CREATE POLICY "user_crud_ds_attendance" ON public.ds_attendance
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());
