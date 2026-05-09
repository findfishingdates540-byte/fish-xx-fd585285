
-- Escrow transactions
CREATE TABLE IF NOT EXISTS public.escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.photo_challenges(id) ON DELETE CASCADE,
  fishing_challenge_id uuid REFERENCES public.fishing_challenges(id) ON DELETE CASCADE,
  entry_id uuid,
  user_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending',
  released_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT escrow_one_challenge_ref CHECK (
    (challenge_id IS NOT NULL)::int + (fishing_challenge_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX IF NOT EXISTS idx_escrow_challenge ON public.escrow_transactions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_escrow_fishing ON public.escrow_transactions(fishing_challenge_id);
CREATE INDEX IF NOT EXISTS idx_escrow_user ON public.escrow_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON public.escrow_transactions(status);

ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own escrow"
  ON public.escrow_transactions FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can view all escrow"
  ON public.escrow_transactions FOR SELECT
  USING (public.has_role((SELECT auth.uid()), 'admin'));

-- Fishing challenge entries (paid-entry gate)
CREATE TABLE IF NOT EXISTS public.fishing_challenge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.fishing_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  has_paid boolean NOT NULL DEFAULT false,
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, user_id)
);

ALTER TABLE public.fishing_challenge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fishing challenge entries"
  ON public.fishing_challenge_entries FOR SELECT
  USING (true);

CREATE POLICY "Users can join challenges"
  ON public.fishing_challenge_entries FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Add winner_id to fishing_challenges
ALTER TABLE public.fishing_challenges
  ADD COLUMN IF NOT EXISTS winner_id uuid;

-- Extend prize_payouts
ALTER TABLE public.prize_payouts
  ADD COLUMN IF NOT EXISTS gross_pool numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fishing_challenge_id uuid REFERENCES public.fishing_challenges(id) ON DELETE SET NULL;
