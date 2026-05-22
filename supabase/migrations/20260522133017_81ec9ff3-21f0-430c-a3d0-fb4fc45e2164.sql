-- Idempotency log for event announcement emails
CREATE TABLE IF NOT EXISTS public.event_announcement_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('tournament','photo_challenge','fishing_challenge')),
  event_id uuid NOT NULL,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipients_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent',
  error text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_type, event_id)
);

ALTER TABLE public.event_announcement_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read announcement log"
  ON public.event_announcement_email_log
  FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));