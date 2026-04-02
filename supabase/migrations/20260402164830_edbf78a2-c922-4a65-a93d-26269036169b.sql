
SELECT cron.schedule(
  'update-photo-challenge-statuses',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/update-challenge-statuses',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqbW5sZWxxb2ljbGticnFlZnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzEzODksImV4cCI6MjA4MTEwNzM4OX0.tiO8ZVNokkENlh0D5cy0GVrwJN_jKiGZi_JUUNgASH0"}'::jsonb,
    body:='{"time": "now"}'::jsonb
  ) as request_id;
  $$
);
