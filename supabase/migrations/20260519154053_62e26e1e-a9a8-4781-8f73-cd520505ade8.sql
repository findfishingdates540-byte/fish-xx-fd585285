CREATE TABLE IF NOT EXISTS public.challenge_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES public.fishing_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  remind_at timestamptz NOT NULL,
  sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS challenge_reminders_user_idx ON public.challenge_reminders(user_id);
CREATE INDEX IF NOT EXISTS challenge_reminders_due_idx ON public.challenge_reminders(remind_at) WHERE sent = false;

ALTER TABLE public.challenge_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON public.challenge_reminders FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create their own reminders"
  ON public.challenge_reminders FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own reminders"
  ON public.challenge_reminders FOR DELETE
  USING (user_id = (SELECT auth.uid()));