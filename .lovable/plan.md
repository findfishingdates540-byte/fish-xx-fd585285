# Facebook-Style Account Switcher on Profile Page

## Overview

Replace the current segmented pill switcher with a Facebook-style dropdown account switcher. The user taps a downward chevron next to their name, and a bottom sheet (mobile) or dropdown modal slides up showing their available account types with an option to create a missing one.

## Current State

- A segmented pill ("Fishing Profile" / "Dating Profile") sits below the hero section
- Clicking switches the profile view and redirects to the mode's home page
- Users without dating can open a setup sheet
- The switcher is functional but doesn't match the Facebook UX pattern

## Design Changes

### 1. Profile Hero Redesign (minor)

- Remove the segmented pill switcher entirely
- Add a small downward chevron (ChevronDown icon) next to the user's display name in the hero
- Show a subtle label under the name indicating current mode (e.g., "Fishing Account" or "Dating Account")
- Tapping the name area or chevron opens the account switcher sheet

### 2. Account Switcher Bottom Sheet (new component)

A bottom sheet (`Sheet` from shadcn) that slides up, containing:

- **Current account** — highlighted row with avatar, name, mode label, and a checkmark
- **Other available account** — row with icon, label (e.g., "Switch to Dating"), tap to switch
- **Create account option** — if user is fishing-only, show "Create Dating Profile" row with a plus icon; if dating-only, show "Create Fishing Profile" (routes to appropriate setup flow)
- Divider + "Manage Accounts" link to settings (optional)

Each row shows: mode icon (Heart/Fish), account type label, and status indicator.

### 3. Switching Behavior

- Tapping an account type updates `ActiveModeContext` via `setActiveMode`
- Redirects to the mode's home page (`/app/feed` for fishing, `/app/discover` for dating)
- Sheet closes automatically after selection
- "Create Dating Profile" navigates to `/app/dating-setup`

## Technical Details

### Files to modify

- `**src/pages/app/Profile.tsx**` — Remove the segmented pill. Add chevron trigger next to user name. Import and render the new `AccountSwitcherSheet` component.
- `**src/components/profile/AccountSwitcherSheet.tsx**` (new) — Bottom sheet component with account rows, switch logic, and create-account option. Uses `useActiveMode` context and `useAccountModeSwitcher` hook.

### Files unchanged

- `ActiveModeContext.tsx`, `use-account-mode-switcher.ts` — existing switching infrastructure is reused as-is.
- `DatingSetup.tsx` — existing dating onboarding flow remains the target for "Create Dating Profile".

### No database changes needed

All account mode values (`dating`, `fishing`, `both`) already exist in the enum.