-- Drop and recreate the public_profiles view to include fishing_styles
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
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
  fishing_styles,
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
  location_lat,
  location_lng,
  CASE 
    WHEN date_of_birth IS NOT NULL THEN 
      EXTRACT(YEAR FROM age(date_of_birth))::integer
    ELSE NULL
  END as age
FROM profiles;