
DO $$
DECLARE jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'dispatch-scheduled-broadcasts';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

SELECT cron.schedule(
  'dispatch-scheduled-broadcasts',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/dispatch-scheduled-broadcasts',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqbW5sZWxxb2ljbGticnFlZnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzEzODksImV4cCI6MjA4MTEwNzM4OX0.tiO8ZVNokkENlh0D5cy0GVrwJN_jKiGZi_JUUNgASH0"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
