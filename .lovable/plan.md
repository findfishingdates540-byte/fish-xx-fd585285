# Tournament team experience — bracket, leaderboards, MVPs, alerts, admin (Should use the color sckeme of the pages under scoreboard hub)

## 1. Bracket progression UI (TournamentDetail "Bracket" tab)

Refactor the existing bracket so progression is obvious at a glance.

- Render rounds as labeled columns ("Round of 16 → Quarterfinals → Semifinals → Final") with the round date range under the title.
- For each `MatchupCard`:
  - Highlight the winning team row (green left-border + check icon) and dim/strike the losing team row (red left-border + "Eliminated R{n}" pill).
  - Show team scores aligned right; show "vs" + "Pending" pill when both teams present but unscored, "BYE" when one slot is null, "TBD" when waiting on previous match.
  - Connector lines/arrows between a matchup and its `next_matchup_id` so the eye can follow the path. Implement with absolutely positioned SVG paths between card refs (no library).
- Add a small "Team path" legend chip on the tab header (advancing / eliminated / pending) so the color meaning is explicit.
- Mobile: keep columns horizontally scrollable; sticky round headers.

## 2. Team Leaderboard tab

New tab "Teams" backed by the existing `tournament_team_leaderboard` view, augmented with per-round breakdown.

- Header filter pills: **Overall** (default) | **By round** (dropdown of completed rounds).
- Overall mode: ranked list with rank, team logo+name, total score, catches, rounds won, status badge (Active / Eliminated R{n} / Champion).
- By-round mode: pulls the team's `team1_score`/`team2_score` from `tournament_matchups` for the selected round, sorted desc; shows opponent + W/L.
- Add a new SQL view `tournament_team_round_scores` (round_number, team_id, score, opponent_team_id, result) to avoid client-side join gymnastics.
- Click a team row → opens the existing TeamProfile route in a new tab.

## 3. MVPs tab

New tab "MVPs" listing the top contributor on the **winning team** of every completed matchup.

- Backed by a new view `tournament_matchup_mvps` joining `tournament_matchups` → `tournament_team_roster` → `catches` (filtered to the round's `start_at`/`end_at` window) → top contributor per matchup per `scoring_method`.
- Each row shows: round label, matchup #, MVP avatar+name, winning team, MVP score (with unit per scoring method), and an expandable section listing the catches that contributed (species, weight/length, caught_at, thumbnail) — fetched on demand.
- Sort: most recent round first; secondary sort by MVP score desc.

## 4. Real-time team match notifications

Server-side: extend `update-challenge-statuses` so when a matchup transitions to `completed`:

- Insert a `notifications` row for every member of both teams with type `tournament_matchup_completed` (title "Match complete", body "{TeamA} {scoreA} – {scoreB} {TeamB}").
- For the **losing** team's members: extra notification `tournament_team_eliminated` ("Your team was eliminated in {Round}").
- For the **winning** team's members: extra notification `tournament_team_advanced` ("Your team advances to {NextRound}") or `tournament_team_champion` if it's the final.
- Fire the existing `send-push-notification` edge function for each.

Client-side: extend `useNotifications` filter map so the three new types are surfaced in the notification center; add a small `useTournamentMatchAlerts` hook that subscribes to `tournament_matchups` UPDATEs filtered by tournaments the user participates in, plays the standard alert sound, and invalidates the bracket / standings queries.

## 5. Admin: scoring method & bracket format + recalculation

In `AdminTournaments`:

- Add an "Edit" action per tournament opening a dialog with `scoring_method` (biggest_catch / total_weight / most_catches) and `format` (single_elimination / double_elimination) selects, plus a "Recalculate bracket" button.
- Edits are only allowed when status is `upcoming` or `active` AND no matchup has scores yet (guarded both client-side and via an edge function check). Changing `format` after any matchup is scored is blocked with a clear toast.
- New edge function `recalculate-tournament-bracket` (admin-only via JWT + `has_role`):
  - Deletes existing `tournament_matchups` + `tournament_rounds` for the tournament.
  - Re-seeds participants per `seeding_method` and re-creates rounds + matchups for the new `format`.
  - For each already-completed round window, re-aggregates `catches` against the new `scoring_method` and rewrites `team1_score`/`team2_score`/`winner_team_id`, marking eliminations.
  - Returns a summary `{ rounds_created, matches_scored, winner_team_id }`.
- After success, invalidate all tournament queries and toast "Bracket recalculated".

## 6. Out of scope

- Manual per-match score override (separate request).
- Editing team rosters mid-tournament.
- Push notification copy localization.

## Files

**Migration**

- `supabase/migrations/<ts>_tournament_progression_views.sql` — `tournament_team_round_scores` view, `tournament_matchup_mvps` view, indices on `tournament_matchups(tournament_id, round_id)`.

**Edge functions**

- `supabase/functions/update-challenge-statuses/index.ts` — emit completed/advanced/eliminated/champion notifications + push.
- `supabase/functions/recalculate-tournament-bracket/index.ts` — new, admin-only recalculation.

**Frontend**

- `src/pages/app/TournamentDetail.tsx` — bracket connectors + winner/loser styling, new Teams/MVPs tabs with filters, MVP catch drill-down.
- `src/components/tournaments/BracketColumn.tsx` (new) and `BracketConnectors.tsx` (new) — extracted for clarity.
- `src/hooks/use-tournament-match-alerts.ts` (new) — realtime subscription + toast/sound + query invalidation.
- `src/hooks/use-notifications.ts` — register the three new notification types.
- `src/pages/admin/AdminTournaments.tsx` — Edit dialog (scoring method, format) + Recalculate action.
- `src/components/admin/TournamentEditDialog.tsx` (new) — form + recalculate trigger.

No changes to `src/integrations/supabase/types.ts` (auto-regenerated).