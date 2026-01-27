
# Mobile Profile Card Enhancement

## Overview
Update the mobile Discover page profile card to match the Bumble-style layout shown in the reference. Currently, the mobile card only displays the photo with name/age overlay. The new design will add bio text and interest tags below the photo section.

## Current State
- Mobile `ProfileCard` hides the bio and tags section entirely (line 217-237 uses `{!isMobile && (...)}`)
- The photo takes up the full card height on mobile
- Only name, age, location, and verification badges are visible on the photo overlay

## Target State (Based on Reference)
1. **Photo section**: Takes up majority of card but not 100%
2. **Name/Age overlay**: Remains on photo with verification badge
3. **Occupation**: Shown below name (currently not displayed on mobile)
4. **Bio section**: Visible below the photo
5. **Interest tags**: Displayed as pills at the bottom

## Technical Implementation

### File: `src/components/discover/ProfileCard.tsx`

**Change 1: Adjust photo section height for mobile**
- Currently: `isMobile ? "flex-1 min-h-0" : "aspect-[3/4]"` (line 121)
- Change to: Mobile uses a fixed aspect ratio (like 4:5) instead of flex-1 to leave room for bio/tags

**Change 2: Add occupation to name overlay on mobile**
- Add occupation prop to ProfileData interface
- Display occupation below the name in the gradient overlay (like "Yoga Instructor" in reference)

**Change 3: Show bio and tags on mobile**
- Remove the `{!isMobile && (...)}` condition (line 218)
- Always show the bio and tags section
- Adjust padding and sizing for mobile (smaller text, compact layout)

**Change 4: Update ProfileData interface**
- Add `occupation?: string` field to the interface

### File: `src/pages/app/Discover.tsx`

**Change 5: Pass occupation to ProfileCard**
- The occupation data is available in `currentDetailProfile?.occupation`
- Update the profile data passed to `ProfileCard` to include occupation

## Layout Structure (Mobile)

```
+---------------------------+
|        Photo              |
|     (aspect 4:5)          |
|                           |
|  Name, Age [verified]     |
|  Occupation               |
|  Location • Distance      |
+---------------------------+
|  Bio text (2-3 lines)     |
|                           |
|  [Tag] [Tag] [Tag]        |
+---------------------------+
|    [Action Buttons]       |
+---------------------------+
```

## Styling Notes
- Bio: `text-sm text-muted-foreground line-clamp-2` (limit to 2 lines)
- Tags: Smaller pills with `text-xs` on mobile, `flex-wrap` with overflow handling
- Padding: Reduce to `p-3` on mobile vs `p-5` on desktop
- Photo aspect ratio: Use `aspect-[4/5]` on mobile to balance photo vs content
