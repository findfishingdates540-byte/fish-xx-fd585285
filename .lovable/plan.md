# Gate Team Joins With Captain Approval

Today, tapping **Join Team** inserts directly into `team_members` and the user becomes a member instantly. We'll change it so the captain has to approve or reject each request first.

## Approach

Add a `status` column to `public.team_members` (`pending` | `approved`), so a "request" is just a pending row. This keeps the existing schema, queries, and member math intact — we just filter by `status = 'approved'` everywhere the UI shows members, and surface pending rows only to the captain.

## Database (migration)

1. `ALTER TABLE public.team_members ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved'))`.
2. Backfill all existing rows to `status = 'approved'` so nothing breaks for current members.
3. Update RLS:
   - `Users can join teams` (INSERT) — keep, but force `status = 'pending'` via WITH CHECK.
   - New SELECT split: everyone can see `approved` rows; only the requester or the captain can see `pending` rows. (Replaces the current "Anyone can view team members" policy.)
   - Keep captain UPDATE/DELETE and "members can leave" as-is — captain `UPDATE` is what flips `pending → approved` (reject = `DELETE`).
4. Add an index on `(team_id, status)` for the pending-list query.

## Frontend

**Requester side** (`src/pages/app/TeamProfile.tsx`, plus `TeamSurfaceHeader` / `TeamPage` / `TeamGroup` where the Join button shows):
- After `joinMutation`, toast "Request sent — waiting for captain approval" instead of "You joined".
- Compute three states from `team_members`: `not_member`, `pending`, `member`. Button label switches between **Join Team** / **Request Pending** (disabled, with a "Cancel request" secondary action that deletes the pending row) / **Leave Team**.
- `isMember` / `memberCount` in `use-team-context.ts` and `Teams.tsx` must only count `status = 'approved'`.

**Captain side** — new **Requests** affordance:
- Add a `pendingRequests` query (rows where `status = 'pending'`) in `use-team-context.ts`.
- In `TeamMembersPanel.tsx`, when `isCaptain` and there are pending requests, render a "Pending requests" section above the member list with each requester's avatar + name and **Approve** / **Reject** buttons.
  - Approve = `UPDATE team_members SET status='approved'`.
  - Reject = `DELETE` the row.
- Show a small badge with the pending count next to the "Members/Followers" tab in `TeamSurfaceHeader.tsx` (captain only).

**List screen** (`src/pages/app/Teams.tsx`):
- Filter member rows to `status = 'approved'` before computing `memberCount` and `isMember`.

## Notifications (lightweight)

- On insert of a pending row, call the existing notifications path (matching how other team events notify) to alert the captain: "X requested to join {team}".
- On approval, notify the requester: "You were accepted into {team}".
- If the notifications module isn't trivially reusable here, this step degrades to in-app only (badge on the Requests section) — explicit follow-up rather than blocking the core flow.

## Out of scope

- Bulk approve/reject, request messages/notes, invite links, auto-approve toggles, rate-limiting repeat requests, email notifications.
