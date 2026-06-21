CREATE OR REPLACE FUNCTION public.block_protected_species_in_competitions()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.challenge_id IS NOT NULL OR NEW.tournament_id IS NOT NULL THEN
    IF NEW.species_name ILIKE 'Shark, White'
       OR NEW.species_name ILIKE 'Great White Shark'
       OR NEW.species_name ILIKE 'White Shark' THEN
      RAISE EXCEPTION 'Shark, White / Great White Sharks are protected and off-limits in competitions';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_protected_species_in_competitions ON public.catches;
CREATE TRIGGER trg_block_protected_species_in_competitions
BEFORE INSERT OR UPDATE ON public.catches
FOR EACH ROW
EXECUTE FUNCTION public.block_protected_species_in_competitions();
