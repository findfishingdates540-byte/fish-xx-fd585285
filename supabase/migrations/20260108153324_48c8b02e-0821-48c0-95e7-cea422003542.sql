-- Add fishing_styles column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'fishing_styles') THEN
    ALTER TABLE public.profiles ADD COLUMN fishing_styles text[] DEFAULT '{}';
  END IF;
END $$;