-- ============================================
-- DEMO REQUESTS TABLE
-- Stores contact/demo request form submissions
-- from the MotoAdmin landing page
-- ============================================

CREATE TABLE public.demo_requests (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name   TEXT NOT NULL,
    phone       VARCHAR(15) NOT NULL,
    school_name TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Allow public (anonymous) inserts from the landing page form
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on demo_requests"
    ON public.demo_requests
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Only super_admin can read submissions
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
