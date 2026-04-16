-- ============================================================
-- Run this if you ALREADY have the profiles table and are
-- getting "column not found in schema cache" errors.
-- This safely adds missing columns without breaking existing data.
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS property_goal       text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_states    text[]    DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS property_types      text[]    DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS budget_min          numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS budget_max          numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS needs_financing     boolean   DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean  DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_photo_verified   boolean   DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_live_verified    boolean   DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS live_verified_at    timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code       text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by         text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_earnings   numeric   DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone               text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio                 text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state               text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city                text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role                text      DEFAULT 'buyer';

-- Add missing property columns
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS status            text      DEFAULT 'pending_review';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS verified_by       uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS verified_at       timestamptz;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS verification_note text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS latitude          numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS longitude         numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS max_guests        int;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS contact_phone     text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS contact_email     text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS payment_ref       text;

-- Create mortgage_applications if missing
CREATE TABLE IF NOT EXISTS public.mortgage_applications (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name        text NOT NULL,
  phone            text NOT NULL,
  email            text,
  monthly_income   numeric,
  employment_type  text DEFAULT 'employed',
  property_value   numeric,
  down_payment     numeric,
  loan_term_years  int DEFAULT 15,
  property_type    text,
  property_state   text,
  lender_id        text,
  status           text DEFAULT 'pending',
  notes            text,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE public.mortgage_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit mortgage app" ON public.mortgage_applications;
CREATE POLICY "Anyone can submit mortgage app" ON public.mortgage_applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users manage own applications"  ON public.mortgage_applications;
CREATE POLICY "Users manage own applications" ON public.mortgage_applications FOR ALL USING (auth.uid() = user_id);

-- Create rental_enquiries if missing
CREATE TABLE IF NOT EXISTS public.rental_enquiries (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id   uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  tenant_name   text NOT NULL,
  tenant_phone  text NOT NULL,
  tenant_email  text,
  move_in_date  date,
  duration      int DEFAULT 12,
  message       text,
  status        text DEFAULT 'pending',
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.rental_enquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit enquiry" ON public.rental_enquiries;
CREATE POLICY "Anyone can submit enquiry" ON public.rental_enquiries FOR INSERT WITH CHECK (true);

-- Notify Supabase to refresh schema cache
NOTIFY pgrst, 'reload schema';
