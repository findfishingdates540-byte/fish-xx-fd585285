## Goal
Restructure `src/pages/app/ChallengeDetail.tsx` so the page mirrors the Tournament Detail layout: a sticky header (banner + countdown + stats + join CTA + My Standing) followed by a tabbed body. All existing data and queries stay; we just reorganize and add a couple of new panes specific to challenges (no brackets/teams — challenges are individual).

## Tabs

```text
[ Leaderboard ] [ Participants ] [ Activity ] [ Rules ] [ About ]
```

1. **Leaderboard** (default)
   - Existing ranked list with `formatScore`, "Verified only" badge, metric label ("by Weight" / "by Catches").
   - Top‑3 podium strip at the top (1st centered, 2nd left, 3rd right) for `active`/`completed`.
   - Empty state when no entries.

2. **Participants**
   - Grid of all registered anglers (avatar, display name, joined date, current score).
   - Shows count `${participants.length}${maxParticipants ? "/" + maxParticipants : ""}` in tab badge.
   - Click → `/app/profile/:userId`.
   - Empty state when nobody's joined.

3. **Activity**
   - The existing "Recent verified catches" feed, expanded (limit 25 instead of 10), with infinite/load‑more later if needed.
   - Hidden/empty‑state when `status === "upcoming"` (no catches possible yet).
   - Each row links to `/app/catches/:id`.

4. **Rules**
   - Existing `FormattedRules` block, plus a small "Scoring" summary derived from `challenge_type`:
     - `largest_fish` → "Heaviest single verified catch wins."
     - `most_caught` → "Most verified catches during the window."
     - `most_species` → "Most distinct verified species."
     - `total_weight` → "Highest cumulative verified weight."
   - "Verified only" reminder badge.

5. **About**
   - Description text + meta (species, location, dates, prize pool, entry fee, max participants, organizer if available).

## Sticky header (always visible above tabs)
Keep current banner card, countdown, 4 stats, Join/Leave button, and the "My standing" card. Move "Recent activity" and "Leaderboard" out of the main scroll into the tabs.

## Implementation notes
- Use shadcn `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` like `TournamentDetail.tsx` does, matching its className conventions (scoreboard styling).
- Persist active tab in URL via `?tab=leaderboard|participants|activity|rules|about` using `useSearchParams` (same pattern as TournamentDetail).
- Reuse all existing queries; no new tables. Bump `recentCatches` limit to 25 and gate by tab visibility (still fetch eagerly — small payload).
- Keep all existing logic for join/leave/share/payment redirect untouched.
- Extract small helpers (`Podium`, `ParticipantsGrid`, `ActivityList`, `ScoringSummary`) within the same file to keep it readable; no new files needed unless it exceeds ~750 lines.

## Out of scope
- No brackets, teams, or matchup pages (challenges are individual).
- No schema changes.
- No changes to admin / list pages.
