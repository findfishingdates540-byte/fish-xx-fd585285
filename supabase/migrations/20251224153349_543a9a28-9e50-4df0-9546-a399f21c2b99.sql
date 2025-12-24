-- Add stripe_customer_id to profiles table for Customer Portal sessions
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;