-- ============================================
-- MOTOADMIN: SEED DATA
-- Run this FOURTH (last) in Supabase SQL Editor
-- ============================================

-- ============================================
-- DEFAULT SERVICE TYPES (global, visible to all orgs)
-- org_id = NULL = shared across all organizations
-- ============================================

-- Vehicle Services
INSERT INTO public.service_types (category, name) VALUES
    ('vehicle', 'Fitness'),
    ('vehicle', 'Tax'),
    ('vehicle', 'Insurance'),
    ('vehicle', 'PUC'),
    ('vehicle', 'Permit'),
    ('vehicle', 'Green Tax'),
    ('vehicle', 'P.TAX'),
    ('vehicle', 'HPTR'),
    ('vehicle', 'A.I.Permit'),
    ('vehicle', 'DRC'),
    ('vehicle', 'TO');

-- Licence Services
INSERT INTO public.service_types (category, name) VALUES
    ('licence', 'New Driving Licence'),
    ('licence', 'New Conductor Licence'),
    ('licence', 'Learning Licence'),
    ('licence', 'Duplicate Licence'),
    ('licence', 'Changes in Licence');

-- ============================================
-- INITIAL ORGANIZATION
-- Update name/slug/details as needed
-- ============================================
INSERT INTO public.organizations (name, slug, phone, email, address)
VALUES (
    'Rudra Driving School',
    'rudra-ds',
    '',
    '',
    ''
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SUPER ADMIN SETUP INSTRUCTIONS
-- ============================================
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create new user"
-- 3. Enter your email and a secure password
-- 4. In "User Metadata" (JSON), paste:
--    {"full_name": "Your Name", "role": "super_admin"}
-- 5. Click "Create User" — profile auto-created by trigger
-- 6. Run this UPDATE to confirm super_admin role:
--
-- UPDATE public.profiles
-- SET role = 'super_admin', org_id = NULL
-- WHERE email = 'YOUR_EMAIL_HERE';
