
CREATE TABLE public.admin_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  channels text[] NOT NULL DEFAULT '{}',
  audience text NOT NULL DEFAULT 'all',
  popup_variant text NOT NULL DEFAULT 'info',
  popup_cta_label text,
  popup_cta_url text,
  status text NOT NULL DEFAULT 'draft',
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE public.admin_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage broadcasts"
ON public.admin_broadcasts FOR ALL
USING (public.has_role((SELECT auth.uid()), 'admin'))
WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Users can view sent popup broadcasts"
ON public.admin_broadcasts FOR SELECT
USING (status = 'sent' AND 'popup' = ANY(channels));

CREATE INDEX idx_admin_broadcasts_sent_popup ON public.admin_broadcasts (sent_at DESC)
  WHERE status = 'sent';

CREATE TABLE public.admin_broadcast_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES public.admin_broadcasts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (broadcast_id, user_id)
);

ALTER TABLE public.admin_broadcast_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dismissals"
ON public.admin_broadcast_dismissals FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_broadcasts;
