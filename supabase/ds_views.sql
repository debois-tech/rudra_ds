-- ============================================
-- DRIVING SCHOOL: DATABASE VIEWS
-- Run this THIRD in Supabase SQL Editor
-- (after ds_schema.sql + ds_rls.sql)
-- security_invoker = true ensures RLS applies
-- ============================================

-- ============================================
-- v_ds_driving_logs
-- Logs joined with instructor name + vehicle number
-- ============================================
CREATE OR REPLACE VIEW public.v_ds_driving_logs
WITH (security_invoker = true)
AS
SELECT
    dl.id,
    dl.log_date,
    dl.instructor_id,
    i.name AS instructor_name,
    i.phone AS instructor_phone,
    dl.vehicle_id,
    fv.v_number AS vehicle_number,
    fv.v_name AS vehicle_name,
    dl.opted_at,
    dl.released_at,
    CASE WHEN dl.released_at IS NULL THEN 'in_use' ELSE 'completed' END AS status,
    dl.notes,
    dl.org_id,
    dl.created_at,
    dl.updated_at
FROM public.ds_driving_logs dl
JOIN public.ds_instructors i ON i.id = dl.instructor_id
JOIN public.ds_fleet_vehicles fv ON fv.id = dl.vehicle_id;

-- ============================================
-- v_ds_attendance
-- Attendance joined with student name, instructor name, vehicle number
-- ============================================
CREATE OR REPLACE VIEW public.v_ds_attendance
WITH (security_invoker = true)
AS
SELECT
    a.id,
    a.attendance_date,
    a.student_id,
    s.name AS student_name,
    s.phone AS student_phone,
    a.instructor_id,
    i.name AS instructor_name,
    a.vehicle_id,
    fv.v_number AS vehicle_number,
    dl.log_date AS driving_log_date,
    a.notes,
    a.org_id,
    a.created_at
FROM public.ds_attendance a
JOIN public.ds_students s ON s.id = a.student_id
JOIN public.ds_instructors i ON i.id = a.instructor_id
LEFT JOIN public.ds_fleet_vehicles fv ON fv.id = a.vehicle_id
LEFT JOIN public.ds_driving_logs dl ON dl.id = a.driving_log_id;

-- ============================================
-- v_ds_student_dashboard
-- Students with total paid, pending balance, attendance count
-- ============================================
CREATE OR REPLACE VIEW public.v_ds_student_dashboard
WITH (security_invoker = true)
AS
SELECT
    s.id,
    s.name,
    s.phone,
    s.email,
    s.address,
    s.dob,
    s.enrollment_date,
    s.course_type,
    s.total_fee,
    s.status,
    s.notes,
    s.customer_id,
    s.org_id,
    s.created_at,
    s.updated_at,
    COALESCE(fp.total_paid, 0)::numeric(10,2) AS total_paid,
    (s.total_fee - COALESCE(fp.total_paid, 0))::numeric(10,2) AS pending_balance,
    COALESCE(a.attendance_count, 0)::int AS attendance_count
FROM public.ds_students s
LEFT JOIN (
    SELECT student_id, SUM(amount)::numeric(10,2) AS total_paid
    FROM public.ds_fee_payments
    GROUP BY student_id
) fp ON fp.student_id = s.id
LEFT JOIN (
    SELECT student_id, COUNT(*)::int AS attendance_count
    FROM public.ds_attendance
    GROUP BY student_id
) a ON a.student_id = s.id;
