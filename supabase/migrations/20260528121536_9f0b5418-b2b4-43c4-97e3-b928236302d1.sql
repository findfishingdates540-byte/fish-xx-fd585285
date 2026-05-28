
-- Add teen safety / junior angler columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_minor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_junior_account boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_guardian_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_guardian_email text,
  ADD COLUMN IF NOT EXISTS consent_given_at timestamptz,
  ADD COLUMN IF NOT EXISTS parent_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Junior-only flag on competition entities
ALTER TABLE public.tournaments        ADD COLUMN IF NOT EXISTS is_junior_only boolean NOT NULL DEFAULT false;
ALTER TABLE public.fishing_challenges ADD COLUMN IF NOT EXISTS is_junior_only boolean NOT NULL DEFAULT false;
ALTER TABLE public.photo_challenges   ADD COLUMN IF NOT EXISTS is_junior_only boolean NOT NULL DEFAULT false;

-- Helper: compute minor status from DOB
CREATE OR REPLACE FUNCTION public.is_user_minor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT date_of_birth IS NOT NULL
            AND date_of_birth > (CURRENT_DATE - INTERVAL '18 years')::date
            AND date_of_birth <= (CURRENT_DATE - INTERVAL '13 years')::date
     FROM public.profiles WHERE id = _user_id),
    false
  );
$$;

-- Trigger to keep is_minor / is_junior_account in sync with DOB
CREATE OR REPLACE FUNCTION public.sync_minor_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  age_years int;
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    age_years := EXTRACT(YEAR FROM age(NEW.date_of_birth));
    IF age_years < 13 THEN
      RAISE EXCEPTION 'Users under 13 are not allowed on Fish-X';
    END IF;
    NEW.is_minor := (age_years < 18);
    IF NEW.is_minor THEN
      NEW.is_junior_account := true;
      -- Minors cannot use dating features
      IF NEW.account_mode IN ('dating','both') THEN
        NEW.account_mode := 'fishing';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_minor_status ON public.profiles;
CREATE TRIGGER trg_sync_minor_status
BEFORE INSERT OR UPDATE OF date_of_birth, account_mode ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_minor_status();

-- Backfill existing rows
UPDATE public.profiles
SET is_minor = (date_of_birth IS NOT NULL
                AND date_of_birth > (CURRENT_DATE - INTERVAL '18 years')::date
                AND date_of_birth <= (CURRENT_DATE - INTERVAL '13 years')::date),
    is_junior_account = (date_of_birth IS NOT NULL
                AND date_of_birth > (CURRENT_DATE - INTERVAL '18 years')::date
                AND date_of_birth <= (CURRENT_DATE - INTERVAL '13 years')::date) OR is_junior_account
WHERE date_of_birth IS NOT NULL;
