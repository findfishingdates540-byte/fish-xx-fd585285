
## Goal

Collect entry fees via Stripe at the moment a user joins a paid challenge, hold those funds as "escrow" in our system, and only release the prize pool to the winner (minus the platform's % cut) once the challenge ends. Gift-card and admin-funded challenges keep working as today (no Stripe collection, no platform cut).

## Flow overview

```text
User joins paid challenge
   └─► Stripe Checkout (one-time payment)
         └─► stripe-webhook (checkout.session.completed)
               ├─► mark entry has_paid = true
               └─► insert escrow_transactions row (status='held')

Challenge ends (update-challenge-statuses cron)
   └─► tally winner
   └─► sum held escrow rows for that challenge = pool
   └─► platform_cut = pool * platform_fee_percent/100
   └─► winner_amount = pool - platform_cut
   └─► insert prize_payouts(status='pending', amount=winner_amount)
   └─► flip escrow rows to status='released'
   └─► notify winner

Admin pays winner manually (Stripe dashboard / bank / gift card)
   └─► marks payout 'sent' in admin UI (existing)
```

We are NOT using Stripe Connect / automatic transfers — funds sit in the platform Stripe balance and admin pays out manually. This is the simplest "escrow-style" model and matches the existing manual payout admin UI.

## Database changes (one migration)

1. **New table `escrow_transactions`**
   - `challenge_id uuid` (nullable), `fishing_challenge_id uuid` (nullable) — exactly one set
   - `entry_id uuid` (nullable, links to `photo_challenge_entries` when applicable)
   - `user_id uuid` — payer
   - `amount numeric` — gross paid
   - `currency text default 'usd'`
   - `stripe_session_id text unique`, `stripe_payment_intent_id text`
   - `status text` — `pending` → `held` → `released` | `refunded`
   - `released_at`, `created_at`
   - RLS: user can read own rows; admins read all; only service role inserts/updates.

2. **`fishing_challenges`** — add `winner_id uuid` if missing (used by escrow release). Add a `paid_entries` join table `fishing_challenge_entries(challenge_id, user_id, has_paid, stripe_session_id)` since one doesn't exist yet — needed to gate participation by payment.

3. **`prize_payouts`** — add `platform_fee_amount numeric`, `gross_pool numeric`, `fishing_challenge_id uuid` (column already has tournament/challenge — just confirm it covers fishing challenges).

## Edge functions

1. **`photo-challenge-checkout`** (already exists) — extend to also write a `pending` row in `escrow_transactions` keyed on `session.id` so we can reconcile.

2. **`fishing-challenge-checkout`** (new) — mirror of photo version for fishing challenges. Validates challenge is `entry_fee_enabled` and `prize_type='cash'`, creates a Stripe Checkout session, writes pending escrow row, returns URL.

3. **`stripe-webhook`** — extend handler:
   - On `checkout.session.completed` with `metadata.type ∈ {photo_challenge_entry, fishing_challenge_entry}`:
     - Update `escrow_transactions` → `status='held'`, store `payment_intent_id`.
     - Upsert the matching `*_entries` row with `has_paid=true`.

4. **`update-challenge-statuses`** — when transitioning a challenge to `completed`:
   - Sum `escrow_transactions` where `status='held'` for that challenge → `gross_pool`.
   - `platform_fee_amount = gross_pool * platform_fee_percent/100`.
   - `winner_amount = gross_pool - platform_fee_amount`.
   - Insert `prize_payouts` with these values (only when `prize_type='cash'` and not `is_admin_funded`).
   - Flip those escrow rows to `status='released'`.
   - Gift-card / admin-funded path unchanged.
   - Apply identical logic for fishing challenges (new branch alongside the existing photo-challenge loop).

5. **Refund path** — when an entry is withdrawn before challenge starts, or challenge is cancelled: new function `refund-challenge-entry` that calls Stripe `refunds.create` and sets escrow row to `refunded`. (Admin-triggered, not user-self-serve in v1.)

## Frontend changes

- **`PhotoChallengeDetail` / `FishingChallengeDetail`** — "Join challenge" CTA on a paid challenge calls the checkout edge function and redirects to Stripe (reuse iframe-safe pattern from `use-stripe-checkout.ts`). On return with `?payment=success`, optimistically mark as joined and refetch.
- **Gate submissions** — entry submission UI requires `has_paid=true` for paid challenges.
- **Admin payouts page** (existing) — surface `gross_pool`, `platform_fee_amount`, `winner_amount` so admin sees exactly what to pay.
- **Challenge detail** — show "Prize pool: $X (Y entries × $fee, minus Z% platform fee)" live.

## Out of scope (v1)

- Stripe Connect / automatic transfer to winners' bank accounts.
- User-initiated refunds.
- Multi-winner prize splits (1st/2nd/3rd) — current model is single winner.

## Open assumptions (proceeding unless you say otherwise)

- Single winner per challenge (matches current `winner_id` design).
- Manual admin payout to winners (no Connect).
- Refunds are admin-only in v1.
