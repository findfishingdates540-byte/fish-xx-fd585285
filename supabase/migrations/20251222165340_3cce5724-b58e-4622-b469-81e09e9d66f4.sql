-- Create enums for lifestyle choices
CREATE TYPE public.drinking_habit AS ENUM ('never', 'socially', 'regularly');
CREATE TYPE public.smoking_habit AS ENUM ('never', 'sometimes', 'regularly');
CREATE TYPE public.personality_type AS ENUM ('introvert', 'extrovert', 'ambivert');

-- Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS height_cm integer,
ADD COLUMN IF NOT EXISTS drinking public.drinking_habit,
ADD COLUMN IF NOT EXISTS smoking public.smoking_habit,
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS occupation text,
ADD COLUMN IF NOT EXISTS zodiac_sign text,
ADD COLUMN IF NOT EXISTS personality_type public.personality_type,
ADD COLUMN IF NOT EXISTS interests text[],
ADD COLUMN IF NOT EXISTS prompt_responses jsonb DEFAULT '[]'::jsonb;