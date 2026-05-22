
ALTER TABLE public.admin_broadcasts
  ADD COLUMN scheduled_for timestamptz,
  ADD COLUMN dispatch_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN last_dispatch_error text,
  ADD COLUMN body_html text;

CREATE INDEX idx_admin_broadcasts_scheduled
  ON public.admin_broadcasts (scheduled_for)
  WHERE status = 'scheduled';

INSERT INTO storage.buckets (id, name, public)
VALUES ('broadcast-media', 'broadcast-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read broadcast media"
ON storage.objects FOR SELECT
USING (bucket_id = 'broadcast-media');

CREATE POLICY "Admins upload broadcast media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'broadcast-media'
  AND public.has_role((SELECT auth.uid()), 'admin')
);

CREATE POLICY "Admins update broadcast media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'broadcast-media'
  AND public.has_role((SELECT auth.uid()), 'admin')
);

CREATE POLICY "Admins delete broadcast media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'broadcast-media'
  AND public.has_role((SELECT auth.uid()), 'admin')
);
