-- Populate fishing_styles from the now-labeled interests for users who still have empty fishing_styles
UPDATE public.profiles
SET fishing_styles = (
  SELECT array_agg(
    CASE val
      WHEN 'Deep Sea' THEN 'Deep Sea Fishing'
      WHEN 'Fly Fishing' THEN 'Fly Fishing'
      WHEN 'Kayak Fishing' THEN 'Kayak Fishing'
      WHEN 'Ice Fishing' THEN 'Ice Fishing'
      WHEN 'Bass Fishing' THEN 'Bass Fishing'
      WHEN 'Catch & Release' THEN 'Catch & Release'
    END
  )
  FROM unnest(profiles.interests) AS val
  WHERE val IN ('Deep Sea', 'Fly Fishing', 'Kayak Fishing', 'Ice Fishing', 'Bass Fishing', 'Catch & Release')
)
WHERE account_mode IN ('fishing', 'both')
  AND (fishing_styles IS NULL OR fishing_styles = '{}')
  AND interests IS NOT NULL
  AND array_length(interests, 1) > 0;