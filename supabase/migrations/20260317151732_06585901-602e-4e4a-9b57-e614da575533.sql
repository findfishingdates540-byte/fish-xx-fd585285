
-- Add UPDATE policy on photo_challenge_entries so users can update their own entries (e.g. caption)
CREATE POLICY "Users can update their own entries"
ON public.photo_challenge_entries
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));
