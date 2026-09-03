-- ============================================
-- RUDRA DS: COMPLETE DATABASE SCHEMA (consolidated)
-- Run this single file in the Supabase SQL Editor on a fresh project.
--
-- Consolidates what used to be 7 separate files (schema.sql, rls.sql,
-- views.sql, ds_schema.sql, ds_rls.sql, ds_views.sql, demo_requests.sql)
-- into one, cross-checked against the live production database on
-- 2026-08-23. `supabase/seed.sql` is still separate — run it after this
-- file, optionally, for demo data.
--
-- NOTE: as of 2026-08-23, `demo_requests` and the two RPC functions at
-- the bottom (get_dashboard_stats, get_ds_dashboard_stats) exist in this
-- file but were NOT yet applied to the live production DB — see fixes.md.
-- Everything else here matches production exactly.
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
CREATE INDEX idx_vehicles_org_owner ON public.vehicles(org_id, owner_id);

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
-- 6. SERVICES (separate document and vehicle tables)
-- ============================================
CREATE TYPE public.service_status AS ENUM ('active', 'completed', 'cancelled', 'expired');

CREATE TABLE public.document_services (
    s_id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id     UUID NOT NULL REFERENCES public.customers(c_id) ON DELETE CASCADE,
    service_type_id INT NOT NULL REFERENCES public.service_types(st_id),
    vehicle_class       VARCHAR(20),
    vehicle_type_licence VARCHAR(20),
    mdl_number          VARCHAR(50),
    renewal_date        DATE,

    -- Common fields
    issue_date      DATE NOT NULL,
    expiry_date     DATE,
    total_cost      DECIMAL(10,2) NOT NULL DEFAULT 0,
    status          public.service_status DEFAULT 'active',
    notes           TEXT,

    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.vehicle_services (
    s_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(c_id) ON DELETE CASCADE,
    service_type_id INT NOT NULL REFERENCES public.service_types(st_id),
    vehicle_id UUID REFERENCES public.vehicles(v_id) ON DELETE SET NULL,
    vehicle_type VARCHAR(50), vehicle_number VARCHAR(20), issue_date DATE NOT NULL, expiry_date DATE,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    status public.service_status DEFAULT 'active',
    notes TEXT, org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_document_services_org ON public.document_services(org_id);
CREATE INDEX idx_document_services_customer ON public.document_services(customer_id);
CREATE INDEX idx_vehicle_services_org ON public.vehicle_services(org_id);
CREATE INDEX idx_vehicle_services_customer ON public.vehicle_services(customer_id);

CREATE TRIGGER set_document_services_updated_at
    BEFORE UPDATE ON public.document_services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_vehicle_services_updated_at
    BEFORE UPDATE ON public.vehicle_services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE VIEW public.service_records WITH (security_invoker = true) AS
SELECT s_id, customer_id, service_type_id, 'licence'::varchar(20) AS category,
       NULL::uuid AS vehicle_id, NULL::varchar(50) AS vehicle_type, NULL::varchar(20) AS vehicle_number,
       vehicle_class, vehicle_type_licence, mdl_number, renewal_date, issue_date, expiry_date, total_cost, status, notes, org_id, created_at, updated_at
FROM public.document_services
UNION ALL
SELECT s_id, customer_id, service_type_id, 'vehicle'::varchar(20), vehicle_id, vehicle_type, vehicle_number,
       NULL::varchar(20), NULL::varchar(20), NULL::varchar(50), NULL::date, issue_date, expiry_date, total_cost, status, notes, org_id, created_at, updated_at
FROM public.vehicle_services;

-- ============================================
-- 7. DEMO REQUESTS
-- Public landing-page "Book a Demo" form submissions.
-- NOT YET APPLIED TO PRODUCTION as of 2026-08-23 — see fixes.md.
-- ============================================
CREATE TABLE public.demo_requests (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name   TEXT NOT NULL CHECK (length(full_name) < 200),
    phone       VARCHAR(15) NOT NULL,
    school_name TEXT NOT NULL CHECK (length(school_name) < 200),
    submitted_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 8. DS_INSTRUCTORS — Driving school instructors
-- ============================================
CREATE TABLE public.ds_instructors (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT NOT NULL,
    phone       VARCHAR(15) NOT NULL,
    licence_no  VARCHAR(50),
    photo_url   TEXT,
    is_active   BOOLEAN DEFAULT true,
    org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ds_instructors_org ON public.ds_instructors(org_id);

CREATE TRIGGER set_ds_instructors_updated_at
    BEFORE UPDATE ON public.ds_instructors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 9. DS_FLEET_VEHICLES — School-owned training vehicles
-- ============================================
CREATE TABLE public.ds_fleet_vehicles (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    v_number    VARCHAR(20) NOT NULL,
    v_name      TEXT,
    v_type      VARCHAR(50) DEFAULT 'car',
    is_active   BOOLEAN DEFAULT true,
    org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, v_number)
);

CREATE INDEX idx_ds_fleet_vehicles_org ON public.ds_fleet_vehicles(org_id);

CREATE TRIGGER set_ds_fleet_vehicles_updated_at
    BEFORE UPDATE ON public.ds_fleet_vehicles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 10. DS_DRIVING_LOGS — Daily instructor <-> car mapping
-- Column names (logging_date, start_datetime, end_datetime) match
-- production exactly. Production also currently has 5 unused
-- student_1_id..student_5_id FK columns with no app code referencing
-- them anywhere — deliberately excluded here, see fixes.md to drop them.
-- ============================================
CREATE TABLE public.ds_driving_logs (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    logging_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    instructor_id   UUID NOT NULL REFERENCES public.ds_instructors(id),
    vehicle_id      UUID NOT NULL REFERENCES public.ds_fleet_vehicles(id),
    start_datetime  TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_datetime    TIMESTAMPTZ,
    notes           TEXT,
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ds_driving_logs_org ON public.ds_driving_logs(org_id);
CREATE INDEX idx_ds_driving_logs_org_date ON public.ds_driving_logs(org_id, logging_date);
CREATE INDEX idx_ds_driving_logs_date ON public.ds_driving_logs(logging_date);

CREATE TRIGGER set_ds_driving_logs_updated_at
    BEFORE UPDATE ON public.ds_driving_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 11. DS_STUDENTS — Enrolled driving students
-- ============================================
CREATE TYPE public.student_status AS ENUM ('active', 'completed', 'dropped');
CREATE TABLE public.ds_students (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name            TEXT NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    email           TEXT,
    address         TEXT,
    dob             DATE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completion_date DATE,
    course_type     VARCHAR(50) DEFAULT 'LMV',
    total_fee       DECIMAL(10,2) NOT NULL DEFAULT 0,
    status          public.student_status DEFAULT 'active',
    notes           TEXT,
    customer_id     UUID REFERENCES public.customers(c_id),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ds_students_org ON public.ds_students(org_id);
CREATE INDEX idx_ds_students_org_status ON public.ds_students(org_id, status);
CREATE INDEX idx_ds_students_status ON public.ds_students(status);

CREATE TRIGGER set_ds_students_updated_at
    BEFORE UPDATE ON public.ds_students
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 12. DS_FEE_PAYMENTS — Fee payment records for students
-- ============================================
CREATE TABLE public.ds_fee_payments (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id    UUID NOT NULL REFERENCES public.ds_students(id) ON DELETE CASCADE,
    amount        DECIMAL(10,2) NOT NULL,
    payment_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode  VARCHAR(20) DEFAULT 'cash'
                  CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'card', 'other')),
    note          TEXT,
    org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ds_fee_payments_student ON public.ds_fee_payments(student_id);
CREATE INDEX idx_ds_fee_payments_org ON public.ds_fee_payments(org_id);
CREATE INDEX idx_ds_fee_payments_org_date ON public.ds_fee_payments(org_id, payment_date);

-- ============================================
-- 13. DS_ATTENDANCE — Student attendance records
-- instructor_id is NULLABLE — attendance can be marked without an instructor
-- ============================================
CREATE TABLE public.ds_attendance (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    student_id      UUID NOT NULL REFERENCES public.ds_students(id) ON DELETE CASCADE,
    instructor_id   UUID REFERENCES public.ds_instructors(id),
    vehicle_id      UUID REFERENCES public.ds_fleet_vehicles(id),
    driving_log_id  UUID REFERENCES public.ds_driving_logs(id),
    notes           TEXT,
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, attendance_date)
);

CREATE INDEX idx_ds_attendance_org ON public.ds_attendance(org_id);
CREATE INDEX idx_ds_attendance_org_date ON public.ds_attendance(org_id, attendance_date);
CREATE INDEX idx_ds_attendance_date ON public.ds_attendance(attendance_date);

CREATE OR REPLACE FUNCTION public.prevent_invalid_attendance() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.ds_students WHERE id = NEW.student_id AND (NEW.attendance_date < enrollment_date OR (completion_date IS NOT NULL AND NEW.attendance_date > completion_date))) THEN
        RAISE EXCEPTION 'Attendance date is outside the student course dates';
    END IF;
    RETURN NEW;
END; $$;
CREATE TRIGGER validate_student_attendance BEFORE INSERT OR UPDATE ON public.ds_attendance FOR EACH ROW EXECUTE FUNCTION public.prevent_invalid_attendance();

-- ============================================
-- RLS HELPER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT org_id INTO v_org_id FROM public.profiles WHERE id = auth.uid();
    RETURN v_org_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- RLS: ORGANIZATIONS
-- ============================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_all_orgs" ON public.organizations
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_read_own_org" ON public.organizations
    FOR SELECT USING (id = public.get_user_org_id());

-- ============================================
-- RLS: PROFILES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_all_profiles" ON public.profiles
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_read_own" ON public.profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "user_update_own" ON public.profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ============================================
-- RLS: CUSTOMERS
-- ============================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_all_customers" ON public.customers
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_crud_customers" ON public.customers
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: VEHICLES
-- ============================================
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_all_vehicles" ON public.vehicles
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_crud_vehicles" ON public.vehicles
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: SERVICE TYPES
-- ============================================
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_all_service_types" ON public.service_types
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_read_types" ON public.service_types
    FOR SELECT
    USING (org_id IS NULL OR org_id = public.get_user_org_id());

-- ============================================
-- RLS: SERVICES
-- ============================================
ALTER TABLE public.document_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_all_document_services" ON public.document_services
    FOR ALL USING (public.is_super_admin());
CREATE POLICY "user_crud_document_services" ON public.document_services
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());
CREATE POLICY "sa_all_vehicle_services" ON public.vehicle_services
    FOR ALL USING (public.is_super_admin());
CREATE POLICY "user_crud_vehicle_services" ON public.vehicle_services
    FOR ALL USING (org_id = public.get_user_org_id()) WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: DEMO_REQUESTS
-- Public (anonymous) insert from the landing page form; only
-- super_admin can read submissions.
-- ============================================
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on demo_requests"
    ON public.demo_requests
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow super_admin to read demo_requests"
    ON public.demo_requests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- ============================================
-- RLS: DS_INSTRUCTORS
-- ============================================
ALTER TABLE public.ds_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_all_ds_instructors" ON public.ds_instructors
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_crud_ds_instructors" ON public.ds_instructors
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: DS_FLEET_VEHICLES
-- ============================================
ALTER TABLE public.ds_fleet_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_all_ds_fleet_vehicles" ON public.ds_fleet_vehicles
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_crud_ds_fleet_vehicles" ON public.ds_fleet_vehicles
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: DS_DRIVING_LOGS
-- ============================================
ALTER TABLE public.ds_driving_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_all_ds_driving_logs" ON public.ds_driving_logs
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_crud_ds_driving_logs" ON public.ds_driving_logs
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: DS_STUDENTS
-- ============================================
ALTER TABLE public.ds_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_all_ds_students" ON public.ds_students
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_crud_ds_students" ON public.ds_students
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: DS_FEE_PAYMENTS
-- ============================================
ALTER TABLE public.ds_fee_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_all_ds_fee_payments" ON public.ds_fee_payments
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_crud_ds_fee_payments" ON public.ds_fee_payments
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- RLS: DS_ATTENDANCE
-- ============================================
ALTER TABLE public.ds_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sa_all_ds_attendance" ON public.ds_attendance
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_crud_ds_attendance" ON public.ds_attendance
    FOR ALL
    USING (org_id = public.get_user_org_id())
    WITH CHECK (org_id = public.get_user_org_id());

-- ============================================
-- VIEWS
-- security_invoker = true is CRITICAL for multi-tenancy: it ensures
-- RLS policies apply when users query views. Without it, ALL tenants'
-- data would be visible to everyone (this was the cause of a past
-- cross-tenant data leak — see git history).
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
    FROM public.service_records
    GROUP BY customer_id
) s ON s.customer_id = c.c_id;

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
FROM public.service_records s
JOIN public.service_types st ON st.st_id = s.service_type_id
JOIN public.customers c ON c.c_id = s.customer_id;

