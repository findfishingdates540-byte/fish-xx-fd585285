ALTER TABLE public.fish_species
  ADD COLUMN IF NOT EXISTS world_record_weight_lbs numeric,
  ADD COLUMN IF NOT EXISTS world_record_weight_text text,
  ADD COLUMN IF NOT EXISTS world_record_angler text,
  ADD COLUMN IF NOT EXISTS world_record_location text,
  ADD COLUMN IF NOT EXISTS world_record_country text,
  ADD COLUMN IF NOT EXISTS world_record_date date,
  ADD COLUMN IF NOT EXISTS world_record_source text DEFAULT 'IGFA All-Tackle Records';