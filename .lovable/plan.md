## Issue

`paypal-calcutta-checkout` returns "Failed to send a request to the Edge Function" because the function has **never been deployed** to Supabase. Evidence:

- No log history for `paypal-calcutta-checkout` (Supabase: "No logs found").
- Source exists at `supabase/functions/paypal-calcutta-checkout/index.ts` and is invoked from `src/pages/app/ChampionshipDetail.tsx`.
- All three secrets (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV`) are present.

The sibling function `paypal-calcutta-capture` is in the same state and will fail right after a successful PayPal approval.

## Fix

1. Deploy `paypal-calcutta-checkout` and `paypal-calcutta-capture`.
2. Retry the calcutta payment to confirm; check function logs if anything still fails.

No code changes required — both functions already have correct CORS, JWT validation, and PayPal API wiring.