-- Add verification expiry fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS id_verified_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS live_verified_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for finding expired verifications
CREATE INDEX IF NOT EXISTS idx_profiles_verification_expiry 
ON public.profiles (id_verified_expires_at, live_verified_expires_at) 
WHERE id_verified = true OR live_verified = true;

-- Create index for finding users needing verification reminders
CREATE INDEX IF NOT EXISTS idx_profiles_verification_reminder 
ON public.profiles (created_at, verification_reminder_sent_at) 
WHERE (id_verified = false OR id_verified IS NULL) AND (live_verified = false OR live_verified IS NULL);