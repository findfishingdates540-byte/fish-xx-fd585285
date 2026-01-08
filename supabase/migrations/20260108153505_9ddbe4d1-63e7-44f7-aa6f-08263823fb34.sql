-- Fix security definer view by setting security_invoker = true
ALTER VIEW public.public_profiles SET (security_invoker = true);