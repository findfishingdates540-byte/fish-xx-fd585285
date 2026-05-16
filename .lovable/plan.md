## Goals

1. Public Team Page discoverability + followers (non-members can find a team and subscribe to Page updates).
2. Audit realtime subscriptions across notifications/messages/team posts and fix gaps.
3. Notifications when someone likes/comments on my team Page/Group posts.
4. Video moderation pipeline (transcode + admin review before public).
5. Feed filters on Page/Group: sort by recency and filter by nearby location.

---

## 1. Public Team Discovery + Followers

**DB (migration):**
- New table `team_followers` (`team_id`, `user_id`, `created_at`, unique).
- Add `followers_count` to `fishing_teams`.
- Trigger to keep `followers_count` synced.
- RLS: anyone can `SELECT` from `team_followers` (counts), users insert/delete only their own row.
- `fishing_teams` SELECT policy already public — confirm and add an index on `name`/`category` for search.

**Frontend:**
- `src/pages/app/TeamsDirectory.tsx` (route `/app/teams`) already lists teams — add a search bar (name/category/skill), and a "Follow" button on each card and on `TeamProfile` header.
- New hook `useTeamFollow(teamId)` — returns `isFollowing`, `followersCount`, `toggle()`.
- Surface followed teams in main Feed: extend feed query to include `team_posts` (surface='page') from teams the user follows, mixed by `created_at`. (Cross-post already exists, but this guarantees non-members see ALL page posts, not only ones the author opted to cross-post.)
- Public team page route already at `/app/teams/:teamId` — make sure About/Page tabs render for non-members (already do); ensure Group tab hidden if not member.

---

## 2. Realtime Audit

Sweep through and verify channel subscriptions and cleanup:
- `useTeamPosts` — already uses `postgres_changes` on `team_posts`. Verify channel name uniqueness per `(teamId, surface)`.
- `notifications` — check `src/hooks/use-notifications.ts` subscribes to INSERT on `notifications` for current user.
- `messages` / `buddy_messages` — check `useMessages`/`useBuddyChat`.
- Add `team_post_likes` and `team_post_comments` realtime so counts/UI refresh live.
- Fix any missing `supabase.removeChannel` on unmount.

Deliverable: 1-page checklist in chat reply + code fixes where gaps found.

---

## 3. Like/Comment Notifications for Team Posts

**DB (migration):**
- Trigger `notify_team_post_like` on `team_post_likes` INSERT → insert into `notifications` for post `author_id` (skip self-likes). Type: `team_post_like`. Data: `{team_id, post_id, surface, liker_id}`.
- Trigger `notify_team_post_comment` on `team_post_comments` INSERT → same pattern. Type: `team_post_comment`.
- Also notify mentions in team comments (regex same as `notify_comment_mention`).

**Frontend:**
- Extend `NotificationItem` rendering to handle new types and deep-link to `/app/teams/:teamId?tab=page&post=:postId`.

---

## 4. Video Moderation Pipeline

**DB (migration):**
- Add columns to `team_posts.media` items (jsonb already): introduce `moderation_status` enum (`pending`, `approved`, `rejected`) and `media_kind` (`image`, `video`).
- New table `team_post_media_reviews` (`id`, `post_id`, `media_index`, `kind`, `url`, `status`, `reviewed_by`, `reviewed_at`, `notes`).
- New status column `team_posts.visibility` enum (`public`, `pending_review`, `hidden`). When a video is attached → set to `pending_review` until approved.
- RLS: only admins read/update reviews; authors can read their own.
- Update `team_posts` SELECT policy: page posts visible if `visibility='public'` OR viewer is author/captain/admin.

**Edge function `process-team-video`:**
- Triggered on upload (call from `TeamMediaUploader` after successful storage put).
- Generates a poster thumbnail (using `ffmpeg.wasm` is heavy; v1: just record metadata + queue for admin). Mark `moderation_status='pending'`, create review row.
- Optional: integrate with a third-party moderation API later (left as a hook).

**Admin UI:**
- Extend `AdminTeamPosts.tsx` with a "Pending Media" tab listing `team_post_media_reviews` where `status='pending'`. Approve → set post `visibility='public'` (if all media approved). Reject → set `visibility='hidden'` and notify author.

---

## 5. Page/Group Feed Filters

**Frontend only:**
- Add a filter bar to `TeamFeedTab.tsx`:
  - Sort: `Recent` (default, `created_at DESC`) | `Top` (`likes_count DESC` within last 7d).
  - Location: `All` | `Nearby` (uses browser geolocation + haversine on `location_lat/lng` columns already present on `team_posts`, radius slider 10/25/50/100mi).
- Add `location_lat`, `location_lng` columns to `team_posts` if not present (current schema has `location` text; add geo cols in migration).
- Update `useTeamPosts(teamId, surface, { sort, near })` to accept filters.

---

## Technical Notes
- New enum types created with `CREATE TYPE IF NOT EXISTS`-style guards via `DO $$ ... $$`.
- All triggers use `SECURITY DEFINER` + `SET search_path = public`.
- All new RLS policies use `(SELECT auth.uid())` pattern per project core rule.
- Storage path for videos unchanged (`team-media/{team_id}/{user_id}/...`); just gate publish via DB `visibility`.

---

## Open Questions

1. **Video transcoding**: do you want real transcoding (mp4→hls, requires an external service like Mux/Cloudflare Stream and a paid API key), or v1 = just admin review of raw mp4 + auto-poster thumbnail? Real transcoding adds cost.
2. **"Nearby" location for filter**: use the device's current location, or the user's saved `profile.location_lat/lng`?
3. **Follow vs cross-post in main Feed**: currently Page posts cross-post only if the author toggles it. Should followers also see *non*-cross-posted Page posts in their main feed, or only on the team's page?