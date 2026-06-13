# 2026 Global Shark Championship — Build Plan

A new team-based "championship" mode on the existing Challenge engine. Long-running (Jan 1 – Dec 31), points-based, with custom species tiers, admin-judged trophy sizing, a best-20 cap, species-diversity bonuses, and an optional Calcutta side-pot paying the top 3 paying teams.

## How users experience it

- **Anglers**: From Challenges, see the Shark Championship banner. Captains register their team (free). Captains can optionally pay $100 to enter the Calcutta. Members log shark catches as normal, pick the championship + their team, attach verification code + photo + species. Submissions go to admin review.
- **Admins**: Build the championship in a new "Championship" tab under Admin → Fishing Challenges. Pick which species are Common / Premium, set point values, mark Junior/Lady restrictions if needed. On the existing Competition Catches review page, for any Premium-shark submission, pick a tier (Standard / Large / Trophy) when approving. After Dec 31, mark championship completed, system writes Top 3 Calcutta payouts to existing `prize_payouts`; admin processes them via the current cash/gift-card flow.
- **Public leaderboard**: Live team standings sorted by championship points (best-20 sum + diversity bonus). Each team card shows: total points, sharks counted, distinct species, Calcutta-paid badge. Drilldown shows each angler's qualifying catches.

## Scoring rules (from the PDF, encoded once)

- Common shark approved → species' Common points (default 10)
- Premium shark approved → tier-judged: Standard 50 / Large 75 / Trophy 100
- Team total = sum of the team's **top 20 catch scores** (across all members)
- + Species diversity bonus over the team's qualifying catches: 5 species +100, 8 species +250, 10 species +500
- Calcutta payout (only paying teams ranked by final points): 1st 50%, 2nd 30%, 3rd 20% of the 75% pool (25% retained by Fish-X). Tweakable on the championship row.

## Files & structure

### Database (one migration)

1. New table `championship_species_tiers(championship_id, species_id, tier 'common'|'premium', points int)` for the admin-managed per-tournament species list.
2. Add to `fishing_challenges`:
   - `is_championship boolean default false`
   - `calcutta_entry_fee numeric` (e.g. 100)
   - `calcutta_payout_split jsonb default '{"first":0.5,"second":0.3,"third":0.2,"platform":0.25}'`
   - `best_n_catches int default 20`
   - `diversity_bonuses jsonb default '[{"species":5,"bonus":100},{"species":8,"bonus":250},{"species":10,"bonus":500}]'`
3. New table `championship_teams(championship_id, team_id, calcutta_paid bool, calcutta_paid_at, stripe_session_id, total_points, qualifying_catches, distinct_species)` — registration record + cached score.
4. Reuse `catches.trophy_level` (already exists) for Standard/Large/Trophy sizing on premium sharks; admin sets it when approving.
5. Function `recalc_championship_scores(championship_id)`: for each registered team, gather approved shark catches by member, score each via `championship_species_tiers`, take top N by score, sum, add diversity bonus over distinct species in those qualifying catches, write to `championship_teams`. Triggered after admin approve/reject of any catch on a championship.
6. Function `finalize_championship_calcutta(championship_id)`: rank Calcutta-paid teams by score, write 3 rows into existing `prize_payouts` for top 3 (50/30/20 of the 75% pool). Admin button on completion.
7. Standard GRANTs + RLS: anyone can read `championship_species_tiers` and `championship_teams`; only admin and team captain can register/pay; admins write tiers and payouts.

### Frontend

- `src/pages/admin/AdminChampionships.tsx` — list + create/edit dialog with banner, dates, species-tier editor (two columns, drag/drop or +/- buttons; point inputs), payout split editor.
- `src/components/admin/CompetitionCatchTierPicker.tsx` — Standard/Large/Trophy segmented control shown on **premium-shark** rows in `AdminCompetitionCatches.tsx` Pending tab; chosen tier saved with the approve action.
- `src/pages/app/ChampionshipDetail.tsx` — public hub: banner, rules summary, registration card (captain-only), Calcutta CTA, live team leaderboard, "your team" panel with qualifying catches list, diversity progress.
- `src/pages/app/Championships.tsx` — list of championships (just Global Shark for now, future-proof).
- `LogCompetitionCatchModal.tsx` and `LogCatchForm.tsx` — when the angler is on a team registered in an active championship, surface the championship in the competition selector alongside challenges/tournaments.
- New edge function `championship-calcutta-checkout` (clone of `fishing-challenge-checkout` pattern) — Stripe checkout for the $100 Calcutta; webhook (extend existing `stripe-webhook`) marks `championship_teams.calcutta_paid`.
- Route additions in `App.tsx`: `/app/championships`, `/app/championships/:id`, `/admin/championships`.

### Seeding

After migration, insert the 2026 Global Shark Championship row with the PDF dates, $5,000 prize description, default payout split, default diversity bonuses, and the PDF's species list pre-populated in `championship_species_tiers` (Common = 10 pts, Premium = 50 pts base; admin can adjust later).

## Out of scope (intentional)

- The "% of paying teams" payout option — Fixed Top 3 is locked in.
- A separate "Common vs Premium" tag on global `fish_species` — per-tournament only.
- Auto-detecting trophy tier from length — admin judges manually.
- Live Calcutta funding UI for non-captains — only captains can pay on behalf of the team.

## Open items I'll confirm at build time

- Wording for the team-registration consent ("You're entering on behalf of `<team>`…").
- Whether to lock registration after a cut-off date (default: open all year so teams can join late, but only catches from Jan 1 onward count).
- Junior Anglers eligibility — default to all-ages unless you ask to restrict.
