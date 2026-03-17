
-- Photo Challenges tables

CREATE TABLE public.photo_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  banner_url text,
  entry_fee numeric NOT NULL DEFAULT 5.00,
  prize_type text NOT NULL DEFAULT 'cash',
  prize_description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  voting_end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  winner_id uuid,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.photo_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view photo challenges"
ON public.photo_challenges FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can manage photo challenges"
ON public.photo_challenges FOR ALL TO authenticated
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Users can create photo challenges"
ON public.photo_challenges FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = created_by);

-- Entries table

CREATE TABLE public.photo_challenge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.photo_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  photo_url text NOT NULL,
  caption text,
  has_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.photo_challenge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view entries"
ON public.photo_challenge_entries FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can submit entries"
ON public.photo_challenge_entries FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own entries"
ON public.photo_challenge_entries FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Votes table

CREATE TABLE public.photo_challenge_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.photo_challenges(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.photo_challenge_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.photo_challenge_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
ON public.photo_challenge_votes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can cast votes"
ON public.photo_challenge_votes FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can remove own votes"
ON public.photo_challenge_votes FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Indexes
CREATE INDEX idx_photo_challenge_entries_challenge ON public.photo_challenge_entries(challenge_id);
CREATE INDEX idx_photo_challenge_votes_challenge ON public.photo_challenge_votes(challenge_id);
CREATE INDEX idx_photo_challenge_votes_entry ON public.photo_challenge_votes(entry_id);

-- Vote tally function
CREATE OR REPLACE FUNCTION public.tally_photo_challenge_votes(p_challenge_id uuid)
RETURNS TABLE(entry_id uuid, user_id uuid, photo_url text, caption text, vote_count bigint, rank bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    e.id as entry_id,
    e.user_id,
    e.photo_url,
    e.caption,
    COUNT(v.id) as vote_count,
    RANK() OVER (ORDER BY COUNT(v.id) DESC) as rank
  FROM photo_challenge_entries e
  LEFT JOIN photo_challenge_votes v ON v.entry_id = e.id
  WHERE e.challenge_id = p_challenge_id
  GROUP BY e.id, e.user_id, e.photo_url, e.caption
  ORDER BY vote_count DESC;
$$;
