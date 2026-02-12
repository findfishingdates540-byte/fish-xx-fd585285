

# Add Action Chooser to the Spots FAB Button

## Overview
When tapping the FAB (floating action button) on the Spots page, instead of navigating directly to "Add Spot", a small menu will appear letting the user choose between **Add a Spot** or **Log a Catch**, then navigate to the appropriate page.

## What Changes

**File: `src/pages/app/Spots.tsx`**

1. Replace the single FAB button (lines 884-896) with a `DropdownMenu` component
2. The FAB button becomes the trigger for the dropdown
3. Two menu items:
   - **Add a Spot** -- navigates to `/app/spots/new` (existing behavior)
   - **Log a Catch** -- navigates to `/app/catches` (existing catches page which has the log catch form)
4. Each menu item will have an icon (MapPin for spots, Fish for catches) for clarity

## Technical Details

- Uses the existing `DropdownMenu` component already imported in the file
- No new dependencies or files needed
- The dropdown will open upward (side="top") since the FAB is near the bottom of the screen
- The FAB icon changes from `Fish` to `Plus` to better represent "add something" generically
- Works on both mobile and desktop layouts

## Single file change
- `src/pages/app/Spots.tsx` -- wrap the FAB in a DropdownMenu with two navigation options

