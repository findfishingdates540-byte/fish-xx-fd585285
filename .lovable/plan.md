# Self-contained tabs for Team / Page / Group

## Problem

`TeamSurfaceHeader` (shared by `TeamPage` and `TeamGroup`) renders a tab strip where **About / Members / Photos** call `navigate(`/app/teams/${teamId}?tab=...`)`, which yanks the user back to the Team profile screen. Only **Posts** and **Mentions** stay on the current surface. The Team profile (`TeamProfile.tsx`) also has its own separate tab system, so the three surfaces don't behave consistently.

Additionally, `TeamSurfaceHeader` (used by the Page) shows the description only inside the identity block as a 2-line clamp, and the Page body never repeats it — so the Page surface feels missing an "About" area entirely.

## Goal

Each of the three surfaces — **Team profile**, **Page**, **Group** — gets its own dedicated tab set. Switching tabs never navigates away from the current surface. The two surface-switch entry points stay: the "Profile" back button in the cover, and the Page/Group buttons on the Team profile.

## Tab sets per surface

- **Team profile** (`/app/teams/:id`): About · Members · Media · Insights *(captain only)*. Already self-contained — keep as is, just remove "Posts/Mentions" expectations (those live on Page/Group).
- **Page** (`/app/teams/:id/page`): Posts · About · Members · Photos · Mentions · Insights *(captain only)*.
- **Group** (`/app/teams/:id/group`): Posts · About · Members · Photos · Mentions. (No Insights — group is internal.)

"About" and "Members" content is the same data on every surface (team description, stats, member list). "Photos" reuses `TeamMediaTab`. "Insights" reuses `TeamInsightsTab`.

## Changes

### 1. `TeamSurfaceHeader.tsx`
- Expand `TeamHeaderTab` union to `"posts" | "about" | "members" | "media" | "mentions" | "insights"`.
- Replace the redirecting tab buttons with pure `onTabChange` callers (no `navigate`).
- Accept a `showInsights` prop so Page can show it for captain and Group can hide it.
- Add a visible **description block** under the identity row (full text, not clamped) so the Page/Group header reads like a real about-card. Hide if empty.

### 2. `TeamPage.tsx`
- Local `tab` state covers all six values.
- Render one of: `TeamFeedTab` (posts), new About panel, new Members panel, `TeamMediaTab`, `TeamMentionsFeed`, `TeamInsightsTab`.
- Pass `showInsights={isCaptain}` to the header.

### 3. `TeamGroup.tsx`
- Same as Page but without Insights, and About/Members/Photos only visible to members (keeps the existing "members only" gate for non-members).

### 4. Extract shared panels
Create two small presentational components reused by all three surfaces:
- `src/components/teams/TeamAboutPanel.tsx` — description + stats grid + "Team Rankings" CTA (lifted from `TeamProfile`'s About tab).
- `src/components/teams/TeamMembersPanel.tsx` — member list with captain promote/demote/remove controls (lifted from `TeamProfile`'s Members tab).

Both accept `teamId`, `team`, `members`, `profiles`, `isCaptain`, `user` as props so no data fetching is duplicated. `TeamProfile`, `TeamPage`, and `TeamGroup` all import them.

### 5. `TeamProfile.tsx`
- Replace inline About/Members JSX with the new shared panels.
- No behavior change for this surface; just consolidation so all three surfaces render identical content for those tabs.

## Out of scope

- URL sync for tab state (`?tab=...`) — keep simple local state for now.
- Changing the existing Page/Group entry buttons on Team profile.
- Any data-model or backend changes.
