
CREATE TABLE public.prize_payout_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES public.prize_payouts(id) ON DELETE CASCADE,
  winner_id uuid NOT NULL,
  method text NOT NULL CHECK (method IN ('paypal','venmo','zelle','bank','mailing_check','other')),
  full_name text NOT NULL,
  contact_email text,
  contact_phone text,
  paypal_email text,
  venmo_handle text,
  zelle_identifier text,
  bank_account_name text,
  bank_name text,
  bank_routing text,
  bank_account_number text,
  mailing_address_1 text,
  mailing_address_2 text,
  mailing_city text,
  mailing_state text,
  mailing_postal_code text,
  mailing_country text,
  tax_id text,
  notes text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(payout_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prize_payout_details TO authenticated;
GRANT ALL ON public.prize_payout_details TO service_role;

ALTER TABLE public.prize_payout_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Winners can view their own payout details"
  ON public.prize_payout_details FOR SELECT TO authenticated
  USING (winner_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all payout details"
  ON public.prize_payout_details FOR SELECT TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Winners can insert their own payout details"
  ON public.prize_payout_details FOR INSERT TO authenticated
  WITH CHECK (
    winner_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.prize_payouts pp
      WHERE pp.id = payout_id AND pp.winner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Winners can update their own payout details"
  ON public.prize_payout_details FOR UPDATE TO authenticated
  USING (winner_id = (SELECT auth.uid()))
  WITH CHECK (winner_id = (SELECT auth.uid()));

CREATE TRIGGER trg_prize_payout_details_updated
  BEFORE UPDATE ON public.prize_payout_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_prize_payout_details_payout ON public.prize_payout_details(payout_id);
CREATE INDEX idx_prize_payout_details_winner ON public.prize_payout_details(winner_id);
