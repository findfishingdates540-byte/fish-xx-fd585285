-- Add location_name column to catches table for custom spot names
ALTER TABLE public.catches
ADD COLUMN location_name TEXT;