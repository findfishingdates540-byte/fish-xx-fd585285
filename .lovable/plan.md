## Tournament System Upgrades

Address all 4 gaps in tournaments + add to Scoreboard Hub.

### 1. Paid entry flow (Stripe)
- New edge function `tournament-checkout` modeled after `fishing-challenge-checkout`: creates Stripe session, records pending row in `escrow_transactions` (linked via new `tournament_id` column), returns checkout URL.
- Extend `stripe-webhook` to mark tournament entries paid on `checkout.session.completed` and insert into `tournament_participants`.
- `TournamentDetail` "Register" button:
  - If `entry_fee = 0` → direct join (current behavior).
  - If `entry_fee > 0` → call checkout function; on `?payment=success` URL, optimistic confirm + toast.
- DB: add `tournament_id` to `escrow_transactions`, add `has_paid` to `tournament_participants` (default true for free, set true on webhook).

### 2. Automatic prize payout on completion
- Extend `update-challenge-statuses` cron edge function to also process tournaments:
  - When `status = in_progress` and `end_date < now()` (or final match decided) → mark `completed`, set `winner_id` from final match.
  - If `entry_fee > 0`: read global `platform_fee_percent` from `app_settings`, compute payout = total_paid_entries × (1 − fee%), record an admin payout task in existing `prize_payouts` flow (same pattern as challenges). Gift-card prizes: no fee.
  - Notify winner + creator.

### 3. Admin moderation page
- New route `/admin/tournaments` → `AdminTournaments.tsx`:
  - Table of all tournaments (search, filter by status).
  - Actions: view, force-cancel (refunds via Stripe refund call), delete, mark winner manually, view participants & payouts.
- Add link to `AdminSidebar` (Swords icon) under the existing Photo Challenges entry.

### 4. Creator gating
- Add app setting `tournament_creator_requirement` (values: `anyone` | `premium` | `verified` | `admin`, default `premium`).
- `CreateTournament` checks via existing `useIsPremium` / verification hooks; non-eligible users see locked screen explaining requirement + upgrade CTA.
- Admin Settings page exposes this dropdown.

### 5. Scoreboard Hub
- Add `Tournaments` entry to `ScoreboardSheet.tsx` linking to `/app/tournaments` (Swords/tournament icon).

### Files
- Migrations: `escrow_transactions.tournament_id`, `tournament_participants.has_paid`, `app_settings` seed for `tournament_creator_requirement`.
- New: `supabase/functions/tournament-checkout/`, `src/pages/admin/AdminTournaments.tsx`.
- Edited: `stripe-webhook`, `update-challenge-statuses`, `TournamentDetail.tsx`, `CreateTournament.tsx`, `AdminSidebar.tsx`, `AdminSettings.tsx`, `ScoreboardSheet.tsx`, `App.tsx` (route).