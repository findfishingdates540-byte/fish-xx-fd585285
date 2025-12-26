-- Add is_banned column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- Create index for faster querying of banned users
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned);

-- Update RLS policy to prevent banned users from viewing other profiles
DROP POLICY IF EXISTS "Anyone can view active profiles" ON public.profiles;

CREATE POLICY "Anyone can view active non-banned profiles" 
ON public.profiles 
FOR SELECT 
USING (is_active = true AND is_banned = false);

-- Allow admins to view ALL profiles including banned ones
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Allow users to always view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow admins to update any profile (for banning, etc.)
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));