DROP VIEW IF EXISTS public.v_ds_driving_logs;
CREATE VIEW public.v_ds_driving_logs
WITH (security_invoker = true)
AS
SELECT
    dl.id,
    dl.logging_date,
    dl.instructor_id,
    i.name AS instructor_name,
    i.phone AS instructor_phone,
    dl.vehicle_id,
    fv.v_number AS vehicle_number,
    fv.v_name AS vehicle_name,
    dl.start_datetime,
    dl.end_datetime,
    CASE WHEN dl.end_datetime IS NULL THEN 'in_use' ELSE 'completed' END AS status,
    dl.notes,
    dl.org_id,
    dl.created_at,
    dl.updated_at
FROM public.ds_driving_logs dl
JOIN public.ds_instructors i ON i.id = dl.instructor_id
JOIN public.ds_fleet_vehicles fv ON fv.id = dl.vehicle_id;

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
    dl.logging_date AS driving_log_date,
    a.notes,
    a.org_id,
    a.created_at
FROM public.ds_attendance a
JOIN public.ds_students s ON s.id = a.student_id
LEFT JOIN public.ds_instructors i ON i.id = a.instructor_id
LEFT JOIN public.ds_fleet_vehicles fv ON fv.id = a.vehicle_id
LEFT JOIN public.ds_driving_logs dl ON dl.id = a.driving_log_id;

