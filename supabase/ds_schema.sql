-- ============================================
-- DRIVING SCHOOL: DATABASE SCHEMA
-- Run this FIRST in Supabase SQL Editor
-- ============================================

-- 1. ds_instructors
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

-- 2. ds_fleet_vehicles
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

-- 3. ds_driving_logs
CREATE TABLE public.ds_driving_logs (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    log_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    instructor_id   UUID NOT NULL REFERENCES public.ds_instructors(id),
    vehicle_id      UUID NOT NULL REFERENCES public.ds_fleet_vehicles(id),
    opted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    released_at     TIMESTAMPTZ,
    notes           TEXT,
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ds_driving_logs_org ON public.ds_driving_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_ds_driving_logs_org_date ON public.ds_driving_logs(org_id, log_date);
CREATE INDEX idx_ds_driving_logs_date ON public.ds_driving_logs(log_date);

CREATE TRIGGER set_ds_driving_logs_updated_at
    BEFORE UPDATE ON public.ds_driving_logs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. ds_students
CREATE TABLE public.ds_students (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name            TEXT NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    email           TEXT,
    address         TEXT,
    dob             DATE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    course_type     VARCHAR(50) DEFAULT 'LMV',
    total_fee       DECIMAL(10,2) NOT NULL DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'dropped')),
    notes           TEXT,
    customer_id     UUID REFERENCES public.customers(c_id),
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ds_students_org ON public.ds_students(org_id);
CREATE INDEX IF NOT EXISTS idx_ds_students_org_status ON public.ds_students(org_id, status);
CREATE INDEX idx_ds_students_status ON public.ds_students(status);

CREATE TRIGGER set_ds_students_updated_at
    BEFORE UPDATE ON public.ds_students
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. ds_fee_payments
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
CREATE INDEX IF NOT EXISTS idx_ds_fee_payments_org_date ON public.ds_fee_payments(org_id, payment_date);

-- 6. ds_attendance
CREATE TABLE public.ds_attendance (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    student_id      UUID NOT NULL REFERENCES public.ds_students(id) ON DELETE CASCADE,
    instructor_id   UUID NOT NULL REFERENCES public.ds_instructors(id),
    vehicle_id      UUID REFERENCES public.ds_fleet_vehicles(id),
    driving_log_id  UUID REFERENCES public.ds_driving_logs(id),
    notes           TEXT,
    org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, attendance_date)
);

CREATE INDEX idx_ds_attendance_org ON public.ds_attendance(org_id);
CREATE INDEX IF NOT EXISTS idx_ds_attendance_org_date ON public.ds_attendance(org_id, attendance_date);
CREATE INDEX idx_ds_attendance_date ON public.ds_attendance(attendance_date);

CREATE TRIGGER set_ds_attendance_updated_at
    BEFORE UPDATE ON public.ds_attendance
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
