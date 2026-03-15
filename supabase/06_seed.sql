-- ============================================
-- 06: SEED INITIAL ORG + SUPER ADMIN SETUP
-- Run this LAST in Supabase SQL Editor
-- ============================================

-- Create the first organization (Rudra Driving School)
INSERT INTO public.organizations (name, slug, phone, email, address)
VALUES (
  'Rudra Driving School',
  'rudra-ds',
  '',
  '',
  ''
)
ON CONFLICT (slug) DO NOTHING;

-- Existing document_types with org_id = NULL will be
-- treated as global/shared types visible to all orgs.
-- This is the correct behavior for standard types
-- like DL, RC, Insurance, PUC, etc.


-- ============================================
-- SUPER ADMIN SETUP INSTRUCTIONS:
-- ============================================
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → choose "Create new user"
-- 3. Enter your email and a secure password
-- 4. In "User Metadata" (JSON), paste:
--    {"full_name": "Your Name", "role": "super_admin"}
-- 5. Click "Create User"
-- 6. The trigger will auto-create a profile row
-- 7. Then come back here and run ONLY this UPDATE:

-- UPDATE public.profiles
-- SET role = 'super_admin', org_id = NULL
-- WHERE email = 'YOUR_EMAIL_HERE';
