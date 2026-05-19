DO $$
DECLARE
  existing_id bigint;
BEGIN
  SELECT jobid INTO existing_id FROM cron.job WHERE jobname = 'process-challenge-reminders';
  IF existing_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_id);
  END IF;
END $$;

SELECT cron.schedule(
  'process-challenge-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/process-challenge-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqbW5sZWxxb2ljbGticnFlZnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzEzODksImV4cCI6MjA4MTEwNzM4OX0.tiO8ZVNokkENlh0D5cy0GVrwJN_jKiGZi_JUUNgASH0"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);