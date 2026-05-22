-- profiles_safe is a public-safe projection of profiles (only non-sensitive fields).
-- It was set to security_invoker=true, which made it useless for cross-user reads
-- because profiles RLS only lets users see their own row. Switch to definer-style
-- (security_invoker=false) so the safe view returns active, non-banned profiles
-- to any authenticated/anon caller. Sensitive columns remain protected because
-- they are simply not selected by the view.
ALTER VIEW public.profiles_safe SET (security_invoker = false);