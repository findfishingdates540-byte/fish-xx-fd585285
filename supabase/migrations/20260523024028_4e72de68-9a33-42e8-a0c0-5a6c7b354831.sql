
-- 1. Tournaments: hide gift_card_code from broad SELECT
REVOKE SELECT ON public.tournaments FROM anon, authenticated;
GRANT SELECT (
  id, title, description, banner_url, format, seeding_method, scoring_method,
  max_participants, entry_fee, prize_description, registration_start, registration_end,
  start_date, end_date, status, current_round, total_rounds, created_by, created_at,
  updated_at, prize_type, entry_fee_enabled, is_admin_funded, winner_id,
  creator_team_id, winner_team_id
) ON public.tournaments TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_tournament_gift_card(p_tournament_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_winner uuid;
BEGIN
  SELECT gift_card_code, winner_id INTO v_code, v_winner
  FROM public.tournaments WHERE id = p_tournament_id;

  IF v_winner = auth.uid() OR public.has_role(auth.uid(), 'admin') THEN
    RETURN v_code;
  END IF;
  RETURN NULL;
END;
$$;

-- 2. is_team_member: require approved status
CREATE OR REPLACE FUNCTION public.is_team_member(_user uuid, _team uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM fishing_teams WHERE id = _team AND captain_id = _user
  ) OR EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = _team AND user_id = _user AND status = 'approved'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_team_poster(_user uuid, _team uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM fishing_teams WHERE id = _team AND captain_id = _user
  ) OR EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = _team AND user_id = _user
      AND status = 'approved' AND role IN ('officer','captain')
  )
$$;

-- 3. Realtime channel authorization
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive scoped broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can send scoped broadcasts" ON realtime.messages;

-- Helper: allow if topic targets the user or one of their conversations
CREATE POLICY "Authenticated users can receive scoped broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- per-user topics: notifications:<uid>, user:<uid>, presence:<uid>
  realtime.topic() = 'notifications:' || (SELECT auth.uid())::text
  OR realtime.topic() = 'user:' || (SELECT auth.uid())::text
  OR realtime.topic() = 'presence:' || (SELECT auth.uid())::text
  -- match/messages topics: messages:<match_id>
  OR EXISTS (
    SELECT 1 FROM public.matches m
    WHERE realtime.topic() = 'messages:' || m.id::text
      AND ((SELECT auth.uid()) = m.user1_id OR (SELECT auth.uid()) = m.user2_id)
  )
  -- buddy chat topics: buddy:<buddy_id>
  OR EXISTS (
    SELECT 1 FROM public.fishing_buddies b
    WHERE realtime.topic() = 'buddy:' || b.id::text
      AND ((SELECT auth.uid()) = b.requester_id OR (SELECT auth.uid()) = b.recipient_id)
  )
  -- call sessions: call:<call_id>
  OR EXISTS (
    SELECT 1 FROM public.call_sessions c
    WHERE realtime.topic() = 'call:' || c.id::text
      AND ((SELECT auth.uid()) = c.caller_id OR (SELECT auth.uid()) = c.callee_id)
  )
  -- team channels: team:<team_id> (approved members only)
  OR EXISTS (
    SELECT 1 FROM public.fishing_teams ft
    WHERE realtime.topic() = 'team:' || ft.id::text
      AND public.is_team_member((SELECT auth.uid()), ft.id)
  )
  -- public feed/global topics readable by all authed users
  OR realtime.topic() IN ('feed', 'global', 'public')
);

CREATE POLICY "Authenticated users can send scoped broadcasts"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = 'notifications:' || (SELECT auth.uid())::text
  OR realtime.topic() = 'user:' || (SELECT auth.uid())::text
  OR realtime.topic() = 'presence:' || (SELECT auth.uid())::text
  OR EXISTS (
    SELECT 1 FROM public.matches m
    WHERE realtime.topic() = 'messages:' || m.id::text
      AND ((SELECT auth.uid()) = m.user1_id OR (SELECT auth.uid()) = m.user2_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.fishing_buddies b
    WHERE realtime.topic() = 'buddy:' || b.id::text
      AND ((SELECT auth.uid()) = b.requester_id OR (SELECT auth.uid()) = b.recipient_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.call_sessions c
    WHERE realtime.topic() = 'call:' || c.id::text
      AND ((SELECT auth.uid()) = c.caller_id OR (SELECT auth.uid()) = c.callee_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.fishing_teams ft
    WHERE realtime.topic() = 'team:' || ft.id::text
      AND public.is_team_member((SELECT auth.uid()), ft.id)
  )
  OR realtime.topic() IN ('feed', 'global', 'public')
);
