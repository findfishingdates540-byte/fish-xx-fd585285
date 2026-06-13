## Goal
Joshua finds the leaderboard "hard to understand" — driven by three stacked rows of filter chips (Timeframe + 8 Methods + 3 Waters = 14 chips) competing for attention above a near-empty board. Collapse them into a single, scannable filter bar.

## New filter layout (one row)
```text
[ All-Time ▼ ]   [ Method: All ▼ ]   [ Water: All ▼ ]      Reset
```

- **Timeframe** — compact `Select` dropdown (All-Time / This Year / This Month). Default shown inline.
- **Method** — `Select` dropdown with the same 8 options (All Methods, Land-Based, Surf, Kayak, Pier/Jetty, Flats/Skiff, Offshore, Charter).
- **Water** — `Select` dropdown (All Water / Freshwater / Saltwater).
- **Reset** link appears only when any filter is non-default; clears all three back to "All".
- Wraps cleanly on mobile (each select takes ~1/2 width, Reset drops below).

## Why dropdowns instead of chips
- 14 chips across 3 rows = 3× the vertical space and a wall of options before any data.
- Dropdowns shrink the filter bar to a single line (~40 px) so the actual ranking is the first thing the eye lands on.
- Each selected value still reads in plain English ("Method: Kayak"), so the active filter is obvious without scanning chips.

## What stays the same
- Underlying query, scoring, ranking, and data fetching — no business-logic changes.
- "How scoring works →" link in the header.
- Empty state copy.
- Same component lives in the Leaderboard page and mobile Scoreboard Hub bottom sheet.

## Files touched
- `src/components/leaderboard/PointsLeaderboard.tsx` — replace the three `TabRow` rows with a single `FilterBar` using shadcn `Select`; remove the now-unused `TabRow` helper.

## Out of scope (per admin's note "just hard to understand")
- No changes to Team Rankings layout, scoring math, or column labels.
- No empty-state redesign.
