I’ll fix the scoring and catch-log issues end-to-end instead of only patching the display.

## What I found

- Julie has 3 verified catches, but all have `computed_score = 0`.
- The “Global Top Anglers” widget is using a separate shortcut formula: `verified catches × 10`, so Julie shows 30 there.
- The full “Points Leaderboard” uses `catches.computed_score`, so Julie shows 0 there.
- Existing species names like `Bass, Largemouth`, `Catfish, Channel`, and `Tuna, Blackfin` do not match the seeded scoring names like `Largemouth Bass`, `Channel Catfish`, and `Blackfin Tuna`, so their `base_score` is missing.
- Harlie Daniels’ catch is currently not verified, so it should not count as a verified catch until approved/verified.
- Team rankings show `NaN pts` because `get_team_scores()` returns `total_score`, but the leaderboard UI expects `season_points`.
- Challenge scoring recalculation currently counts public catches by date/species, but does not consistently require approved/verified catches.
- Buddy profiles already load recent catches, but the UI only shows 6 recent catches and the cards are not clearly a catch-log view.

## Implementation plan

1. **Repair scoring data and future score calculation**
   - Add a database migration to normalize alternate species names used by the imported data.
   - Backfill `fish_species.base_score`, `category`, `water_type`, and measurement fields for common alternate formats like `Bass, Largemouth`, `Catfish, Channel`, `Tuna, Blackfin`.
   - Update existing catches so missing `catch_method` defaults to a valid method and missing `trophy_level` defaults to `keeper`.
   - Recompute `computed_score` for all existing catches with a species.

2. **Make leaderboard scoring consistent**
   - Change the “Global Top Anglers” widget and full global rankings to use the same score source as the Points Leaderboard.
   - Keep verified catch counts visible, but do not calculate points as `catch count × 10` in one place and `computed_score` in another.
   - Keep non-verified catches out of points totals.

3. **Fix team rankings `NaN`**
   - Update the leaderboard UI to read the actual returned fields (`total_score`, `catch_count`) or update the database function aliases so the app receives `season_points` and `last_7_days_catches` consistently.
   - Add safe numeric fallbacks so missing values display as `0 pts`, never `NaN pts`.

4. **Fix fish challenge scoring**
   - Update the challenge score recalculation function to count only catches that are `is_verified = true` and `approval_status = approved`.
   - Recalculate all current challenge participants after the function update.
   - Ensure approved competition catches trigger leaderboard/challenge recalculation after approval.

5. **Improve buddy profile catch log access**
   - Make buddy/user profile catch cards clickable to open catch details.
   - Add a clear “Catch Log” section that can show more than the latest 6 public catches.
   - Keep privacy intact by only showing catches allowed by existing RLS/public visibility rules.

6. **Validate with current problem users**
   - Re-check Julie and Harlie/Charlie rows after migration.
   - Confirm Julie’s score is consistent across Global Top Anglers, full Points Leaderboard, and profile catch log.
   - Confirm Team Rankings no longer show `NaN`.
   - Confirm unverified catches do not count until approved.