
ALTER TABLE public.photo_challenges
  ADD COLUMN IF NOT EXISTS entry_fee_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS platform_fee_percent numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS is_admin_funded boolean NOT NULL DEFAULT false;

ALTER TABLE public.fishing_challenges
  ADD COLUMN IF NOT EXISTS entry_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entry_fee_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prize_type text NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS prize_description text,
  ADD COLUMN IF NOT EXISTS platform_fee_percent numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS is_admin_funded boolean NOT NULL DEFAULT false;
