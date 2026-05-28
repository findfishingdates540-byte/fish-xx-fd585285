## Teen Safety & Junior Angler System (Ages 13–17)

Implement age-tiered access so 13–17 year olds can sign up with parental consent and safer defaults, while 18+ retains full features. Under-13 is blocked.

### 1. Database (new migration)

Add to `profiles`:
- `is_minor boolean` (computed/stored from DOB at signup; true if 13–17)
- `parent_guardian_consent boolean default false`
- `parent_guardian_email text` (optional, for consent record)
- `consent_given_at timestamptz`
- `is_junior_account boolean default false` (Junior Angler flag)
- `parent_user_id uuid references auth.users` (parent-linked profile, optional)

Add helper SQL function `public.is_user_minor(_user_id uuid) returns boolean` (security definer) reading from profiles.

### 2. Onboarding flow (`src/pages/Onboarding.tsx`, `StepBasicInfoNew.tsx`)
- Keep min age 13 for fishing; block <13 with clear error ("You must be 13+ to use Fish-X").
- After DOB entry, if age is 13–17:
  - Force `accountMode = 'fishing'` (hide dating option, show notice "Dating features available at 18+").
  - Show new **Parent/Guardian Consent** step: checkbox "My parent/guardian has given me permission to use Fish-X" + optional parent email field. Required to continue.
  - Mark profile `is_minor=true`, `is_junior_account=true`, `parent_guardian_consent=true`.
  - Default privacy settings to safer values (private profile, no DMs from strangers).

### 3. Feature gating (new hook `useIsMinor`)
- `src/hooks/use-is-minor.ts` reads `is_minor` from profile.
- Gate dating routes (`DatingRoute`) — minors hard-blocked, redirected to `/app/feed` with toast.
- Gate `Messages` / `Chat`: minors can only message confirmed buddies (already-accepted buddy requests), not arbitrary users. Add check in message-send paths.
- Gate tournaments/challenges: show only ones flagged `junior_friendly` or auto-enroll into Junior brackets.

### 4. Tournaments & Challenges
- Add `is_junior_only boolean default false` to `tournaments`, `fishing_challenges`, `photo_challenges`.
- Admin edit dialogs: add toggle "Junior Anglers only (13–17)".
- Listing pages filter: minors see junior-only + non-age-restricted; adults see all non-junior-only by default with toggle.

### 5. UI surfaces
- Profile badge "Junior Angler" for minors.
- Settings → Safety section: shows parent email on file, reporting/blocking shortcuts, "Account maturity: X days until 18" countdown.
- Hide upgrade-to-dating CTAs for minors entirely.

### Technical notes
- Use existing `RouteGuard` pattern; add `MinorBlockedRoute` wrapper for adult-only features.
- All minor checks must be server-side too: add RLS predicate on `dating_profiles` / `matches` insert: `NOT public.is_user_minor(auth.uid())`.
- Onboarding writes `is_minor` based on computed age; do not trust client flag — recompute in a DB trigger from `date_of_birth`.

### Out of scope (follow-up)
- Real parent verification email flow (just record email now).
- Parent-linked profile dashboard (schema only; UI later).
- "Account maturity" graduated DM unlock (defer; for now: buddies-only DM for minors).

Confirm to proceed and I'll ship migration + code in one pass.
