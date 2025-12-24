-- Update user account mode to 'both' for full access
UPDATE public.profiles 
SET account_mode = 'both'
WHERE email = 'muhammedlateef20016@gmail.com';