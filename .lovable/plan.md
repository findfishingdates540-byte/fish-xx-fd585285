

## End-to-End Audit Results

After reviewing the database schema, RLS policies, SQL functions, and frontend code, here is what is working and what needs fixing:

### Working Correctly
- **Species leaderboards** -- dual ranking (weight/count), search, pagination
- **Catch logging** -- cover photo, measurement photo, harvest/release, timestamps, general location
- **Catch detail page** -- full metrics, social actions, angler sidebar
- **Challenges system** -- create (with banner upload), join, live countdown, tabs (live/upcoming/completed)
- **Leaderboard hub** -- featured species, global top anglers, team rankings with live RPC data
- **Teams** -- create with logo upload, team profile page with stats, member list
- **Leaderboard refresh** -- `refresh_leaderboard_entries` function exists and works
- **Unique constraints** -- `challenge_participants(challenge_id, user_id)` and `team_members(team_id, user_id)` both have unique indexes (prevents double joins)

### Issues Found

#### 1. Members cannot leave teams (RLS bug)
The `team_members` table only has a DELETE policy for **captains**. Regular members calling `leaveMutation` (which does `supabase.from("team_members").delete()`) will get a silent RLS denial. Need to add a policy allowing users to delete their own membership row.

#### 2. Challenge banner not displayed on challenge cards
The `CreateChallenge` page uploads a banner and stores the URL inside `prizes.banner_url` (jsonb), but the `Challenges.tsx` card components (`LiveChallengeCard`, `UpcomingChallengeCard`, `CompletedChallengeCard`) never read or render `prizes.banner_url`. The cards show plain gradient backgrounds instead of the uploaded banner image.

#### 3. `get_team_scores` uses `c.created_at` instead of `c.caught_at` for "Last 7 Days"
The SQL function filters recent catches by `c.created_at >= now() - interval '7 days'` but should use `c.caught_at` to reflect when the fish was actually caught, not when the record was inserted.

#### 4. Captain's catches excluded from team scores
The `get_team_scores` function only joins `team_members` to `catches`, but the captain may not always be in `team_members` (they are inserted as a member during creation, so this should be fine in practice -- the `CreateTeam` page does insert the captain as a team_member). No action needed.

### Plan

**Step 1 -- Database migration: Fix RLS + team scores function**
- Add a DELETE policy on `team_members`: `Users can leave teams` allowing `(SELECT auth.uid()) = user_id`
- Recreate `get_team_scores` to use `c.caught_at` instead of `c.created_at` for the 7-day filter

**Step 2 -- Display challenge banners on challenge cards**
In `src/pages/app/Challenges.tsx`, extract `prizes.banner_url` from the challenge data and render it as a background image in `LiveChallengeCard`, `UpcomingChallengeCard`, and `CompletedChallengeCard` (falling back to the gradient when no banner exists).

### Technical Details

```sql
-- Fix 1: Allow members to leave teams
CREATE POLICY "Members can leave teams"
ON public.team_members
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Fix 2: Use caught_at for 7-day filter
CREATE OR REPLACE FUNCTION public.get_team_scores(p_skill_level fishing_experience)
RETURNS TABLE(...) AS $$
  -- same query but with c.caught_at >= now() - interval '7 days'
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

For challenge banners, the enriched challenge object already has `prizes` parsed. Add:
```typescript
bannerUrl: typeof prizes === "object" && prizes?.banner_url ? String(prizes.banner_url) : null
```
Then in each card component, replace the gradient `div` with a conditional `img` tag.

