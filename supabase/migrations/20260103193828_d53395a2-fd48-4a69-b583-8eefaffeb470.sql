-- Rename weight and length columns from metric to imperial units
ALTER TABLE public.catches 
  RENAME COLUMN weight_kg TO weight_lbs;

ALTER TABLE public.catches 
  RENAME COLUMN length_cm TO length_in;