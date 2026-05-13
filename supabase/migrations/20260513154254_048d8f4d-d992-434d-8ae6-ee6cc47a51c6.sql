
-- Tournament monetization columns
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS prize_type text NOT NULL DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS entry_fee_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_admin_funded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gift_card_code text,
  ADD COLUMN IF NOT EXISTS winner_id uuid;

-- Escrow link for tournaments
ALTER TABLE public.escrow_transactions
  ADD COLUMN IF NOT EXISTS tournament_id uuid;

CREATE INDEX IF NOT EXISTS idx_escrow_tournament_id
  ON public.escrow_transactions(tournament_id) WHERE tournament_id IS NOT NULL;

-- Seed creator-requirement setting (default: premium)
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'tournament_creator_requirement',
  '{"requirement":"premium"}'::jsonb,
  'Who can create tournaments: anyone | premium | verified | admin'
)
ON CONFLICT (key) DO NOTHING;

-- Seed default platform fee row if missing (covers fresh installs)
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'platform_fee_percent',
  '{"percent":10}'::jsonb,
  'Global platform fee % deducted from cash prize pools'
)
ON CONFLICT (key) DO NOTHING;
