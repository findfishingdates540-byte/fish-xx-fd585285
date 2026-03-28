

# Refocus App: Fishing-First with Dating as Add-On

This is a major architectural shift across 4 areas. Here is the full plan broken into phases.

---

## Phase 1: Home Page = Feed + Weather

**What changes:**
- All users land on `/app/feed` regardless of account mode. `AppIndex` and `ComboDashboard` are retired.
- A compact weather bar is added to the top of the Feed page (above the stories row) showing current temp, conditions, and wind -- reusing the existing `useWeather` hook and profile coordinates.
- The `/app/dashboard` route is removed from `App.tsx`.

**Files:**
- `src/pages/app/AppIndex.tsx` -- always redirect to `/app/feed`
- `src/pages/app/Feed.tsx` -- add a slim weather strip at top
- `src/App.tsx` -- remove dashboard route
- `src/pages/app/ComboDashboard.tsx` -- delete (1,300-line file)
- `src/components/layout/BothHeader.tsx` -- delete or merge into FishingHeader
- `src/components/layout/ComboSharedHeader.tsx` -- delete

---

## Phase 2: Fishing Spots from Catch Logs

**What changes:**
- The Spots page becomes a **map-centric view** that plots markers from catches where the angler chose to share location.
- Remove the "Add a Spot" manual flow and the current pre-listed pier/dock spots.
- In the **Log a Catch** form, add a toggle: "Share this location on the Spots map?" (default off). When on, the catch's GPS coordinates become a public marker.
- Clicking a marker on the Spots map shows a popup with: species caught, weight, photo thumbnail, angler name, and date.
- The `catches` table already has `latitude`/`longitude` and `general_location`. A new boolean column `share_location` gates visibility.

**Database migration:**
```sql
ALTER TABLE catches ADD COLUMN IF NOT EXISTS share_location boolean DEFAULT false;
```

**Files:**
- `src/pages/app/Spots.tsx` -- rewrite to map-only view querying catches where `share_location = true`
- `src/components/catches/LogCatchForm.tsx` -- add share-location toggle
- `src/pages/app/AddSpot.tsx` -- delete
- `src/components/admin/AddSpotDialog.tsx`, `EditSpotDialog.tsx`, `ImportSpotsDialog.tsx` -- keep for admin but mark as legacy

---

## Phase 3: Separate Dating as an Add-On

**What changes:**
- Remove `both`/combo mode entirely from the codebase. The `account_mode` column stays but only holds `'fishing'` or `'dating'`.
- Dating is **not** in the main bottom nav. It becomes a separate section accessible from **Settings > Dating Profile** (18+ age-gated).
- When a user activates dating, their `account_mode` stays `'fishing'` but a new flag `dating_enabled` on their profile gates access to `/app/dating/*` routes.
- Dating gets its own layout shell (header with "Find Fishing Dates" logo, its own bottom nav with Discover/Likes/Matches/Messages).
- The main app bottom nav is fishing-only for everyone.

**Key changes:**
- `src/contexts/ActiveModeContext.tsx` -- simplify; remove `'both'` from `BaseAccountMode`, remove mode switching logic
- `src/components/layout/AccountSwitcherSheet.tsx` -- remove mode switching, keep avatar/profile link
- `src/components/layout/BottomNav.tsx` -- remove dating branch; always show fishing nav
- `src/components/layout/RouteGuard.tsx` -- update `DatingRoute` to check `dating_enabled` flag instead of account mode
- `src/App.tsx` -- nest dating routes under `/app/dating/*` with a dedicated layout
- `src/components/layout/AppLayout.tsx` -- remove combo logic

**Database migration:**
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dating_enabled boolean DEFAULT false;
```

---

## Phase 4: Logo Cleanup

**What changes:**
- Every place that uses `fishing-header-logo.png` switches to `logo.png` (the FishX logo). There are only 2 files importing it: `AppHeader.tsx` and `FishingHeader.tsx`.
- `dating-logo.png` ("Find Fishing Dates") stays but is restricted to the dating section layout only.
- `BothHeader.tsx` is deleted (from Phase 1), so its logo import goes away.
- Public pages (`PublicHeader`, `PublicFooter`, `Auth`, etc.) already use `logo.png` -- no changes.

**Files:**
- `src/components/layout/AppHeader.tsx` -- replace `fishingHeaderLogo` import with `logo`; remove `datingLogo` (dating gets its own header)
- `src/components/layout/FishingHeader.tsx` -- replace `fishingHeaderLogo` with `logo`

---

## Execution Order

1. **Phase 4** (logo cleanup) -- small, no risk
2. **Phase 1** (home = feed) -- retire dashboard
3. **Phase 3** (separate dating) -- biggest change, touches routing/auth/nav
4. **Phase 2** (spots from catches) -- requires migration + map rewrite

Each phase is independently deployable. I recommend tackling them in this order to minimize breakage.

---

## Technical Notes

- The `ComboDashboard.tsx` file is ~1,300 lines. Deleting it removes significant complexity.
- The `ActiveModeContext` will be greatly simplified -- no more `activeMode`, `effectiveMode`, or `isComboUser`. Just a single fishing mode with an optional `dating_enabled` flag.
- The account switcher sheet transforms from a mode-picker into just a profile link.
- Existing catches without `share_location` default to `false`, so no existing data leaks onto the map.

