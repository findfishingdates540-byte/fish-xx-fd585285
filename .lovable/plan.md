## Fish-X IGFA Scoring System — Implementation Plan

The PDF defines a multi-factor angler scoring system. Rolling it out cleanly in one pass; broken into 5 phases that can be merged together.

### Phase 1 — Database foundation

Add to `fish_species`:
- `base_score` int (1–10)
- `category` text (`billfish`, `tuna_pelagic`, `reef_bottom`, `inshore_saltwater`, `shark`, `bass`, `trout_salmon`, `exotic_freshwater`, `catfish`, `international_exotic`)
- `water_type` text (`saltwater` | `freshwater`)
- `measurement_type` text (`TL` | `FL` | `LJFL`)
- `safe_release` bool (no measure required)
- `trophy_quality`, `trophy_trophy`, `trophy_exceptional` numeric + `trophy_unit` text (`in` | `lb` | `ft`)

New reference tables (admin editable):
- `scoring_catch_methods` (key, label, multiplier) — Shore 1.30 → Charter 0.85
- `scoring_trophy_bonuses` (level, bonus) — Quality +0.5, Trophy +1, Exceptional +2
- `scoring_variety_milestones` (species_count, bonus)
- `scoring_streak_bonuses` (type, bonus)
- `scoring_tournament_multipliers` (type, multiplier)

Add to `catches`:
- `catch_method` text (one of the 7 methods)
- `is_estimated_size` bool (for safe-release species)
- `trophy_level` text (`keeper` | `quality` | `trophy` | `exceptional`)
- `computed_score` numeric (denormalized)

Trigger / SQL function `public.compute_catch_score(catch_id)` recomputes on insert/update of relevant fields.

Seed all species + scores from the PDF (≈110 species). Existing rows matched by lowercase name, missing rows inserted.

### Phase 2 — Capture UX

`LogCatchForm`:
- Add Catch Method selector (radio chips with multiplier shown).
- For safe-release species, swap exact length/weight inputs for a size-class picker (Quality / Trophy / Exceptional) + estimate toggle.
- Show live computed score preview ("Score: 11.7 pts").

### Phase 3 — Public Rules & Scoreboard hub

New page `/app/scoring-rules` linked from the Scoreboard sheet:
- Formula explainer, method multipliers, trophy bonuses, variety + streak ladders.
- Searchable species table (category filter) showing base score, measurement type, trophy thresholds, safe-release badge.

### Phase 4 — Leaderboard variants

Extend `Leaderboard` page with tabs:
- Overall, Monthly, Yearly, Species Diversity, Streaks
- Land-Based, Kayak, Offshore, Freshwater, Saltwater, Junior
Each tab queries an aggregated view filtered by `catch_method` / `water_type` / age group.

### Phase 5 — Admin

Extend `AdminFishSpecies` with the new columns (score, category, thresholds, safe-release).
New `AdminScoringSettings` page to tune method multipliers, trophy bonuses, variety + streak ladders, tournament multipliers — all driven by the reference tables above.

### Technical notes

- All numeric scoring config lives in DB tables so admins can tune without code changes.
- `compute_catch_score` is the single source of truth; UI just displays `catches.computed_score`.
- Variety + streak bonuses are computed in a `user_scoring_totals` view (sum of catch scores + milestone/streak bonuses) — recomputed on read for now.
- IGFA measurement standards (TL/FL/LJFL) shown contextually in LogCatchForm and on the Rules page.

### Out of scope this round

- AI species recognition / duplicate detection / fraud detection.
- Tournament-system rewiring (will plug new multiplier table into existing tournament scoring in a follow-up).
- Achievement badges (data model only; surfacing them comes later).

### Suggested merge order

1. Phase 1 migration (must approve first — it adds many columns + seeds ~110 species).
2. Phase 2 + 3 in one pass (capture + read).
3. Phase 4 + 5 in a follow-up pass.

Do you want me to proceed with Phase 1's migration now?
