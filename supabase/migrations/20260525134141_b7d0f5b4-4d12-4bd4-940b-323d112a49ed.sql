
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_notifications_email_pending
  ON public.notifications (type, is_read, email_sent_at, created_at)
  WHERE email_sent_at IS NULL AND is_read = false;

DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'process-message-emails';
  IF jid IS NOT NULL THEN PERFORM cron.unschedule(jid); END IF;
END $$;

SELECT cron.schedule(
  'process-message-emails',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/process-message-emails',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
