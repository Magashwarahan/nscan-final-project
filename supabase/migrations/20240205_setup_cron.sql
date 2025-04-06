
-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing cron job if it exists to avoid duplicates
SELECT cron.unschedule('check-scheduled-scans');

-- Schedule the cron job to run every minute
SELECT cron.schedule(
  'check-scheduled-scans',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://tfxlzjhvrnyjylyuimis.supabase.co/functions/v1/execute-scheduled-scan',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization"}'::jsonb
    ) as request_id;
  $$
);
