-- ============================================
-- MOTOADMIN: DATABASE VIEWS
-- Run this THIRD in Supabase SQL Editor
-- security_invoker = true ensures RLS applies
-- ============================================

-- ============================================
-- v_customer_dashboard
-- Customer list with vehicle + service counts
-- ============================================
CREATE OR REPLACE VIEW v_customer_dashboard
WITH (security_invoker = true)
AS
SELECT
    c.c_id,
    c.c_name,
    c.c_mobile,
    c.c_whatsapp,
    c.c_email,
    c.c_address,
    c.c_dob,
    c.c_registration_id,
    c.org_id,
    c.created_at,
    c.updated_at,
    COALESCE(v.vehicle_count, 0)::int AS vehicle_count,
    COALESCE(s.service_count, 0)::int AS service_count,
    COALESCE(s.total_revenue, 0)::numeric(10,2) AS total_revenue
FROM public.customers c
LEFT JOIN (
    SELECT owner_id, COUNT(*)::int AS vehicle_count
    FROM public.vehicles
    GROUP BY owner_id
) v ON v.owner_id = c.c_id
LEFT JOIN (
    SELECT customer_id,
           COUNT(*)::int AS service_count,
           SUM(total_cost) AS total_revenue
    FROM public.services
    GROUP BY customer_id
) s ON s.customer_id = c.c_id;

-- ============================================
-- v_services_overview
-- Service list with customer info + service type name
-- Used by the Service Overview page
-- ============================================
CREATE OR REPLACE VIEW v_services_overview
WITH (security_invoker = true)
AS
SELECT
    s.s_id,
    s.customer_id,
    s.service_type_id,
    s.category,
    s.vehicle_id,
    s.vehicle_type,
    s.vehicle_number,
    s.vehicle_class,
    s.vehicle_type_licence,
    s.mdl_number,
    s.renewal_date,
    s.issue_date,
    s.expiry_date,
    s.total_cost,
    s.status,
    s.notes,
    s.org_id,
    s.created_at,
    s.updated_at,
    st.name AS service_name,
    st.category AS service_category,
    c.c_name AS customer_name,
    c.c_mobile AS customer_mobile
FROM public.services s
JOIN public.service_types st ON st.st_id = s.service_type_id
JOIN public.customers c ON c.c_id = s.customer_id;
