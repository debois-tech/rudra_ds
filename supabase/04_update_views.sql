-- ============================================
-- 04: RECREATE VIEWS WITH org_id + SECURITY INVOKER
-- Run this FOURTH in Supabase SQL Editor
-- IMPORTANT: security_invoker = true makes RLS apply to the view.
-- Without this, views run as the DB owner and bypass all RLS policies,
-- causing ALL organizations' data to be visible to every user.
-- ============================================

DROP VIEW IF EXISTS v_customer_dashboard;
DROP VIEW IF EXISTS v_documents_full;

-- ============================================
-- v_customer_dashboard
-- Customer list with vehicle/doc/expiry counts
-- Scoped to current user's org via RLS (security_invoker)
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
  COALESCE(pd.personal_doc_count, 0)::int AS personal_doc_count,
  COALESCE(vd.vehicle_doc_count, 0)::int AS vehicle_doc_count,
  COALESCE(e.expiring_soon_count, 0)::int AS expiring_soon_count
FROM public.customers c
LEFT JOIN (
  -- Only count vehicles in the same org as the customer
  SELECT owner_id, org_id, COUNT(*)::int AS vehicle_count
  FROM public.vehicles
  GROUP BY owner_id, org_id
) v ON v.owner_id = c.c_id AND v.org_id = c.org_id
LEFT JOIN (
  -- Only count customer documents in the same org
  SELECT entity_id, org_id, COUNT(*)::int AS personal_doc_count
  FROM public.documents
  WHERE entity_type = 'customer'
  GROUP BY entity_id, org_id
) pd ON pd.entity_id = c.c_id AND pd.org_id = c.org_id
LEFT JOIN (
  -- Only count vehicle documents in the same org
  SELECT vh.owner_id, d.org_id, COUNT(*)::int AS vehicle_doc_count
  FROM public.documents d
  JOIN public.vehicles vh ON vh.v_id = d.entity_id
  WHERE d.entity_type = 'vehicle'
  GROUP BY vh.owner_id, d.org_id
) vd ON vd.owner_id = c.c_id AND vd.org_id = c.org_id
LEFT JOIN (
  SELECT
    CASE
      WHEN d.entity_type = 'customer' THEN d.entity_id
      WHEN d.entity_type = 'vehicle' THEN vh.owner_id
    END AS customer_id,
    d.org_id,
    COUNT(*)::int AS expiring_soon_count
  FROM public.documents d
  LEFT JOIN public.vehicles vh ON d.entity_type = 'vehicle' AND vh.v_id = d.entity_id
  WHERE d.exp_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  GROUP BY 1, d.org_id
) e ON e.customer_id = c.c_id AND e.org_id = c.org_id;

-- ============================================
-- v_documents_full
-- Document details with status, owner info
-- Scoped to current user's org via RLS (security_invoker)
-- ============================================
CREATE OR REPLACE VIEW v_documents_full
WITH (security_invoker = true)
AS
SELECT
  d.doc_id,
  d.doc_type_id,
  dt.doc_type_name,
  d.entity_type,
  d.entity_id,
  d.doc_number,
  d.issue_date,
  d.exp_date,
  d.org_id,
  (d.exp_date - CURRENT_DATE) AS days_left,
  CASE
    WHEN (d.exp_date - CURRENT_DATE) < 0 THEN 'expired'
    WHEN (d.exp_date - CURRENT_DATE) <= 7 THEN 'critical'
    WHEN (d.exp_date - CURRENT_DATE) <= 30 THEN 'warning'
    ELSE 'valid'
  END AS status,
  CASE
    WHEN d.entity_type = 'customer' THEN d.entity_id
    WHEN d.entity_type = 'vehicle' THEN v.owner_id
  END AS customer_id,
  CASE
    WHEN d.entity_type = 'customer' THEN c_direct.c_name
    WHEN d.entity_type = 'vehicle' THEN c_via_v.c_name
  END AS customer_name,
  CASE
    WHEN d.entity_type = 'customer' THEN c_direct.c_mobile
    WHEN d.entity_type = 'vehicle' THEN c_via_v.c_mobile
  END AS customer_mobile,
  CASE
    WHEN d.entity_type = 'customer' THEN c_direct.c_whatsapp
    WHEN d.entity_type = 'vehicle' THEN c_via_v.c_whatsapp
  END AS customer_whatsapp,
  v.v_number AS vehicle_number,
  v.v_name AS vehicle_name
FROM public.documents d
JOIN public.document_types dt ON dt.doc_type_id = d.doc_type_id
LEFT JOIN public.vehicles v ON d.entity_type = 'vehicle' AND v.v_id = d.entity_id
LEFT JOIN public.customers c_direct ON d.entity_type = 'customer' AND c_direct.c_id = d.entity_id
LEFT JOIN public.customers c_via_v ON d.entity_type = 'vehicle' AND c_via_v.c_id = v.owner_id;
