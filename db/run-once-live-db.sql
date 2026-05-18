-- ═══════════════════════════════════════════════════════════════════════════
-- DealMatch — One-Time Live DB Migration
-- Run this ONCE in Supabase SQL Editor on your live project
-- Safe to run — all statements use IF EXISTS / IF NOT EXISTS
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Remove referral columns from profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS referral_code,
  DROP COLUMN IF EXISTS referred_by,
  DROP COLUMN IF EXISTS referral_earnings;

-- 2. Drop referral indexes
DROP INDEX IF EXISTS idx_profiles_referral;
DROP INDEX IF EXISTS idx_profiles_referral_code;

-- 3. Drop referral tables
DROP TABLE IF EXISTS public.referrals CASCADE;

-- 4. Drop referral trigger and function
DROP TRIGGER IF EXISTS trg_handle_referral_signup ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_referral_signup();

-- 5. Rename commission → platform_fee in escrow_transactions (if not done yet)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='escrow_transactions' AND column_name='commission'
  ) THEN
    ALTER TABLE public.escrow_transactions RENAME COLUMN commission TO platform_fee;
  END IF;
END $$;

-- 6. Add verification_skipped column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_skipped boolean DEFAULT false;

-- 7. Add student to role CHECK constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('buyer','seller','renter','landlord','agent','investor','student','verifier','admin'));

-- 8. Add identity verification columns (safe if already exist)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_photo_url           text,
  ADD COLUMN IF NOT EXISTS identity_selfie_url          text,
  ADD COLUMN IF NOT EXISTS identity_doc_type            text,
  ADD COLUMN IF NOT EXISTS identity_verification_status text DEFAULT 'unverified'
    CHECK (identity_verification_status IN ('unverified','submitted','approved','rejected')),
  ADD COLUMN IF NOT EXISTS identity_verified_at         timestamptz,
  ADD COLUMN IF NOT EXISTS identity_rejection_note      text,
  ADD COLUMN IF NOT EXISTS identity_verified_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 9. Add index on identity_verification_status for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_identity_status
  ON public.profiles(identity_verification_status)
  WHERE identity_verification_status = 'submitted';

-- 10. Verify — show current profiles columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 11. Admin announcements table
CREATE TABLE IF NOT EXISTS public.admin_announcements (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  body        text NOT NULL,
  type        text DEFAULT 'info' CHECK (type IN ('info','warning','success','critical')),
  target      text DEFAULT 'all',
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;
-- Only admins can insert/read announcements
CREATE POLICY "Admins manage announcements" ON public.admin_announcements
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','agent','verifier'))
  );
-- Users can read announcements targeted at them
CREATE POLICY "Users read announcements" ON public.admin_announcements FOR SELECT
  USING (target = 'all' OR auth.uid() IS NOT NULL);

-- 12. Admin RLS policy on profiles (allows admins to read all profiles)
-- The API uses service role key which bypasses RLS, but this policy
-- also allows admin-role users to read profiles directly if needed
CREATE POLICY IF NOT EXISTS "Admins read all profiles" ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role IN ('admin', 'agent', 'verifier')
    )
  );

-- Drop the old single-user policy (replaced above)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Re-add the user self-read policy (the admin one above handles both)
CREATE POLICY IF NOT EXISTS "Users read own profile" ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles admin_check
      WHERE admin_check.id = auth.uid()
      AND admin_check.role IN ('admin', 'agent', 'verifier')
    )
  );

-- 13. Admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action       text NOT NULL,
  target_id    uuid,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata     jsonb DEFAULT '{}',
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.admin_audit_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','verifier'))
  );
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action  ON public.admin_audit_log(action);

-- ══════════════════════════════════════════════════════════════════════
-- CRITICAL FIX: Admin can see all profiles (run this if Users tab shows empty)
-- ══════════════════════════════════════════════════════════════════════

-- Step 1: Remove all old profile SELECT policies
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename='profiles' AND schemaname='public' AND cmd='SELECT'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
  END LOOP;
END $$;

-- Step 2: Single clean policy — own row OR admin role
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) IN ('admin', 'agent', 'verifier')
);

-- Step 3: Verify it's there
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public';
