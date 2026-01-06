-- Drop and recreate the public_profiles view with additional dating fields
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles WITH (security_invoker = true) AS
SELECT 
  id,
  display_name,
  bio,
  photos,
  cover_photo,
  city,
  state,
  location_name,
  gender,
  interested_in,
  looking_for,
  account_mode,
  fishing_experience,
  fishing_gear,
  preferred_species,
  interests,
  is_premium,
  is_verified,
  id_verified,
  live_verified,
  is_active,
  is_banned,
  last_active_at,
  created_at,
  onboarding_completed,
  prompt_responses,
  zodiac_sign,
  -- Dating-specific fields (non-sensitive)
  height_cm,
  smoking,
  drinking,
  education,
  occupation,
  personality_type,
  matching_style,
  min_age_preference,
  max_age_preference,
  max_distance_miles,
  -- Calculate age from date_of_birth without exposing the actual date
  CASE 
    WHEN date_of_birth IS NOT NULL 
    THEN EXTRACT(YEAR FROM age(CURRENT_DATE, date_of_birth))::integer
    ELSE NULL
  END as age
FROM public.profiles
WHERE is_active = true AND is_banned = false;

-- Ensure proper access
GRANT SELECT ON public.public_profiles TO authenticated;