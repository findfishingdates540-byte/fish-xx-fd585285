DROP POLICY IF EXISTS "Users can update votes in open window" ON public.photo_challenge_votes;

CREATE POLICY "Users can update votes in open window"
ON public.photo_challenge_votes
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  AND EXISTS (
    SELECT 1
    FROM public.photo_challenge_entries e
    JOIN public.photo_challenges c ON c.id = e.challenge_id
    WHERE e.id = photo_challenge_votes.entry_id
      AND c.status = 'voting'
      AND now() >= c.end_date
      AND (c.voting_end_date IS NULL OR now() < c.voting_end_date)
  )
)
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND EXISTS (
    SELECT 1
    FROM public.photo_challenge_entries e
    JOIN public.photo_challenges c ON c.id = e.challenge_id
    WHERE e.id = photo_challenge_votes.entry_id
      AND e.user_id <> photo_challenge_votes.user_id
      AND c.status = 'voting'
      AND now() >= c.end_date
      AND (c.voting_end_date IS NULL OR now() < c.voting_end_date)
  )
);