DROP VIEW IF EXISTS public.v_ds_student_dashboard;
CREATE VIEW public.v_ds_student_dashboard
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
    s.completion_date,
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

-- ============================================
-- DASHBOARD RPC FUNCTIONS
-- Both aggregate stats server-side in one round-trip instead of the
-- client fetching whole tables and reducing in JS. p_org_id is passed
-- explicitly rather than resolved via get_user_org_id() inside the
-- function so a single cached client-side org_id can be reused across
-- calls without re-deriving it per query.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_org_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
    v_result json;
BEGIN
    SELECT json_build_object(
        'totalCustomers', (SELECT COUNT(*) FROM customers WHERE org_id = p_org_id),
        'totalVehicles',  (SELECT COUNT(*) FROM vehicles WHERE org_id = p_org_id),
        'totalServices',  (SELECT COUNT(*) FROM service_records WHERE org_id = p_org_id),
        'totalRevenue',   (SELECT COALESCE(SUM(total_cost), 0) FROM service_records WHERE org_id = p_org_id),
        'serviceBreakdown', (
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT category, COUNT(*) as count
                FROM service_records
                WHERE org_id = p_org_id
                GROUP BY category
            ) t
        ),
        'statusBreakdown', (
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT status, COUNT(*) as count
                FROM service_records
                WHERE org_id = p_org_id
                GROUP BY status
            ) t
        ),
        'revenueByMonth', (
            -- No date floor here: the UI (month/6m/1y/all tabs) slices this client-side,
            -- so the RPC must return every month with data or the wider tabs are fake.
            SELECT json_agg(row_to_json(t) ORDER BY t.month_key)
            FROM (
                SELECT
                    TO_CHAR(issue_date, 'Mon YY') as month,
                    TO_CHAR(issue_date, 'YYYY-MM') as month_key,
                    COALESCE(SUM(total_cost), 0) as revenue
                FROM service_records
                WHERE org_id = p_org_id
                GROUP BY TO_CHAR(issue_date, 'YYYY-MM'), TO_CHAR(issue_date, 'Mon YY')
            ) t
        )
    ) INTO v_result;
    RETURN v_result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_ds_dashboard_stats(p_org_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
    v_today date := CURRENT_DATE;
    v_month_start date := DATE_TRUNC('month', CURRENT_DATE);
    v_result json;
BEGIN
    SELECT json_build_object(
        'activeLogsToday',        (SELECT COUNT(*) FROM ds_driving_logs WHERE org_id = p_org_id AND logging_date = v_today AND end_datetime IS NULL),
        'activeStudents',         (SELECT COUNT(*) FROM ds_students WHERE org_id = p_org_id AND status = 'active'),
        'feeCollectionThisMonth', (SELECT COALESCE(SUM(amount), 0) FROM ds_fee_payments WHERE org_id = p_org_id AND payment_date >= v_month_start),
        'pendingFeesTotal',       (SELECT GREATEST(0, COALESCE(SUM(total_fee),0) - COALESCE((SELECT SUM(amount) FROM ds_fee_payments WHERE org_id = p_org_id), 0)) FROM ds_students WHERE org_id = p_org_id)
    ) INTO v_result;
    RETURN v_result;
END;
$function$;
