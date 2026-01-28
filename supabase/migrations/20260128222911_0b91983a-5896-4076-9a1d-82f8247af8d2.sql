-- Add area_type column to fishing_spots table
ALTER TABLE public.fishing_spots 
ADD COLUMN area_type text DEFAULT 'freshwater';

-- Add a check constraint for valid values
ALTER TABLE public.fishing_spots 
ADD CONSTRAINT fishing_spots_area_type_check 
CHECK (area_type IN ('freshwater', 'saltwater'));