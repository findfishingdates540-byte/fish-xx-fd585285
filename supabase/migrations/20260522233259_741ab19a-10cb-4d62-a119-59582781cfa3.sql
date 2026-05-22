
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Backfill existing rows
UPDATE public.team_members SET status = 'approved' WHERE status IS DISTINCT FROM 'approved' AND joined_at < now();

-- Constrain values
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_status_check;
ALTER TABLE public.team_members ADD CONSTRAINT team_members_status_check CHECK (status IN ('pending','approved'));

CREATE INDEX IF NOT EXISTS idx_team_members_team_status ON public.team_members(team_id, status);

-- Replace SELECT policy
DROP POLICY IF EXISTS "Anyone can view team members" ON public.team_members;
CREATE POLICY "View approved members or own/captain pending"
ON public.team_members
FOR SELECT
USING (
  status = 'approved'
  OR user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.fishing_teams ft
    WHERE ft.id = team_members.team_id AND ft.captain_id = (SELECT auth.uid())
  )
);

-- Replace INSERT policy to force pending status
DROP POLICY IF EXISTS "Users can join teams" ON public.team_members;
CREATE POLICY "Users can request to join teams"
ON public.team_members
FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND status = 'pending'
);
