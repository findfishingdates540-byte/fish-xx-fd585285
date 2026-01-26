
# Fix: Bumble 2-Column Layout Implementation

## Problem Identified

The current implementation has layout issues when compared to the Bumble reference:

1. **ProfileInfoPanel only shows on `xl:` (1280px+)** - Should show on `lg:` screens (1024px+)
2. **Card section is isolated** - Card takes full width with `max-w-md` centering, but should be in a flex row with the info panel
3. **Missing side-by-side layout** - The profile card and info panel need to be in the same flex container

## Visual Comparison

**Current (Wrong):**
```text
┌────────────────────┬─────────────────────────────────────────┐
│  Sidebar (320px)   │     [Card centered at max-w-md]         │
│  - Match Queue     │                                         │
│  - Conversations   │     ProfileInfoPanel hidden until xl    │
└────────────────────┴─────────────────────────────────────────┘
```

**Target (Correct):**
```text
┌────────────────────┬────────────────────────────────────────────────┐
│  Sidebar (320px)   │   [Profile Card]      │   [Info Panel]        │
│  - Match Queue     │      (~55%)           │      (~45%)           │
│  - Conversations   │   [X] [★] [✓]         │   Chris, 55 ✓         │
│                    │   Block & report      │   Photo verified      │
└────────────────────┴────────────────────────────────────────────────┘
```

---

## Technical Changes Required

### 1. Update `src/pages/app/Discover.tsx`

**Problem:** Lines 371-410 wrap the card in a `max-w-md` container, and ProfileInfoPanel is a sibling outside this container.

**Fix:** Create a horizontal flex container that holds both the card section AND the info panel side-by-side on `lg:` screens.

```tsx
// Current structure (wrong):
<main className="flex-1 flex overflow-hidden lg:ml-80">
  <div className="flex-1 ... max-w-md">  {/* Card isolated */}
    <ProfileCard />
    <SwipeActions />
  </div>
  <ProfileInfoPanel />  {/* Separate, hidden until xl */}
</main>

// Fixed structure:
<main className="flex-1 flex overflow-hidden lg:ml-80">
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="flex gap-0 max-w-4xl w-full h-full">
      {/* Card Section - 60% */}
      <div className="flex-[3] flex flex-col items-center justify-center">
        <ProfileCard />
        <SwipeActions />
      </div>
      {/* Info Panel - 40% */}
      <ProfileInfoPanel profile={currentProfile} />
    </div>
  </div>
</main>
```

### 2. Update `src/components/discover/ProfileInfoPanel.tsx`

**Problem:** Uses `hidden xl:flex` - only shows on 1280px+

**Fix:** Change to `hidden lg:flex` to show on 1024px+ (when sidebar is visible)

Also adjust width from fixed `w-80` to a flexible width within the parent flex container.

```tsx
// Current (line 22):
className="hidden xl:flex flex-col w-80 h-full ..."

// Fixed:
className="hidden lg:flex flex-col flex-[2] min-w-[280px] max-w-[360px] h-full ..."
```

### 3. Ensure Card Takes Proper Width

The ProfileCard should expand to fill its section of the flex container while maintaining aspect ratio and max width constraints appropriate for the photo display.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/app/Discover.tsx` | Restructure main content area to have card + info panel in same flex row |
| `src/components/discover/ProfileInfoPanel.tsx` | Change breakpoint from `xl:` to `lg:`, adjust width to be flexible |

---

## Layout Breakpoints

| Screen Width | Layout |
|--------------|--------|
| < 1024px (mobile/tablet) | Single column - card only, no sidebar, no info panel |
| ≥ 1024px (lg) | 2-column - sidebar (320px fixed left) + main area with card and info panel side-by-side |

---

## Implementation Steps

1. **Update Discover.tsx main area structure:**
   - Remove the `max-w-md` wrapper around the card section
   - Create a new flex container with `flex gap-0` that holds both card area and info panel
   - Card section gets `flex-[3]` (60%), info panel gets `flex-[2]` (40%)

2. **Update ProfileInfoPanel.tsx:**
   - Change visibility from `xl:flex` to `lg:flex`
   - Change width from fixed `w-80` to flexible `flex-[2]`
   - Add min/max width constraints for consistency

3. **Test on various screen widths:**
   - Mobile: Card only, full screen
   - Tablet: Card only, full screen  
   - Desktop (1024px+): Sidebar + Card + Info Panel

---

## Expected Result

After these changes, the Discover page on desktop will match the Bumble screenshot:
- Left sidebar with Match Queue and Conversations (~320px fixed)
- Main area split horizontally: Profile Card (~55-60%) and warm Info Panel (~40-45%)
- Action buttons (X, Star, Checkmark) below the card
- "Block and report" link below action buttons
