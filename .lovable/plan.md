

## Fix Mobile Swipe Gestures for Profile Card

### Summary
Enable full-card swiping on Android by optimizing touch event handling. The scrollable detail view (when you tap a card) is a **separate component** (`MobileProfileDetail`), so we can safely disable vertical scrolling on the main card.

### Changes

**File: `src/components/discover/ProfileCard.tsx`**

| Section | Current | After |
|---------|---------|-------|
| Drag physics | `dragElastic={0.9}` | `dragElastic={0.5}` with `bounceStiffness: 650`, `bounceDamping: 38` |
| GPU acceleration | None | `transform-gpu` class + `willChange: 'transform'` style |
| Bio container | `overflow-y-auto` on mobile | Remove scrolling, add `touch-none` |

### Technical Details

1. **Update motion.div drag settings** (line ~110-125):
   - Add `willChange: 'transform'` to style prop for GPU optimization
   - Change `dragElastic` from `0.9` to `0.5` for snappier response
   - Add `dragTransition={{ bounceStiffness: 650, bounceDamping: 38 }}`
   - Add `transform-gpu` to className for hardware acceleration

2. **Update bio/interests container** (line ~271):
   - Remove `overflow-y-auto` from mobile styling
   - Add `touch-none` class to prevent touch event interception
   - Change from `flex-1 overflow-y-auto` to `flex-1 touch-none` on mobile

### Why This Works
- **Clicking the card** → Opens `MobileProfileDetail` sheet (fully scrollable)
- **Swiping the card** → Now works on the entire card surface (image + bio)
- **No feature loss** → The scrollable detail view is preserved in the separate sheet component

### Expected Result
- Swiping anywhere on the card triggers Pass/Like gestures
- Snappy, responsive card movement with tuned physics
- 60fps smooth animations on Android via GPU acceleration
- Tapping still opens the detailed scrollable profile sheet

