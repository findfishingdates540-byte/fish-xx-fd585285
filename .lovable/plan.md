

# Fishing Leaderboard & Challenge System

## Summary

Add a competitive ranking system where anglers are scored per species (largest catch, most caught), with detailed catch profiles (cover photo + measurement photo, harvest/release status), searchable species leaderboards, earned badges, and time-bound fishing challenges. This is a large feature spanning new database tables, new pages, and updates to the existing catch logging flow.

## Database Changes

### New Tables

1. **`catch_photos`** -- Separate photo types per catch
   - `id`, `catch_id` (FK catches), `photo_url`, `photo_type` (enum: `cover`, `measurement`, `general`), `created_at`

2. **`leaderboard_entries`** -- Materialized/cached ranking data per species
   - `id`, `user_id`, `species_id`, `species_name`, `total_caught` (int), `total_released` (int), `total_harvested` (int), `largest_weight_lbs`, `largest_length_in`, `largest_catch_id` (FK catches), `rank_by_weight` (int), `rank_by_count` (int), `updated_at`
   - Unique constraint on `(user_id, species_id)`

3. **`angler_badges`** -- Earned achievement badges
   - `id`, `user_id`, `badge_type` (text, e.g. `first_catch`, `100_club`, `species_master`, `big_game`), `badge_name`, `badge_description`, `species_id` (nullable), `earned_at`, `metadata` (jsonb)

4. **`fishing_challenges`** -- Admin/user-created challenges
   - `id`, `title`, `description`, `challenge_type` (enum: `largest_fish`, `most_caught`, `species_specific`, `team`), `species_id` (nullable), `target_species_name` (nullable), `start_date`, `end_date`, `status` (active/completed/upcoming), `created_by`, `is_official` (bool), `rules` (jsonb), `prizes` (jsonb), `created_at`

5. **`challenge_participants`** -- Who joined a challenge
   - `id`, `challenge_id` (FK), `user_id`, `team_id` (nullable FK), `score` (numeric), `rank` (int), `best_catch_id` (FK catches, nullable), `joined_at`

6. **`fishing_teams`** -- Optional team groupings
   - `id`, `name`, `description`, `skill_level` (uses existing `fishing_experience` enum), `captain_id` (user), `logo_url`, `created_at`

7. **`team_members`** -- Team roster
   - `id`, `team_id` (FK), `user_id`, `role` (captain/member), `joined_at`

### Modify Existing `catches` Table

Add columns:
- `catch_status` (text, default `'released'`) -- `harvested` or `released`
- `cover_photo_url` (text, nullable) -- Primary display photo
- `measurement_photo_url` (text, nullable) -- Photo showing weight/measurement
- `general_location` (text, nullable) -- e.g. "Lake Erie", "Port Canaveral" (privacy-safe)
- `is_verified` (bool, default false) -- Admin can verify catches for leaderboard integrity

### DB Functions

- `refresh_leaderboard_entries(p_species_id uuid)` -- Recalculates rankings for a species after a catch is logged/updated/deleted
- `check_and_award_badges(p_user_id uuid)` -- Checks badge criteria and awards new ones
- `get_species_leaderboard(p_species_id uuid, p_sort_by text, p_limit int)` -- Returns ranked anglers for a species

## New Pages & Routes

1. **`/app/leaderboard`** -- Main leaderboard hub
   - Species search/filter bar at top
   - Tabs: "Largest Catch" | "Most Caught" | "Challenges"
   - Each species card shows top 3 anglers with photos
   
2. **`/app/leaderboard/species/:speciesId`** -- Species-specific scoreboard
   - Two ranking tables: Largest (by weight) and Most Caught (by count)
   - Each row: rank, angler name/avatar, weight/count, general location, date
   - Click row to see full catch detail

3. **`/app/leaderboard/angler/:userId`** -- Angler profile/rankings page
   - All species they've caught with their rank in each
   - Badge showcase
   - Catch history timeline with photos

4. **`/app/challenges`** -- Active/upcoming challenges list
   - Cards showing challenge details, participants, time remaining
   - Join button

5. **`/app/challenges/:challengeId`** -- Challenge detail + live leaderboard

## Catch Logging Updates

Update the existing catch form in `Catches.tsx`:
- Add **cover photo** and **measurement photo** upload fields (distinct from general photos)
- Add **harvest/release** toggle
- Add **general location** text field (port/river/lake name) -- distinct from exact GPS
- After successful catch log, trigger `refresh_leaderboard_entries` and `check_and_award_badges`

## Badge System

Award badges automatically based on criteria:
- **First Catch** -- Log your first catch
- **Species Collector** -- Catch 10+ different species
- **Century Club** -- 100 total catches
- **Big Game Hunter** -- Catch a fish over 50 lbs
- **Release Champion** -- Release 50+ fish
- **Top Angler** -- Rank #1 for any species
- **Challenge Winner** -- Win a fishing challenge

## Navigation

- Add "Leaderboard" (Trophy icon) to the fishing bottom nav items
- Add "Challenges" as a sub-section or tab within leaderboard

## Moderation

- Admin can mark catches as `is_verified` for leaderboard integrity
- Admin can flag/remove suspicious entries via existing admin panel
- Add `AdminLeaderboard` page under `/admin/leaderboard` for oversight

## RLS Policies

- Leaderboard entries: public read, system-managed write
- Challenges: public read, admin create/update, authenticated join
- Teams: members can read, captain can update, authenticated create
- Badges: owner can read, system insert only

## Implementation Order

This is a 3-4 round implementation:

**Round 1 -- Database + Catch Updates:**
- Migration: new tables + catches column additions
- Update catch logging form (cover/measurement photos, harvest/release, general location)
- Create `refresh_leaderboard_entries` DB function

**Round 2 -- Leaderboard Pages:**
- Species leaderboard page with search and rankings
- Angler ranking profile page
- Catch detail view with photos
- Add leaderboard to navigation

**Round 3 -- Badges + Challenges:**
- Badge award system and display
- Challenge CRUD and participation
- Challenge leaderboards
- Admin moderation page

**Round 4 -- Teams + Polish:**
- Team creation and management
- Team-based leaderboards
- UI polish, animations, mobile optimization

