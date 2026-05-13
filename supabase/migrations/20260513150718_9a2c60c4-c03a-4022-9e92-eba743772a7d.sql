-- Add is_private flag for owner-only catches
ALTER TABLE public.catches
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_catches_is_private ON public.catches(is_private);

-- Tighten SELECT policy: owners always see; others only see non-private
DROP POLICY IF EXISTS "Anyone can view catches" ON public.catches;

CREATE POLICY "Users can view non-private catches or own catches"
  ON public.catches
  FOR SELECT
  TO authenticated
  USING (is_private = false OR user_id = (SELECT auth.uid()));