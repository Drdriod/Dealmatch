-- ============================================================
-- DealMatch: Security Hardening Patch
-- Run this in Supabase SQL Editor to tighten RLS policies
-- ============================================================

-- 1. Profiles: Prevent self-verification
-- Users should not be able to set their own verification flags
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  (
    -- Prevent users from changing these sensitive columns
    is_photo_verified = (SELECT is_photo_verified FROM public.profiles WHERE id = auth.uid()) AND
    is_live_verified = (SELECT is_live_verified FROM public.profiles WHERE id = auth.uid()) AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  )
);

-- 2. Properties: Prevent unauthorized status changes
-- Only the seller can update their property, but they shouldn't be able to set it to 'active' directly
-- if the system requires admin/agent review.
DROP POLICY IF EXISTS "Sellers manage own properties" ON public.properties;
CREATE POLICY "Sellers manage own properties" ON public.properties 
FOR ALL USING (auth.uid() = seller_id)
WITH CHECK (
  auth.uid() = seller_id AND
  (
    -- If status is being changed to active, ensure it's allowed or handled by admin
    -- For now, we allow sellers to manage everything EXCEPT setting status to 'active' 
    -- if it wasn't already active (simplified logic)
    (status <> 'active' OR (SELECT status FROM public.properties WHERE id = properties.id) = 'active')
  )
);

-- 3. Bookings: Require authentication
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Authenticated users can create bookings" ON public.bookings 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Professional Applications: Require authentication
DROP POLICY IF EXISTS "Public insert applications" ON public.professional_applications;
CREATE POLICY "Authenticated users can apply" ON public.professional_applications 
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- 5. Professional Requests: Require authentication
DROP POLICY IF EXISTS "Anyone can create requests" ON public.professional_requests;
CREATE POLICY "Authenticated users can request professionals" ON public.professional_requests 
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- 6. Payments: Scoped access
DROP POLICY IF EXISTS "Service role manages payments" ON public.payments;
-- In Supabase, the service_role bypasses RLS anyway. 
-- This policy was likely intended to be restrictive but was actually permissive.
-- We'll set it to only allow SELECT for the user who made the payment.
CREATE POLICY "Users can view own payments" ON public.payments 
FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 7. Crypto Payments: Require authentication
DROP POLICY IF EXISTS "Anyone can submit crypto" ON public.crypto_payments;
CREATE POLICY "Authenticated users can submit crypto" ON public.crypto_payments 
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- 8. Rental Enquiries: Require authentication
DROP POLICY IF EXISTS "Anyone can submit enquiry" ON public.rental_enquiries;
CREATE POLICY "Authenticated users can submit enquiry" ON public.rental_enquiries 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notify Supabase to refresh schema cache
NOTIFY pgrst, 'reload schema';
