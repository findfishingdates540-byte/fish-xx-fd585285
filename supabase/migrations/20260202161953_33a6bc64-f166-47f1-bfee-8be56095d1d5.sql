UPDATE profiles 
SET 
  id_verified = true,
  id_verified_at = now(),
  live_verified = true,
  live_verified_at = now(),
  id_verified_expires_at = now() + interval '1 year',
  live_verified_expires_at = now() + interval '1 year'
WHERE id = 'c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de'