

# Change Team Filters to Category-Based

Replace the current skill-level filters (All / Pro / Mid / Beginner) with category-based filters matching the image: **All / Teams / Women / Jr. Anglers**.

## Database Changes

**Migration**: Add a `category` column to `fishing_teams`:
```sql
ALTER TABLE fishing_teams ADD COLUMN category text NOT NULL DEFAULT 'teams';
```
Valid values: `'teams'`, `'women'`, `'jr_anglers'`. No enum needed -- simple text column with sensible default.

Update existing seed data to spread across categories.

## Frontend Changes

**`src/pages/app/Teams.tsx`**:
- Replace `skillFilter` state with `categoryFilter` (`'all' | 'teams' | 'women' | 'jr_anglers'`)
- Update tab triggers: All / Teams / Women / Jr. Anglers
- Filter logic: match `t.category` instead of `t.skill_level`
- Remove `skillLabel` and `skillColor` helpers (or repurpose them for category badges)
- Update category badge display on cards (e.g. "Women", "Jr. Anglers", "Teams")

**`src/pages/app/CreateTeam.tsx`**: Replace the skill level selector with a category selector (Teams / Women / Jr. Anglers).

**`src/components/layout/BottomNav.tsx`**: No changes needed -- Teams is already accessible via the Scoreboard Hub sheet.

**`get_team_scores` function**: Currently accepts `p_skill_level fishing_experience`. Will be updated to accept a `p_category text` parameter and filter by `ft.category` instead of `ft.skill_level`.

## Files to Edit
1. New migration SQL -- add `category` column, update `get_team_scores`
2. `src/pages/app/Teams.tsx` -- swap filter logic and labels
3. `src/pages/app/CreateTeam.tsx` -- swap skill selector for category selector
4. Seed migration update -- set categories on existing teams

