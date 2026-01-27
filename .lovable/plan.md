
# Bumble-Style Scrollable Profile Cards

## Overview
Transform the `ProfileInfoPanel` into a scrollable container with multiple distinct content "cards" that users can scroll through vertically, similar to Bumble's dating profile layout. A scroll indicator bar will show which card section the user is currently viewing.

## Visual Design

The panel will contain 4 scrollable sections (cards):

1. **Card 1 - Profile Basics**: Name, age, verification badge, occupation, bio
2. **Card 2 - Interests**: Tags showing hobbies and interests
3. **Card 3 - Lifestyle**: Height, drinking, smoking, zodiac sign, personality type
4. **Card 4 - Prompts**: Profile prompts with questions and answers

Each card will take up the full height of the panel, encouraging vertical scrolling. A thin scroll indicator bar on the right edge will show the current position.

---

## Technical Implementation

### 1. Update ProfileInfoPanel Props

Expand the component props to accept the full `ProfileDetailData`:

```typescript
interface ProfileInfoPanelProps {
  profile: ProfileDetailData;  // Full profile data instead of individual props
  onMoreClick?: () => void;
  className?: string;
}
```

### 2. Create Scrollable Container with Snap Points

Use CSS scroll-snap for smooth card-to-card scrolling:

```tsx
<div className="overflow-y-auto snap-y snap-mandatory scrollbar-hide">
  {/* Card 1 */}
  <div className="snap-start min-h-full flex flex-col justify-center p-6">
    {/* Profile basics content */}
  </div>
  
  {/* Card 2 */}
  <div className="snap-start min-h-full flex flex-col justify-center p-6">
    {/* Interests content */}
  </div>
  
  {/* Additional cards... */}
</div>
```

### 3. Add Scroll Position Indicator

Track scroll position and display a vertical indicator bar:

- Use `useRef` and `onScroll` to detect current card
- Render small dot indicators or a progress bar on the right side
- Highlight the active section

### 4. Card Content Structure

**Card 1 - Basics:**
- Name and age (large heading)
- Verification badge with label
- Occupation
- Bio text (2-3 line preview)

**Card 2 - Interests:**
- Section title "Interests"
- Wrapped badge/pill tags for each interest

**Card 3 - Lifestyle:**
- Section title "The Basics"
- Icon + label rows for height, drinking, smoking, zodiac, personality

**Card 4 - Prompts:**
- Profile prompt cards (if available)
- Question as header, answer as body

### 5. Update Discover.tsx

Pass `currentDetailProfile` to `ProfileInfoPanel` instead of individual props:

```tsx
<ProfileInfoPanel
  profile={currentDetailProfile}
  onMoreClick={handleProfileClick}
  className="h-full"
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/discover/ProfileInfoPanel.tsx` | Complete rewrite with scrollable cards, snap points, and scroll indicator |
| `src/pages/app/Discover.tsx` | Update to pass `currentDetailProfile` instead of individual props |

---

## Scroll Indicator Design

The indicator will be a thin vertical bar with dots representing each card section:

```
+-------------------+
|                  •|  <- Active card 1
|                  ○|  <- Card 2
|                  ○|  <- Card 3  
|                  ○|  <- Card 4
+-------------------+
```

The indicator will:
- Be positioned on the right edge of the panel
- Use filled/empty circles or height-based progress
- Update in real-time as user scrolls
- Be subtle and non-intrusive (small, muted colors)

---

## Conditional Rendering

Cards will only render if they have content:
- Card 2 (Interests): Show only if `interests` array has items
- Card 3 (Lifestyle): Show only if any lifestyle field exists
- Card 4 (Prompts): Show only if `promptResponses` has items

This ensures the experience feels complete even for sparse profiles.
