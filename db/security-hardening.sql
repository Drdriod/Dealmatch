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

-- 9. Deal Agreements: Prevent unauthorized access
DROP POLICY IF EXISTS "Buyers view own agreements" ON public.deal_agreements;
CREATE POLICY "Buyers view own agreements" ON public.deal_agreements 
FOR SELECT USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Auth users create agreements" ON public.deal_agreements;
CREATE POLICY "Auth users create agreements" ON public.deal_agreements 
FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- 10. Escrow Transactions: Strict ownership
DROP POLICY IF EXISTS "Users view own escrow" ON public.escrow_transactions;
CREATE POLICY "Users view own escrow" ON public.escrow_transactions 
FOR SELECT USING (auth.uid() = tenant_id);

-- 11. Mortgage Applications: Strict ownership
DROP POLICY IF EXISTS "Users manage own applications" ON public.mortgage_applications;
CREATE POLICY "Users manage own applications" ON public.mortgage_applications 
FOR ALL USING (auth.uid() = user_id);

-- 12. Messages: Strict participant access
DROP POLICY IF EXISTS "Users see own messages" ON public.messages;
CREATE POLICY "Users see own messages" ON public.messages 
FOR ALL USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- 13. Disputes: Strict ownership
DROP POLICY IF EXISTS "Users see own disputes" ON public.disputes;
CREATE POLICY "Users see own disputes" ON public.disputes 
FOR ALL USING (auth.uid() = reporter_id);

-- 14. Storage: Prevent directory traversal and unauthorized access
-- Ensure users can only upload to their own folder in 'avatars'
DROP POLICY IF EXISTS "Avatar user upload" ON storage.objects;
CREATE POLICY "Avatar user upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Avatar user update" ON storage.objects;
CREATE POLICY "Avatar user update" ON storage.objects 
FOR UPDATE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 15. Global: Disable public access to sensitive tables if not explicitly allowed
-- (Supabase tables are private by default if RLS is enabled and no policies exist)

-- 16. Security Audit Fixes (Added Apr 2026)
-- Ensure 'professional_requests' table exists to prevent the relation error
CREATE TABLE IF NOT EXISTS public.professional_requests (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  professional_id   text NOT NULL,
  professional_type text NOT NULL,
  professional_name text NOT NULL,
  client_name       text NOT NULL,
  client_phone      text NOT NULL,
  client_email      text,
  details           text,
  urgency           text DEFAULT 'normal' CHECK (urgency IN ('normal','soon','urgent')),
  status            text DEFAULT 'pending' CHECK (status IN ('pending','connected','completed','cancelled')),
  created_at        timestamptz DEFAULT now()
);

-- Enable RLS and secure the table
ALTER TABLE public.professional_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create requests" ON public.professional_requests;
CREATE POLICY "Authenticated users can request professionals" ON public.professional_requests 
FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users see own requests" ON public.professional_requests;
CREATE POLICY "Users see own requests" ON public.professional_requests 
FOR SELECT USING (auth.uid() = user_id);

-- 17. Storage: Secure property images
DROP POLICY IF EXISTS "Property img upload" ON storage.objects;
CREATE POLICY "Property img upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- 18. Final Schema Refresh
NOTIFY pgrst, 'reload schema';
