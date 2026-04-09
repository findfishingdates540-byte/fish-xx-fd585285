
-- Create prize_payouts table
CREATE TABLE public.prize_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES public.photo_challenges(id) ON DELETE SET NULL,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE SET NULL,
  prize_type text NOT NULL DEFAULT 'cash' CHECK (prize_type IN ('cash', 'gift_card')),
  prize_amount numeric DEFAULT 0,
  prize_description text,
  gift_card_code text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'claimed', 'failed')),
  admin_notes text,
  notified_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prize_payouts ENABLE ROW LEVEL SECURITY;

-- Winners can view their own payouts
CREATE POLICY "Winners can view own payouts"
  ON public.prize_payouts FOR SELECT
  TO authenticated
  USING (winner_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins full access to payouts"
  ON public.prize_payouts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add gift_card_code column to photo_challenges
ALTER TABLE public.photo_challenges ADD COLUMN IF NOT EXISTS gift_card_code text;
