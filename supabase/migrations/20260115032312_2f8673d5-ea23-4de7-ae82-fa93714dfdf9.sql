-- Schedule the trip reminders function to run every hour using pg_net
-- First check if pg_cron job already exists and delete it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-trip-reminders') THEN
    PERFORM cron.unschedule('process-trip-reminders');
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL; -- cron schema doesn't exist yet
END $$;

-- Schedule the job
SELECT cron.schedule(
  'process-trip-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/process-trip-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);