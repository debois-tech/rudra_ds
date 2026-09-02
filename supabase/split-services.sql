-- Run after backing up public.services.
CREATE TABLE IF NOT EXISTS public.document_services (
  s_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES public.customers(c_id) ON DELETE CASCADE,
  service_type_id int NOT NULL REFERENCES public.service_types(st_id), vehicle_class varchar(20), vehicle_type_licence varchar(20),
  mdl_number varchar(50), issue_date date NOT NULL, expiry_date date, renewal_date date, total_cost numeric(10,2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')), notes text,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.vehicle_services (
  s_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid NOT NULL REFERENCES public.customers(c_id) ON DELETE CASCADE,
  service_type_id int NOT NULL REFERENCES public.service_types(st_id), vehicle_id uuid REFERENCES public.vehicles(v_id) ON DELETE SET NULL,
  vehicle_type varchar(50), vehicle_number varchar(20), issue_date date NOT NULL, expiry_date date, total_cost numeric(10,2) NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')), notes text,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_document_services_org ON public.document_services(org_id);
CREATE INDEX IF NOT EXISTS idx_document_services_customer ON public.document_services(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_services_org ON public.vehicle_services(org_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_services_customer ON public.vehicle_services(customer_id);
DROP TRIGGER IF EXISTS set_document_services_updated_at ON public.document_services;
CREATE TRIGGER set_document_services_updated_at BEFORE UPDATE ON public.document_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS set_vehicle_services_updated_at ON public.vehicle_services;
CREATE TRIGGER set_vehicle_services_updated_at BEFORE UPDATE ON public.vehicle_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DO $$ BEGIN
  IF to_regclass('public.services') IS NOT NULL THEN
    INSERT INTO public.document_services (s_id, customer_id, service_type_id, vehicle_class, vehicle_type_licence, mdl_number, issue_date, expiry_date, renewal_date, total_cost, status, notes, org_id, created_at, updated_at)
    SELECT s_id, customer_id, service_type_id, vehicle_class, vehicle_type_licence, mdl_number, issue_date, expiry_date, renewal_date, total_cost, status, notes, org_id, created_at, updated_at FROM public.services WHERE category = 'licence' ON CONFLICT (s_id) DO NOTHING;
    INSERT INTO public.vehicle_services (s_id, customer_id, service_type_id, vehicle_id, vehicle_type, vehicle_number, issue_date, expiry_date, total_cost, status, notes, org_id, created_at, updated_at)
    SELECT s_id, customer_id, service_type_id, vehicle_id, vehicle_type, vehicle_number, issue_date, expiry_date, total_cost, status, notes, org_id, created_at, updated_at FROM public.services WHERE category = 'vehicle' ON CONFLICT (s_id) DO NOTHING;
  END IF;
END $$;
ALTER TABLE public.ds_students ADD COLUMN IF NOT EXISTS completion_date date;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status') THEN CREATE TYPE public.student_status AS ENUM ('active', 'completed', 'dropped'); END IF; END $$;
ALTER TABLE public.ds_students DROP CONSTRAINT IF EXISTS ds_students_status_check;
DROP VIEW IF EXISTS public.v_ds_student_dashboard;
ALTER TABLE public.ds_students ALTER COLUMN status DROP DEFAULT;
DO $$ BEGIN
  IF (SELECT t.typname FROM pg_attribute a JOIN pg_type t ON t.oid = a.atttypid WHERE a.attrelid = 'public.ds_students'::regclass AND a.attname = 'status') <> 'student_status' THEN
    ALTER TABLE public.ds_students ALTER COLUMN status TYPE public.student_status USING status::text::public.student_status;
  END IF;
END $$;
ALTER TABLE public.ds_students ALTER COLUMN status SET DEFAULT 'active'::public.student_status;
CREATE OR REPLACE FUNCTION public.prevent_invalid_attendance() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF EXISTS (SELECT 1 FROM public.ds_students WHERE id = NEW.student_id AND (NEW.attendance_date < enrollment_date OR (completion_date IS NOT NULL AND NEW.attendance_date > completion_date))) THEN RAISE EXCEPTION 'Attendance date is outside the student course dates'; END IF; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS validate_student_attendance ON public.ds_attendance;
CREATE TRIGGER validate_student_attendance BEFORE INSERT OR UPDATE ON public.ds_attendance FOR EACH ROW EXECUTE FUNCTION public.prevent_invalid_attendance();
ALTER TABLE public.document_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_crud_document_services" ON public.document_services;
DROP POLICY IF EXISTS "user_crud_vehicle_services" ON public.vehicle_services;
DROP POLICY IF EXISTS "sa_all_document_services" ON public.document_services;
DROP POLICY IF EXISTS "sa_all_vehicle_services" ON public.vehicle_services;
CREATE POLICY "sa_all_document_services" ON public.document_services FOR ALL USING (public.is_super_admin());
CREATE POLICY "sa_all_vehicle_services" ON public.vehicle_services FOR ALL USING (public.is_super_admin());
CREATE POLICY "user_crud_document_services" ON public.document_services FOR ALL USING (org_id = public.get_user_org_id()) WITH CHECK (org_id = public.get_user_org_id());
CREATE POLICY "user_crud_vehicle_services" ON public.vehicle_services FOR ALL USING (org_id = public.get_user_org_id()) WITH CHECK (org_id = public.get_user_org_id());
DROP VIEW IF EXISTS public.v_customer_dashboard;
DROP VIEW IF EXISTS public.v_services_overview;
DROP VIEW IF EXISTS public.service_records;
CREATE VIEW public.service_records WITH (security_invoker = true) AS
SELECT s_id, customer_id, service_type_id, 'licence'::varchar(20) AS category, NULL::uuid AS vehicle_id, NULL::varchar(50) AS vehicle_type, NULL::varchar(20) AS vehicle_number, vehicle_class, vehicle_type_licence, mdl_number, renewal_date, issue_date, expiry_date, total_cost, status, notes, org_id, created_at, updated_at FROM public.document_services
UNION ALL
SELECT s_id, customer_id, service_type_id, 'vehicle'::varchar(20), vehicle_id, vehicle_type, vehicle_number, NULL::varchar(20), NULL::varchar(20), NULL::varchar(50), NULL::date, issue_date, expiry_date, total_cost, status, notes, org_id, created_at, updated_at FROM public.vehicle_services;
CREATE VIEW public.v_services_overview WITH (security_invoker = true) AS
SELECT s.*, st.name AS service_name, st.category AS service_category, c.c_name AS customer_name, c.c_mobile AS customer_mobile FROM public.service_records s JOIN public.service_types st ON st.st_id = s.service_type_id JOIN public.customers c ON c.c_id = s.customer_id;
DROP TABLE IF EXISTS public.services;
CREATE VIEW public.v_customer_dashboard WITH (security_invoker = true) AS
SELECT c.c_id, c.c_name, c.c_mobile, c.c_whatsapp, c.c_email, c.c_address, c.c_dob, c.c_registration_id, c.org_id, c.created_at, c.updated_at,
COALESCE(v.vehicle_count, 0)::int AS vehicle_count, COALESCE(s.service_count, 0)::int AS service_count, COALESCE(s.total_revenue, 0)::numeric(10,2) AS total_revenue
FROM public.customers c LEFT JOIN (SELECT owner_id, COUNT(*)::int AS vehicle_count FROM public.vehicles GROUP BY owner_id) v ON v.owner_id = c.c_id
LEFT JOIN (SELECT customer_id, COUNT(*)::int AS service_count, SUM(total_cost) AS total_revenue FROM public.service_records GROUP BY customer_id) s ON s.customer_id = c.c_id;
DROP VIEW IF EXISTS public.v_ds_student_dashboard;
CREATE VIEW public.v_ds_student_dashboard WITH (security_invoker = true) AS
SELECT s.id, s.name, s.phone, s.email, s.address, s.dob, s.enrollment_date, s.completion_date, s.course_type, s.total_fee, s.status, s.notes, s.customer_id, s.org_id, s.created_at, s.updated_at,
COALESCE(fp.total_paid, 0)::numeric(10,2) AS total_paid, (s.total_fee - COALESCE(fp.total_paid, 0))::numeric(10,2) AS pending_balance, COALESCE(a.attendance_count, 0)::int AS attendance_count
FROM public.ds_students s LEFT JOIN (SELECT student_id, SUM(amount)::numeric(10,2) AS total_paid FROM public.ds_fee_payments GROUP BY student_id) fp ON fp.student_id = s.id
LEFT JOIN (SELECT student_id, COUNT(*)::int AS attendance_count FROM public.ds_attendance GROUP BY student_id) a ON a.student_id = s.id;
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_org_id uuid) RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER AS $function$
DECLARE v_result json;
BEGIN
  SELECT json_build_object(
    'totalCustomers', (SELECT COUNT(*) FROM public.customers WHERE org_id = p_org_id),
    'totalVehicles', (SELECT COUNT(*) FROM public.vehicles WHERE org_id = p_org_id),
    'totalServices', (SELECT COUNT(*) FROM public.service_records WHERE org_id = p_org_id),
    'totalRevenue', (SELECT COALESCE(SUM(total_cost), 0) FROM public.service_records WHERE org_id = p_org_id),
    'serviceBreakdown', (SELECT json_agg(row_to_json(t)) FROM (SELECT category, COUNT(*) AS count FROM public.service_records WHERE org_id = p_org_id GROUP BY category) t),
    'statusBreakdown', (SELECT json_agg(row_to_json(t)) FROM (SELECT status, COUNT(*) AS count FROM public.service_records WHERE org_id = p_org_id GROUP BY status) t),
    'revenueByMonth', (SELECT json_agg(row_to_json(t) ORDER BY t.month_key) FROM (SELECT TO_CHAR(issue_date, 'Mon') AS month, TO_CHAR(issue_date, 'YYYY-MM') AS month_key, COALESCE(SUM(total_cost), 0) AS revenue FROM public.service_records WHERE org_id = p_org_id AND issue_date >= (CURRENT_DATE - INTERVAL '6 months') GROUP BY TO_CHAR(issue_date, 'Mon'), TO_CHAR(issue_date, 'YYYY-MM')) t)
  ) INTO v_result;
  RETURN v_result;
END;
$function$;
NOTIFY pgrst, 'reload schema';
