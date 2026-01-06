-- Remove duplicate support ticket INSERT policy
-- Keeping "Anyone can submit tickets" as the canonical policy
DROP POLICY IF EXISTS "Anyone can insert support tickets" ON public.support_tickets;