-- Fix existing users' interests: convert IDs to labels
-- This is a one-time data migration to normalize interest values

UPDATE public.profiles
SET interests = (
  SELECT array_agg(
    CASE val
      WHEN 'fly_fishing' THEN 'Fly Fishing'
      WHEN 'deep_sea' THEN 'Deep Sea'
      WHEN 'kayak_fishing' THEN 'Kayak Fishing'
      WHEN 'catch_and_cook' THEN 'Catch & Release'
      WHEN 'ice_fishing' THEN 'Ice Fishing'
      WHEN 'bass_fishing' THEN 'Bass Fishing'
      WHEN 'music' THEN 'Music'
      WHEN 'movies' THEN 'Movies'
      WHEN 'fitness' THEN 'Gym'
      WHEN 'art' THEN 'Art'
      WHEN 'gaming' THEN 'Gaming'
      WHEN 'reading' THEN 'Reading'
      WHEN 'camping' THEN 'Camping'
      WHEN 'boating' THEN 'Swimming'
      WHEN 'travel' THEN 'Travel'
      WHEN 'photography' THEN 'Photography'
      WHEN 'conservation' THEN 'Birdwatching'
      WHEN 'early_mornings' THEN 'Running'
      WHEN 'seafood_cooking' THEN 'Cooking'
      WHEN 'hiking' THEN 'Hiking'
      WHEN 'wine' THEN 'Wine Tasting'
      WHEN 'coffee' THEN 'Coffee'
      WHEN 'dancing' THEN 'Dancing'
      WHEN 'pets' THEN 'Birdwatching'
      WHEN 'foodie' THEN 'Cooking'
      WHEN 'concerts' THEN 'Music'
      WHEN 'nature' THEN 'Mountains'
      ELSE val  -- Keep already-correct labels as-is
    END
  )
  FROM unnest(profiles.interests) AS val
)
WHERE interests IS NOT NULL 
  AND array_length(interests, 1) > 0
  AND EXISTS (
    SELECT 1 FROM unnest(interests) AS v 
    WHERE v ~ '^[a-z_]+$'  -- Only update rows that have snake_case IDs
  );

-- Also populate fishing_styles for users who have fishing interest IDs but empty fishing_styles
UPDATE public.profiles
SET fishing_styles = (
  SELECT array_agg(
    CASE val
      WHEN 'fly_fishing' THEN 'Fly Fishing'
      WHEN 'deep_sea' THEN 'Deep Sea Fishing'
      WHEN 'kayak_fishing' THEN 'Kayak Fishing'
      WHEN 'catch_and_cook' THEN 'Catch & Release'
      WHEN 'ice_fishing' THEN 'Ice Fishing'
      WHEN 'bass_fishing' THEN 'Bass Fishing'
    END
  )
  FROM unnest(profiles.interests) AS val
  WHERE val IN ('fly_fishing', 'deep_sea', 'kayak_fishing', 'catch_and_cook', 'ice_fishing', 'bass_fishing')
)
WHERE account_mode IN ('fishing', 'both')
  AND (fishing_styles IS NULL OR fishing_styles = '{}')
  AND interests IS NOT NULL
  AND array_length(interests, 1) > 0;