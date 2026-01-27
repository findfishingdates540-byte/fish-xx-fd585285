-- Grant 60-day free trial to all existing users
UPDATE public.profiles
SET 
  is_premium = true,
  premium_expires_at = NOW() + INTERVAL '60 days'
WHERE is_premium = false OR premium_expires_at IS NULL OR premium_expires_at < NOW();