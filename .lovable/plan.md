# Standalone Page & Group experiences

Right now the team profile crams everything (Page feed, Group feed, Media, About, Members, Insights) into one tabbed view at `/app/teams/:teamId`. The Page and Group surfaces deserve their own dedicated routes with a full-bleed cover, immersive header, and their own sidebar layout — like a Facebook Page vs Group.

## New routes

- `/app/teams/:teamId` → **Team Profile** (identity hub). Keeps About, Members, Media, Insights. Removes the Page and Group tabs. Adds two prominent entry cards/buttons: "Visit Page" and "Visit Group" (Group only shown to members, or shows "Join to enter group").
- `/app/teams/:teamId/page` → **Team Page** (new standalone view). Full-bleed cover, large logo, name + follower count, follow/share actions, then the Page feed in a 2‑column layout with the right rail (Pinned, Featured, About snippet, Members preview).
- `/app/teams/:teamId/group` → **Team Group** (new standalone view). Full-bleed cover styled distinctly (e.g., subtle "Group" chip, member-only chrome), members-only feed in 2‑column layout with right rail (Rules, Pinned, Members, Admins).

Both standalone views get a back link to the team profile and a small contextual switcher ("Page · Group · Profile") in the header so captains/members can hop between surfaces.

## UX details

- Full-bleed cover: 240px desktop / 160px mobile, edge-to-edge (escape the `max-w-6xl` container), gradient fallback when no `cover_url`.
- Logo overlaps cover bottom, circular, 96–112px.
- Sticky compact header on scroll: small logo + name + primary action (Follow / Join / + Post).
- Captain edit affordance ("Edit page" / "Edit group") stays on the cover.
- Right rail becomes sticky and surface-specific (Page rail vs Group rail), reusing `TeamRightRail` with a `surface` prop so Pinned/Featured/Rules render contextually.
- Mobile: cover + header stack, rail collapses to a top "About this Page/Group" card and "Members" strip above the feed.

## Team Profile changes

- Drop `page` and `group` tabs from `TabsList`.
- Replace with two hero entry cards directly under the identity header:
  - "Page" card → public-facing feed teaser (post count, latest post thumbnail), CTA "Open Page".
  - "Group" card → private members feed teaser (member count, today's activity), CTA "Open Group" or "Join to access".
- Keep About, Members, Media, Insights tabs as the profile's own content.

## Files to add / change

**New**
- `src/pages/app/TeamPage.tsx` — standalone Page route, full-bleed cover + `TeamFeedTab surface="page"` + right rail.
- `src/pages/app/TeamGroup.tsx` — standalone Group route, full-bleed cover + `TeamFeedTab surface="group"` + right rail, gated by membership.
- `src/components/teams/TeamSurfaceHeader.tsx` — shared full-bleed cover/header used by both routes (cover, logo, title, actions, surface switcher, sticky compact bar).

**Edit**
- `src/App.tsx` — register the two new routes.
- `src/pages/app/TeamProfile.tsx` — remove Page/Group tabs, add entry cards, link to new routes; keep `EditTeamDialog` and right rail logic available to the new pages via a small shared hook.
- `src/components/teams/TeamRightRail.tsx` — accept `surface: "page" | "group"` to render the right modules per surface (Pinned/Featured for Page; Rules/Pinned/Admins for Group). Existing behavior preserved when surface omitted.
- `src/components/teams/EditTeamDialog.tsx` — no logic change; reused from new routes (captain-only).
- Update any in-app links that currently set `?tab=page|group` on the profile to point to the new routes (search for `setTab("page")` / `setTab("group")`).

## Technical notes

- Data fetching (`team-detail`, `team-members`, `team-member-profiles`, `useTeamRole`, `useTeamFollow`) is extracted into a `useTeamContext(teamId)` hook so all three routes share one source of truth without duplicating queries.
- Full-bleed implemented with `relative left-1/2 -translate-x-1/2 w-screen` inside a normal container, then content returns to `max-w-6xl mx-auto` below the cover.
- Membership/permission gates reuse existing `useTeamRole` (`canPostPage`, `canPostGroup`, `isMember`, `isCaptain`).
- Insights logging: call `logTeamPageView` from each route with a `surface` discriminator if we want per-surface analytics later (optional, not required for this change).
- No DB or RLS changes required.
