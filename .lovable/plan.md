## Team-based tournament mechanics

Make tournaments truly team-vs-team with proper aggregation, leaderboards, and an MVP view.

### 1. Schema changes (migration)

`tournament_matchups`:
- Add `team1_id uuid` and `team2_id uuid` (FK → `fishing_teams`, nullable for backfill).
- Keep `player1_id` / `player2_id` as optional "match MVP" slots.
- Add `team1_score numeric default 0`, `team2_score numeric default 0`, `winner_team_id uuid`.

`tournaments`:
- Add `winner_team_id uuid` (alongside existing `winner_id`, which becomes "MVP captain").

New view `tournament_team_leaderboard` (per tournament, cumulative):
- team_id, team_name, logo, total_score, catches_count, rounds_won, eliminated.

New view `tournament_member_contributions` (per tournament, per member within team):
- tournament_id, team_id, user_id, display_name, catches, score_contribution.

New view `tournament_mvp_leaderboard` (per tournament, across all teams):
- tournament_id, user_id, display_name, team_id, team_name, total_score, catches.

All views: SECURITY INVOKER, readable by any authenticated user.

### 2. Scoring engine (edge function update)

Update `update-challenge-statuses` (and add a helper edge function `score-tournament-matchup` callable on demand):

For each `in_progress` tournament with active matchups whose round window has elapsed:
1. For each matchup, fetch all `team_members` (+ captain) of `team1_id` and `team2_id`.
2. Aggregate `catches` between `round.start_at` and `round.end_at` per the tournament's `scoring_method`:
   - `biggest_catch` → MAX(weight_lbs)
   - `total_weight` → SUM(weight_lbs)
   - `most_catches` → COUNT(*)
3. Write `team1_score`, `team2_score`, `winner_team_id`, advance to `next_matchup_id` (set the next slot's `team1_id` or `team2_id`).
4. Mark losing team's participants `eliminated = true, eliminated_in_round`.
5. When the final matchup completes → set `tournaments.winner_team_id`, derive `winner_id` = top contributor on winning team (MVP).

Prize payout logic stays — just notify all members of `winner_team_id` (already partially done).

### 3. Frontend — TournamentDetail

Add three tabs below the bracket:
- **Bracket** (existing) — show team names + logos in matchup cards instead of player names.
- **Team leaderboard** — uses `tournament_team_leaderboard`, shows rank, team logo/name, score, rounds won, eliminated badge.
- **MVP leaderboard** — uses `tournament_mvp_leaderboard`, shows top individuals across all teams.
- **My team** (only if viewer is on a registered team) — uses `tournament_member_contributions` to show each teammate's contribution.

### Files

- New migration: matchup team columns + tournament `winner_team_id` + 3 views.
- Edited: `supabase/functions/update-challenge-statuses/index.ts` (scoring loop).
- Edited: `src/pages/app/TournamentDetail.tsx` (3 new tabs, team-aware bracket cards).
- `src/integrations/supabase/types.ts` regenerates automatically after migration.

### Out of scope

- Live in-tournament catch logging UI changes (catches are already attributed to user; aggregation is done server-side by team membership).
- Manual admin override of team scores (can be added later in `AdminTournaments`).
