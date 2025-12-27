-- Add targeting columns to advertisements table
ALTER TABLE public.advertisements
ADD COLUMN target_genders text[] DEFAULT NULL,
ADD COLUMN target_age_min integer DEFAULT NULL,
ADD COLUMN target_age_max integer DEFAULT NULL,
ADD COLUMN target_experience_levels text[] DEFAULT NULL,
ADD COLUMN target_interests text[] DEFAULT NULL,
ADD COLUMN target_location_radius_miles integer DEFAULT NULL,
ADD COLUMN target_location_lat numeric DEFAULT NULL,
ADD COLUMN target_location_lng numeric DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.advertisements.target_genders IS 'Array of gender types to target (male, female, non_binary, etc). NULL means all genders.';
COMMENT ON COLUMN public.advertisements.target_age_min IS 'Minimum age to target. NULL means no minimum.';
COMMENT ON COLUMN public.advertisements.target_age_max IS 'Maximum age to target. NULL means no maximum.';
COMMENT ON COLUMN public.advertisements.target_experience_levels IS 'Array of fishing experience levels to target. NULL means all levels.';
COMMENT ON COLUMN public.advertisements.target_interests IS 'Array of fishing interests to target. NULL means all interests.';
COMMENT ON COLUMN public.advertisements.target_location_radius_miles IS 'Radius in miles from target location. NULL means no geo-targeting.';
COMMENT ON COLUMN public.advertisements.target_location_lat IS 'Latitude for geo-targeting center.';
COMMENT ON COLUMN public.advertisements.target_location_lng IS 'Longitude for geo-targeting center.';