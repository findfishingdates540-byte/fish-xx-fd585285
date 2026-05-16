
# Team Pages & Team Groups

Bring Facebook-style "Page + Group" to every Team. Each `fishing_teams` row gets two surfaces:

- **Team Page** — public-facing. Captain + officers post announcements, teasers, winnings, next matchups, current bracket stage. Anyone can view; only roles can post.
- **Team Group** — members-only. Any accepted member can post catches, photos, banter. Hidden from non-members.

Posts are authored *by the team* but attributed to the user who posted them (Facebook style: "Team Name · posted by @user").

## 1. Data model (new migration)

New tables (all with RLS):

- `team_post_authors` — extend roles. Add `role` column to `team_members` (enum: `member`, `officer`) and keep `captain_id` on `fishing_teams` as the owner role. Officers + captain = "page posters".
- `team_posts`
  - `id`, `team_id`, `author_id` (user who wrote it), `surface` enum (`page` | `group`), `content` text, `media` jsonb[] (array of `{url, type: image|video, width, height}`), `location_name`, `location_lat`, `location_lng`, `pinned` bool, `post_type` enum (`announcement`, `matchup`, `winning`, `teaser`, `update`, `catch`, `general`), `created_at`, `updated_at`, `is_hidden` bool (moderation), `report_count` int.
- `team_post_likes` — `post_id`, `user_id`, unique.
- `team_post_comments` — `post_id`, `user_id`, `parent_id` (nested), `content`, `created_at`, `is_hidden`.
- `team_post_reports` — `post_id`, `reporter_id`, `reason`, `status` (`pending`, `reviewed`, `actioned`, `dismissed`), `created_at`, `reviewed_by`, `reviewed_at`. Mirrors existing reported-photos admin pattern.

Helper SECURITY DEFINER functions:
- `is_team_member(_user, _team)` — accepted member OR captain.
- `is_team_poster(_user, _team)` — captain OR officer.

Storage: new public bucket `team-media` with RLS requiring path prefix `{team_id}/{user_id}/...` and `is_team_member` check for upload.

## 2. RLS rules (plain English)

- **Team Page posts (`surface='page'`)**: anyone authenticated can read. Only captain or officers of the team can insert. Author or captain can update/delete. Admins bypass.
- **Team Group posts (`surface='group'`)**: only team members + captain can read or insert. Author or captain can edit/delete.
- **Likes/comments**: read follows the parent post's visibility. Insert requires the same visibility rule (anyone for page, members for group). Users edit/delete their own.
- **Reports**: any logged-in user can insert one report per post. Only admins (`has_role(uid,'admin')`) can read/update.
- **Roles**: only captain can promote/demote officers (update `team_members.role`).

## 3. Frontend

### Routes (under `ScoreboardHubLayout`)
- `/app/teams/:teamId` — refactor existing `TeamProfile.tsx` into a tabbed layout:
  - **About** (existing info, roster, stats)
  - **Page** (new) — public feed of `surface='page'` posts
  - **Group** (new, gated) — members-only feed of `surface='group'` posts; non-members see "Join the team to see group posts"
  - **Members** (existing roster, with role badges + captain controls to promote/demote/remove)
- `/app/teams/:teamId/posts/:postId` — single post view (optional, for deep linking).

### New components (`src/components/teams/`)
- `TeamHeaderCard` — banner, logo, name, captain, follow/join button, tab nav.
- `TeamComposer` — Facebook-style composer (textarea + media picker + post type dropdown + optional location). Auto-selects allowed surface based on tab + role.
- `TeamPostCard` — header shows team logo + "Team Name", subline "posted by @author · 2h", body, media carousel, like/comment/share row, pinned badge, post-type chip, report menu.
- `TeamPostComments` — nested comments, mirrors `feed/CommentList` patterns.
- `TeamMediaUploader` — uploads to `team-media` bucket, returns media jsonb entries; supports images + short video (mp4, ≤50MB).
- `TeamRoleBadge` — Captain / Officer / Member chip used across roster and post headers.

### Hooks (`src/hooks/`)
- `use-team-posts.ts` — TanStack infinite query keyed by `['team-posts', teamId, surface]`, sorted by `pinned desc, created_at desc`. Realtime channel for inserts/updates.
- `use-team-post-mutations.ts` — create / update / delete / like / unlike / comment / report.
- `use-team-role.ts` — returns `{ isCaptain, isOfficer, isMember, canPostPage, canPostGroup }` for current user + team.

### Feed details
- Sorted by `pinned DESC, created_at DESC`. When `location_lat/lng` present and user has location, show "X mi away" badge (reuse haversine helper).
- Realtime via Supabase channel `team-posts:{teamId}:{surface}`.
- Like + comment counts denormalized on `team_posts` via triggers (mirrors `feed_posts`).

### Permissions UI
- Composer hidden if user lacks role for that surface.
- Members tab shows promote/demote/remove menu only for captain.
- Report menu on every post for any logged-in user (not author).

## 4. Admin moderation

Extend admin sidebar with **Team Posts** entry:
- `src/pages/admin/AdminTeamPosts.tsx` lists `team_post_reports` filtered by status with the same table styling as `AdminPhotoChallenges` reports.
- Actions: hide post (`is_hidden=true`), delete post, dismiss report, ban author from posting (sets `team_members.is_muted`). Hooks into existing audit log via `create_audit_log`.

## 5. Technical notes

- Use `(SELECT auth.uid())` inside RLS for performance (project convention).
- Media uploads must prefix path with `{team_id}/{user_id}/` to satisfy storage RLS.
- Add denormalized `likes_count`, `comments_count` to `team_posts` with triggers (`update_team_post_likes_count`, `update_team_post_comments_count`).
- Notification triggers: notify captain on new group post, notify all members on new page post, notify post author on like/comment, notify admins on new report. Reuse `notifications` table with new types `team_page_post`, `team_group_post`, `team_post_like`, `team_post_comment`, `team_post_reported`.
- TypeScript: `ReturnType<typeof setTimeout>` for any timers in realtime hooks.
- TanStack query keys must be strictly distinct per surface; invalidate with `exact: true`.

## 6. Rollout order

1. Migration: tables, enums, helper functions, RLS, storage bucket, triggers, notification types.
2. Hooks (`use-team-role`, `use-team-posts`, mutations).
3. Components (header tabs, composer, post card, comments, media uploader, role badge).
4. Refactor `TeamProfile.tsx` to tabbed layout; wire Page + Group + Members tabs.
5. Admin moderation page + sidebar entry.
6. Polish: empty states, pinned banner, "X mi away" badge, realtime, notifications.

## Open questions

1. Should **video uploads** be enabled in v1, or images-only first (videos can land in v2)?
2. For the **Group**, should pending join requests be required (captain approves), or auto-join from the existing team roster only?
3. Should Page posts be **cross-posted to the main Feed** (`feed_posts`) so followers see them, or stay only on the team page?
