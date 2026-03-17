

## Audit: Competitive Scoreboard System Completion Status

### What's Done

| Feature | Status | Notes |
|---------|--------|-------|
| Ranked leaderboards per species (largest fish, most caught) | **Done** | `SpeciesLeaderboard` page supports sorting by weight and count, with rank display |
| Log catches with cover photo + measurement photo | **Done** | `LogCatchForm` captures both `coverPhoto` and `measurementPhoto`, stored as `cover_photo_url` / `measurement_photo_url` |
| Harvest/release status on catches | **Done** | `catch_status` field with "released" / "harvested" values, shown as badges |
| Timestamps on catches | **Done** | `caught_at` field captured and displayed |
| Search by species and browse rankings | **Done** | Leaderboard hub has species search; Species Explorer has full directory with search and category filters |
| Full catch details page | **Done** | `CatchDetail` page shows weight, length, species, time, tackle, angler sidebar, social actions |
| General location (port/river/lake) instead of exact coordinates | **Done** | `general_location` field shown on catches; exact lat/lng hidden from public views |
| Compete in fishing challenges | **Done** | `Challenges` page with live/upcoming/completed tabs, join functionality, create challenge dialog, countdown timers |
| Team-based leaderboards by skill level | **Partial** | Team Rankings section exists on Leaderboard page with Pro/Intermediate/Beginner tabs, but **Season Points** and **Last 7 Days** columns show "—" (placeholder dashes). No actual scoring/points system is computed for teams. |

### What's Missing / Incomplete

1. **Team scoring system**: The team rankings table displays teams filtered by skill level but has no actual score calculation. "Season Points" and "Last 7 Days" both show dashes. Need to aggregate `catches` or `leaderboard_entries` data for team members to compute real team scores.

2. **Team member catch aggregation**: The `team_members` table is queried for member counts, but no query aggregates catches by team members to produce a team score or ranking.

### Plan: Complete Team-Based Leaderboard Scoring

**Step 1 -- Create a DB function to compute team scores**
- Write a SQL function `get_team_scores(skill_level)` that joins `fishing_teams` -> `team_members` -> `catches` to aggregate total catches, total weight, and recent (last 7 days) catches per team.

**Step 2 -- Update Leaderboard.tsx team rankings section**
- Replace the placeholder dashes with real data from the new function or a combined query.
- Show "Season Points" as total catch weight or count, and "Last 7 Days" as recent catch count.
- Sort teams by their computed score descending.

This is the only gap remaining. All other 8 features from the checklist are fully implemented and interconnected.

