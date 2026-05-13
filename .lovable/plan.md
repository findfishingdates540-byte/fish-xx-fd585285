# Three client-feedback fixes

## 1. Social sharing for posts & catches

Add a **Share** button on catch detail (`CatchDetail.tsx`) and on the feed post viewer.

A new `ShareToSocial` component opens a sheet with:
- **Native share** (Web Share API — picks up Facebook, Instagram, TikTok, WhatsApp, etc. installed on the phone). Used on mobile / Capacitor.
- **Facebook** — opens `https://www.facebook.com/sharer/sharer.php?u=<url>` in a new tab.
- **X / Twitter** — `https://twitter.com/intent/tweet?...`
- **WhatsApp** — `https://wa.me/?text=...`
- **Copy link** + **Download photo** (fallback for Instagram & TikTok which do not accept direct web URL sharing).

Honest UX note in the sheet: "Instagram and TikTok don't allow direct web sharing — download the photo, then post it from their app."

URLs shared point at public detail routes:
- catch → `https://<app-url>/app/catches/<id>`
- post → `https://<app-url>/app/feed?post=<id>`

## 2. Scoreboard: measurement / date / location + privacy toggle

**Why columns are empty today:** `refresh_leaderboard_entries` only sets `largest_catch_id` when a catch has a weight. Most catches have no weight logged → `largest_catch_id` is null → date & location fall back to `—`.

**Fix in DB function** (`refresh_leaderboard_entries`): if no weighted catch exists for a (user, species) pair, fall back to that user's **most recent** catch of that species so we always have a `largest_catch_id` to display.

**Per-catch location privacy:** add a `hide_location` boolean to `catches` (default `false`). UI:
- Toggle in the Log Catch form: "Hide exact location publicly"
- Toggle on the catch detail page (owner only)
- Scoreboard reads `hide_location` and renders **"Private"** instead of the city when true.
- Public spot map / feed already uses `general_location`; when `hide_location` is true we suppress that string and the lat/lng stays excluded from the public surface.

Run a one-off `SELECT refresh_leaderboard_entries();` after deploying the function so existing rows are backfilled.

## 3. Scoreboard row → catch detail (not profile)

Already wired in `SpeciesLeaderboard.tsx` to navigate to `/app/catches/<largest_catch_id>` when present. Once fix #2 backfills `largest_catch_id` for every entry, every row will route to the catch detail page (with photo + measurement + species + angler link). Profile is reachable from the catch detail page via the angler avatar — no change needed there.

## Files touched

- `supabase/migrations/...` — add `hide_location` column + updated `refresh_leaderboard_entries` function.
- `src/components/share/ShareToSocial.tsx` — new share sheet.
- `src/pages/app/CatchDetail.tsx` — Share button + privacy toggle for owner.
- `src/pages/app/LogCatch.tsx` (or current catch-create form) — `hide_location` checkbox.
- `src/pages/app/SpeciesLeaderboard.tsx` — show "Private" when `hide_location`.
- Feed post viewer — Share button hookup.

## Out of scope

- Auto-cross-posting from the server to FB / IG / TikTok (would need each platform's OAuth + business account approval — large separate project).
