## Plan: Angler/Catch Details, Map Fix, Video Capture

Three client requests to address. Skipping the invoice part as instructed.

---

### 1. "Click on the angler and get details on the fish, pictures, techniques"

**Current behavior:** On `SpeciesLeaderboard.tsx` (line 268) and `Leaderboard.tsx`, clicking an angler row navigates to their full user profile (`/app/u/:userId`). The client wants the **catch behind that ranking** instead — the actual fish photo, weight/length, location, bait/gear/technique notes.

`**CatchDetail.tsx` already exists** at route `/app/catches/:catchId` and renders a rich view (cover photo, gallery, angler card, stats, notes). We just aren't routing to it from the leaderboard.

**Changes:**

- `**src/pages/app/SpeciesLeaderboard.tsx**` — change the row `onClick` to navigate to `/app/catches/${entry.largest_catch_id}` when `largest_catch_id` exists; fall back to user profile when null. Add a small "View angler profile" link inside the catch detail header (already there).
- `**src/pages/app/Leaderboard.tsx**` — same treatment on the "Top by Species" cards and "Latest Verified" spotlight: clicking the catch thumbnail/card opens `CatchDetail`.
- `**CatchDetail.tsx` enhancement** — add a "Techniques & Gear" section that surfaces `bait_used`, `gear_used[]` and `notes` more prominently (currently notes shows but bait/gear are buried). Add a "View all this angler's catches" CTA at the bottom.

---

### 2. "It didn't put the catches on the fish map"

**Root cause:** The Spots map (`src/pages/app/Spots.tsx` line 89) only renders catches where `share_location = true` AND `location_lat/lng` are not null. But `LogCatchForm.tsx` defaults `share_location: false` (line 74) and **never writes `location_lat` / `location_lng` to the DB** — the live-camera capture returns GPS in `CaptureMetadata` but the form discards it; the insert in `Catches.tsx` (lines 152–168) omits both lat/lng.

**Changes:**

- `**src/components/catches/LogCatchForm.tsx**`:
  - Add `location_lat: number | null` and `location_lng: number | null` to `formData` and `LogCatchFormData`.
  - In `handleTrophyCapture`, store `data.locationLat` / `data.locationLng` into form state.
  - Default `share_location` to `**true**` (with the existing toggle still allowing private). Most users expect their catches on the community map.
  - Show captured GPS confirmation chip ("📍 GPS captured: 41.2°, -73.4°") under the trophy photo so users know it worked.
- `**src/pages/app/Catches.tsx**` — include `location_lat` and `location_lng` in the `supabase.from("catches").insert(...)` payload.
- `**src/pages/app/Spots.tsx**` — invalidate the `shared-catches-map` query after a successful catch log (use `useQueryClient` in `Catches.tsx` and call `invalidateQueries`) so newly logged catches appear immediately when the user opens the map.
- **Marker click** — currently opens an inline detail panel. Add a "View full details" button in that panel that routes to `/app/catches/:catchId`, completing the loop with request #1.

---

### 3. "Can you put a video camera on there too — record video while catching fish"

Add a video capture option in 2k definition for log a catch so users can capture the moments of them making a catch

**Changes:**

- **New component `src/components/ui/live-video-capture.tsx**` — mirrors `LiveCameraCapture`'s pattern but uses `<input type="file" accept="video/*" capture="environment">`. Captures GPS + timestamp the same way (no watermark for video — too heavy client-side; we'll store metadata in DB instead).
- **DB migration** — add nullable column `video_url text` to `catches` table.
- **Storage** — reuse `catch-photos` bucket (rename mentally to "catch-media") OR create new `catch-videos` bucket with same RLS (`{user_id}/` prefix). Recommend reusing `catch-photos` to avoid bucket sprawl; videos are still user-owned media. **Decision:** reuse `catch-photos`.
- `**LogCatchForm.tsx**` — add a third capture slot under "Verification Photo" labeled **"Action Video (Optional)"** with the new component. 
- `**Catches.tsx**` — upload video file to storage and write `video_url` on insert.
- `**CatchDetail.tsx**` — render `<video controls playsInline>` above the photo gallery when `video_url` is present, with a "▶ Play action clip" overlay.
- `**Spots.tsx` marker panel** — show a small ▶ video badge on markers whose catch has a video.

---

### Technical notes

- **Routing:** `CatchDetail` already exists; no new routes needed.
- **GPS source of truth:** Live-camera capture sets lat/lng. If user uses datetime override, we keep the captured GPS untouched.
- **Privacy:** `share_location` toggle still controls map visibility. If user unchecks it, lat/lng are still stored for their own records but excluded from the public map query (already enforced).
- **Backwards compatibility:** Existing catches without lat/lng will continue to be invisible on the map — that's expected; new logs will appear.
- **Performance:** Videos are heavy; we'll set `preload="metadata"` on the `<video>` tag and lazy-load on `CatchDetail` only.

### Files touched

- `src/components/catches/LogCatchForm.tsx` (lat/lng + video field + share default true)
- `src/pages/app/Catches.tsx` (insert lat/lng + video_url; invalidate map query)
- `src/pages/app/Spots.tsx` (invalidation hook + marker panel "View details" CTA + video badge)
- `src/pages/app/SpeciesLeaderboard.tsx` (route to CatchDetail)
- `src/pages/app/Leaderboard.tsx` (route to CatchDetail from species + verified cards)
- `src/pages/app/CatchDetail.tsx` (video player + techniques/gear section + angler profile CTA)
- `src/components/ui/live-video-capture.tsx` (new)
- DB migration: `ALTER TABLE catches ADD COLUMN video_url text;`