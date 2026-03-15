-- ============================================
-- 02: PROFILES TABLE (linked to Supabase Auth)
-- Run this SECOND in Supabase SQL Editor
-- ============================================

-- Two roles: 'super_admin' (platform owner) and 'user' (driving school owner)
CREATE TYPE public.user_role AS ENUM ('super_admin', 'user');

CREATE TABLE IF NOT EXISTS public.profiles (
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

CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(org_id);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE ON USER CREATION
-- Super admin creates users via Supabase Auth Admin API.
-- org_id and role are passed via raw_user_meta_data.
-- ============================================
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
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
