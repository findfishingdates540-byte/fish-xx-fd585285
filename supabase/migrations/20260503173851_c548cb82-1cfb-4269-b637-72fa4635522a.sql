
-- Fix: Make the view use SECURITY INVOKER (the safe default)
ALTER VIEW public.photo_challenges_public SET (security_invoker = on);
