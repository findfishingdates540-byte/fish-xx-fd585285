
# Design Optimization Plan: Bumble-Inspired UI Polish

## Overview
This plan focuses on visual refinements to bring the Discover page closer to Bumble's polished, modern aesthetic while maintaining your existing functionality.

---

## 1. Profile Card Redesign

### Current Issues
- Card has rounded corners with visible padding around it
- Bio section visible on desktop adds visual clutter
- Photo navigation dots are basic
- Name overlay gradient could be more refined

### Proposed Changes

**Card Container:**
- Increase card size on desktop (from max-w-sm to max-w-md)
- Reduce border-radius slightly (from rounded-3xl to rounded-2xl)
- Remove bio section from card entirely (move to expandable detail view)
- Edge-to-edge photo on mobile with no card wrapper

**Photo Navigation:**
- Replace dots with sleek segment bars at top (like Instagram Stories/Bumble)
- Active segment = full opacity, inactive = 50% opacity
- Smooth width transition on segment change

**Name Overlay:**
- Larger, bolder name text
- More subtle gradient (less dark, more transparent)
- Add job/occupation line below name (if available)
- Verification badge inline with name (larger, more prominent blue)

### Files to Modify
- `src/components/discover/ProfileCard.tsx`

---

## 2. Swipe Indicator Refinement

### Current State
- LIKE/NOPE appear as colored overlays with bordered text
- Covers most of the card

### Proposed Changes
- Make stamps smaller and positioned in the corner (not centered)
- Add subtle rotation (tilted stamp effect)
- Use a more "stamped" visual style with border + fill
- LIKE = green stamp top-right, NOPE = red stamp top-left

### Files to Modify
- `src/components/discover/ProfileCard.tsx`

---

## 3. Action Buttons Polish

### Current State
- 4 buttons (Rewind, Pass, Super Like, Like) with varying sizes
- Keyboard hints shown below

### Proposed Changes
- Tighten spacing between buttons
- Make Like button larger and more prominent (gradient background like Bumble's heart)
- Add subtle shadow/glow to primary action button
- Hide Rewind button if not functional (or show as locked/premium feature)
- Move keyboard hints to tooltip on hover (less visual clutter)

### Files to Modify
- `src/components/discover/SwipeActions.tsx`

---

## 4. Photo Segment Bars (Stories-Style)

### Design Specification
```text
┌────────────────────────────────────────┐
│  ▬▬▬▬▬▬  ▬▬▬▬▬▬  ▬▬▬▬▬▬  ▬▬▬▬▬▬  │  <- Top segment bars
│                                        │
│                                        │
│            [ PHOTO ]                   │
│                                        │
│  ┌─────────────────────────────────┐  │
│  │  Sarah, 28  ✓                   │  │  <- Name overlay
│  │  📍 Miami • 5 miles away        │  │
│  └─────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### Technical Implementation
- Replace photo dots with horizontal bars
- Each bar = `flex-1` width within a flex container
- Active bar = `bg-white` with subtle glow
- Inactive bars = `bg-white/40`
- Transition: width stays same, opacity animates

---

## 5. Right Sidebar Refinement (Desktop)

### Current Issues
- Three separate sections competing for attention
- Heavy borders and cards

### Proposed Changes
- Simplify to two main sections: "Who Likes You" and "Matches"
- Remove conversation preview (users can click to Messages page)
- Cleaner card styling with less borders
- Larger, more tappable avatars
- Add hover states with scale animation

### Files to Modify
- `src/components/discover/RightSidebar.tsx`

---

## 6. Quick Filters Button Redesign

### Current State
- Filter icon button that opens a sheet

### Proposed Changes
- Add a pill-shaped button with icon + "Filters" text
- Show active filter count as badge
- Position above card, left-aligned (Bumble style)
- Add subtle background when filters are active

### Files to Modify
- `src/components/discover/QuickFiltersSheet.tsx`
- `src/pages/app/Discover.tsx`

---

## 7. Empty State Polish

### Current State
- Basic centered content with muted icon

### Proposed Changes
- Add illustration or animated fishing hook
- More engaging copy
- Prominent "Adjust Filters" CTA
- "Invite Friends" secondary action

### Files to Modify
- `src/pages/app/Discover.tsx`

---

## Technical Summary

### Files to Create
- None (all refinements to existing components)

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/discover/ProfileCard.tsx` | Segment bars, stamp styling, name overlay, remove bio |
| `src/components/discover/SwipeActions.tsx` | Tighter spacing, button sizing, hide non-functional rewind |
| `src/components/discover/RightSidebar.tsx` | Simplify sections, cleaner styling |
| `src/components/discover/QuickFiltersSheet.tsx` | Pill button design with filter count |
| `src/pages/app/Discover.tsx` | Updated layout, empty state |

---

## Visual Reference

### Before/After: Profile Card

```text
BEFORE:                              AFTER:
┌─────────────────────┐              ┌───────────────────────────┐
│  ● ● ● ●            │              │  ▬▬▬▬ ▬▬▬▬ ▬▬▬▬ ▬▬▬▬     │
│                     │              │                           │
│      [Photo]        │              │        [Photo]            │
│                     │              │                           │
│  ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼  │              │  ┌───────────────────┐    │
│  Name, Age          │              │  │ Name, 28 ✓        │    │
│  📍 Location        │              │  │ 📍 Miami • 5mi    │    │
├─────────────────────┤              │  └───────────────────┘    │
│  Bio text here...   │              └───────────────────────────┘
│                     │              
│  [Tag] [Tag] [Tag]  │              (No bio section - cleaner!)
└─────────────────────┘              
```

### Before/After: Swipe Indicators

```text
BEFORE:                    AFTER:
┌─────────────────┐        ┌─────────────────┐
│                 │        │      ┌─────┐    │
│   ┌────────┐    │        │      │LIKE │    │
│   │  LIKE  │    │        │      └─────┘    │
│   └────────┘    │        │                 │
│                 │        │    [Photo]      │
│   (Centered)    │        │                 │
└─────────────────┘        └─────────────────┘
                           (Corner positioned, tilted)
```

---

## Implementation Priority

| Priority | Change | Impact | Effort |
|----------|--------|--------|--------|
| 1 | Photo segment bars | High | Low |
| 2 | Remove bio from card | High | Low |
| 3 | Swipe stamp repositioning | Medium | Low |
| 4 | Action button tightening | Medium | Low |
| 5 | Right sidebar simplification | Medium | Medium |
| 6 | Quick filters pill button | Low | Low |
| 7 | Empty state enhancement | Low | Low |

---

## Estimated Implementation Time
- Phase 1 (Card polish): 30-45 minutes
- Phase 2 (Sidebar & buttons): 30 minutes
- Phase 3 (Fine-tuning): 20 minutes

Total: ~1.5-2 hours for all design optimizations
