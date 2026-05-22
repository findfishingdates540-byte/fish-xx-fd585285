-- Revert security_invoker on profiles_safe. The view is intentionally the
-- curated public surface of profiles (safe columns only, active+non-banned).
-- Running it as security_invoker forced caller RLS on profiles, which only
-- exposes the caller's own row, breaking every place that resolves other
-- users' display names (feed, comments, mentions, etc.).
ALTER VIEW public.profiles_safe SET (security_invoker = false);
