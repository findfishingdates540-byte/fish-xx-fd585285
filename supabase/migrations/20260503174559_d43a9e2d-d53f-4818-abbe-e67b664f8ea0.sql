
-- Step 1: Drop the broad SELECT policy on profiles
DROP POLICY IF EXISTS "Authenticated users can view active profiles" ON public.profiles;

-- Step 2: Create a safe view that excludes sensitive columns
-- Using security_invoker=on so RLS of the querying user applies
-- But we need a base-table policy that lets the view read rows...
-- Since we want to block direct table access but allow the view,
-- we'll use a SECURITY DEFINER function approach instead.

-- Create a SECURITY DEFINER view (will set security_barrier for safety)
CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_barrier=true, security_invoker=false) AS
SELECT
  id, display_name, bio, photos, cover_photo,
  gender, location_name, city, state,
  account_mode, fishing_experience, fishing_styles, fishing_gear,
  preferred_species, interests,
  looking_for, interested_in, matching_style,
  personality_type, zodiac_sign, occupation, education,
  smoking, drinking, height_cm,
  prompt_responses,
  is_active, is_banned, is_verified, is_premium,
  id_verified, live_verified,
  onboarding_completed,
  followers_count, following_count, total_likes_received,
  last_active_at, created_at, updated_at,
  min_age_preference, max_age_preference, max_distance_miles,
  -- Computed age from date_of_birth (safe - doesn't expose exact DOB)
  CASE WHEN date_of_birth IS NOT NULL
    THEN EXTRACT(YEAR FROM age(CURRENT_DATE, date_of_birth))::int
    ELSE NULL
  END AS age
FROM public.profiles
WHERE is_active = true AND is_banned = false;

-- Grant access to authenticated and anon roles
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO anon;

-- Note: The profiles table now only has these SELECT policies:
-- 1. "Users can view own profile" (auth.uid() = id) - full row for own profile
-- 2. "Admins can view all profiles" (has_role admin) - full row for admins
-- No broad policy exists, so direct table queries by other users will fail.
-- Cross-user queries must use profiles_safe view.
