-- Fix the security definer view issue by recreating with security_invoker = true
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  display_name,
  bio,
  photos,
  cover_photo,
  -- Show general location, not exact coordinates
  city,
  state,
  location_name,
  -- Profile attributes (non-sensitive)
  gender,
  fishing_experience,
  interests,
  preferred_species,
  fishing_gear,
  prompt_responses,
  zodiac_sign,
  -- Dating preferences (non-sensitive)
  looking_for,
  interested_in,
  -- Verification status (not internal details)
  is_verified,
  id_verified,
  live_verified,
  is_premium,
  -- Activity
  last_active_at,
  created_at,
  -- Account mode
  account_mode,
  -- Calculate age from date_of_birth instead of exposing the actual date
  CASE 
    WHEN date_of_birth IS NOT NULL THEN 
      EXTRACT(YEAR FROM age(CURRENT_DATE, date_of_birth))::integer
    ELSE NULL
  END AS age,
  -- Flags
  is_active,
  is_banned,
  onboarding_completed
FROM public.profiles
WHERE is_active = true AND is_banned = false;

-- Re-grant access
GRANT SELECT ON public.public_profiles TO authenticated;

COMMENT ON VIEW public.public_profiles IS 'Sanitized profile view that hides sensitive data like email, exact coordinates, payment info, and date of birth. Use this view for displaying other users profiles.';