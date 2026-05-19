# Catch Verification, Comments & Full Photo View

Three connected upgrades to the catch system so judges can validate entries, the community can react, and a full record of each catch is visible.

## 1. Verification (judge-only, gates the scoring system)

The `catches` table already has `is_verified boolean` but nothing sets it and the leaderboard counts every catch. We will:

- **Admin (AdminCatches)** — add a green "Verify" / "Unverify" toggle on each catch card and in the details modal. Only admins can flip it (existing admin guard + RLS).
- **Leaderboard / scoring** — update `refresh_leaderboard_entries()` so it only aggregates `WHERE is_verified = true`. Unverified catches stay in the user's personal log but do not count toward rankings, species leaderboards, or season points.
- **Trigger** — when `is_verified` changes, automatically call `refresh_leaderboard_entries(species_id)` so rankings update immediately.
- **Visual badge** — keep the existing "Verified" pill on `CatchDetail`, and add a small green checkmark overlay on catch thumbnails in the feed/profile/admin grid so the judge state is obvious at a glance.

## 2. Comments on catches

New table `catch_comments` (id, catch_id, user_id, body, created_at) with RLS:
- anyone authenticated can read
- only the author can insert/update/delete their own
- admins can delete any

On `CatchDetail`, replace the placeholder "0 comments" row with a real comments section: input box at the top, list below with avatar, name, time, body, and a delete button for the author/admin. Live count shown next to the `MessageSquare` icon.

## 3. Full multi-photo catch view

`CatchDetail` already pulls from `catch_photos` but only renders extras as small thumbnails when there are 2+. We will:

- Merge `cover_photo_url`, `measurement_photo_url`, and every row from `catch_photos` into one ordered gallery.
- Show the hero photo, then a labeled grid below: **Trophy Shot**, **On the Scale**, **Measurement**, **Additional**.
- Make each photo clickable to open a lightbox (reuse existing dialog) so big-fish entries with several photos are fully reviewable.
- Keep angler profile, weight/length stat cards, gear/bait, and location exactly as they are — the request is to make sure everything is visible, which it already is once all photos render.

## Technical details

- Migration adds: `catch_comments` table + RLS + index on `(catch_id, created_at)`; replaces `refresh_leaderboard_entries` body with the `is_verified` filter; adds `AFTER UPDATE OF is_verified` trigger on `catches` that calls the refresh function for the affected `species_id`.
- New file: `src/components/catches/CatchComments.tsx` (input + list + realtime invalidation).
- Edits: `src/pages/admin/AdminCatches.tsx` (verify mutation + button + badge), `src/pages/app/CatchDetail.tsx` (full gallery section + comments + lightbox), and a small `VerifiedBadge` overlay on existing catch thumbnail components where the feed/profile show catches.
- No changes to scoring formula itself — just the input set it operates on.
