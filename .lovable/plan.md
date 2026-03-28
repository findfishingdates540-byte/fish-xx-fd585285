

# Dating Access from Profile Page

## Overview
Add a profile view switcher so users can toggle between their Fishing Profile and Dating Profile directly on the Profile page. Users who haven't set up dating yet get routed through a dating onboarding mini-flow.

---

## 1. Profile View Switcher

**Location**: Below the hero section on `/app/profile`, next to the existing Social/Detailed tabs.

**Design**: A segmented pill with two options — **Fishing Profile** (default, Fish icon) and **Dating Profile** (Heart icon). Sits above the existing tabs.

- If the user's `account_mode` is `dating` or `both`, tapping "Dating Profile" shows their dating-specific content (dating stats, dating prompts, lifestyle cards).
- If the user's `account_mode` is `fishing` (no dating set up), tapping "Dating Profile" opens a bottom sheet prompting them to set up dating with an 18+ age gate and CTA to start the dating onboarding.

---

## 2. Dating Profile View

When "Dating Profile" is selected, the profile page shows:
- Dating stats card (matches, likes received, conversations) — already exists in code at line ~497
- Lifestyle cards (drinking, smoking, zodiac, personality) — already exists
- Dating prompts — already exists
- A "View Dating App" button linking to `/app/discover`
- An "Edit Dating Profile" button linking to `/app/profile/edit` with a dating tab focus

The existing Detailed tab content already has most of this. The switcher simply controls which sections are visible.

---

## 3. Dating Onboarding for New Users

When a fishing-only user taps the Dating Profile pill:
1. **Bottom sheet** appears: "Explore Dating on FISH-X" with 18+ confirmation checkbox
2. On confirm, navigate to a **dating onboarding mini-flow** at `/app/dating-setup`
3. The mini-flow reuses existing onboarding step components:
   - `StepDatingPreference` (gender preferences)
   - `StepLifestyle` (drinking, smoking, etc.)
   - `StepPhotoUpload` (ensure dating-quality photos)
   - `StepBio` (dating bio)
4. On completion, update `account_mode` to `both` in the database
5. Redirect back to Profile with the Dating Profile view active

---

## 4. Technical Details

**Files modified:**
- `src/pages/app/Profile.tsx` — Add the Fishing/Dating segmented pill above existing tabs. Conditionally render dating sections vs fishing sections based on selected view. Add bottom sheet for fishing-only users.
- `src/App.tsx` — Add route `/app/dating-setup` for the dating onboarding mini-flow.

**New file:**
- `src/pages/app/DatingSetup.tsx` — Mini onboarding page that reuses `StepDatingPreference`, `StepLifestyle`, `StepPhotoUpload`, and `StepBio`. On completion, updates `account_mode` to `both` via Supabase and navigates back to profile.

**No database changes needed** — `account_mode` enum already supports `both`, and all dating fields already exist on the `profiles` table.

