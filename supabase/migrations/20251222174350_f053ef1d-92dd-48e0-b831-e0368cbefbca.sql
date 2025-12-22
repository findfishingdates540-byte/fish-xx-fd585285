-- Rename max_distance_km to max_distance_miles in profiles table
ALTER TABLE public.profiles 
RENAME COLUMN max_distance_km TO max_distance_miles;