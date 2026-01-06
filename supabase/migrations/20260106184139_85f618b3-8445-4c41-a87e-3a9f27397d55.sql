-- Step 1: Drop the overly permissive public profile policy
DROP POLICY IF EXISTS "Anyone can view active non-banned profiles" ON public.profiles;

-- Step 2: Create a policy that requires authentication to view other profiles
CREATE POLICY "Authenticated users can view active profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_active = true 
  AND is_banned = false
);

-- Step 3: Create a secure view that hides sensitive fields
-- This view excludes: email, exact coordinates, stripe_customer_id, verification internals
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Step 4: Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Step 5: Revoke direct anon access to profiles table (RLS already handles this, but be explicit)
REVOKE ALL ON public.profiles FROM anon;

-- Step 6: Add a comment explaining the security model
COMMENT ON VIEW public.public_profiles IS 'Sanitized profile view that hides sensitive data like email, exact coordinates, payment info, and date of birth. Use this view for displaying other users profiles.';

-- Step 7: Create a function for getting full profile data (for the user themselves)
-- This is already handled by the "Users can view own profile" policy