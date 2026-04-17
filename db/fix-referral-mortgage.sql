-- ─── Bank Details for Referral Withdrawal ──────────────────
-- Adding bank details columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS account_name text,
ADD COLUMN IF NOT EXISTS routing_number text;

-- ─── Mortgage Workflow Enhancements ─────────────────────────
-- Add ticket_id and improve status for mortgage applications
-- First, ensure the status check constraint is updated
ALTER TABLE public.mortgage_applications DROP CONSTRAINT IF EXISTS mortgage_applications_status_check;
ALTER TABLE public.mortgage_applications 
ADD CONSTRAINT mortgage_applications_status_check 
CHECK (status IN ('pending', 'processing', 'reviewing', 'approved', 'declined', 'finished', 'on_hold'));

-- Add ticket_id column (short human-readable ID)
ALTER TABLE public.mortgage_applications 
ADD COLUMN IF NOT EXISTS ticket_id text UNIQUE;

-- Function to generate a unique ticket ID (e.g., MTG-XXXXXX)
CREATE OR REPLACE FUNCTION generate_mortgage_ticket_id() 
RETURNS trigger AS $$
BEGIN
  NEW.ticket_id := 'MTG-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket_id on insert
DROP TRIGGER IF EXISTS trg_generate_mortgage_ticket_id ON public.mortgage_applications;
CREATE TRIGGER trg_generate_mortgage_ticket_id
BEFORE INSERT ON public.mortgage_applications
FOR EACH ROW
WHEN (NEW.ticket_id IS NULL)
EXECUTE FUNCTION generate_mortgage_ticket_id();

-- ─── RLS Policies for Mortgage Lenders ──────────────────────
-- Allow users with 'lender' role to view all applications
-- (Assuming 'lender' is a role in profiles)
CREATE POLICY "Lenders can view all mortgage applications" 
ON public.mortgage_applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'lender'
  )
);

-- Allow lenders to update application status and notes
CREATE POLICY "Lenders can update mortgage applications" 
ON public.mortgage_applications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'lender'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'lender'
  )
);
