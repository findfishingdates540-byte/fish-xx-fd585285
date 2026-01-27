
# Redesign Mobile Discover Layout to Match Bumble

## Overview
Transform the mobile Discover page to match Bumble's clean card-only design where action buttons are hidden and swiping is the primary interaction method.

## Visual Comparison

**Current Design:**
- Card + 3 visible action buttons below

**Target Design (Bumble):**
- Full card only, no visible Pass/Like buttons
- Single SuperLike FAB in bottom-right corner of photo
- Swipe gestures handle Pass (left) and Like (right)

## Implementation Plan

### 1. Remove Action Buttons Row on Mobile
**File: `src/pages/app/Discover.tsx`**

Remove the `BumbleSwipeActions` component from the mobile layout entirely. The swiping functionality already exists on the `ProfileCard` component.

### 2. Add SuperLike FAB to ProfileCard
**File: `src/components/discover/ProfileCard.tsx`**

Add a floating SuperLike button (yellow/golden honeycomb style like Bumble) positioned at the bottom-right of the photo section. This will:
- Be visible only on mobile
- Trigger the `onSuperLike` callback
- Feature a subtle glow/animation on tap

### 3. Update ProfileCard Props
**File: `src/components/discover/ProfileCard.tsx`**

Add an optional `onSuperLike` prop to enable the SuperLike FAB functionality.

### 4. Expand Card to Fill More Space
**File: `src/pages/app/Discover.tsx`**

With action buttons removed, the card can now take up more vertical space, providing a larger photo area and better readability for bio/tags.

---

## Technical Details

### Changes to `src/pages/app/Discover.tsx`:

```tsx
// Mobile Layout - Bumble-style (no action buttons)
<div className="w-full max-w-sm h-full flex flex-col min-h-0">
  <div className="flex-1 min-h-0 bg-background rounded-3xl overflow-hidden shadow-lg">
    <ProfileCard
      profile={{...currentProfile, occupation: currentDetailProfile?.occupation}}
      onSwipeLeft={onPass}
      onSwipeRight={onLike}
      onSuperLike={onSuperLike}  // NEW: Pass super like handler
      onInfoClick={() => setShowMobileDetail(true)}
      className="w-full h-full"
    />
  </div>
  {/* Action buttons REMOVED */}
</div>
```

### Changes to `src/components/discover/ProfileCard.tsx`:

**Add prop:**
```tsx
interface ProfileCardProps {
  // ... existing props
  onSuperLike?: () => void;  // NEW
}
```

**Add SuperLike FAB (inside photo section, bottom-right):**
```tsx
{/* SuperLike FAB - Mobile only */}
{isMobile && onSuperLike && (
  <motion.button
    onClick={(e) => { e.stopPropagation(); onSuperLike(); }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className="absolute bottom-4 right-4 h-12 w-12 rounded-xl bg-foreground shadow-lg flex items-center justify-center z-20"
    aria-label="Super Like"
  >
    <Star className="h-6 w-6 text-background" strokeWidth={1.5} />
  </motion.button>
)}
```

### Update exports
**File: `src/components/discover/index.ts`** - No changes needed

---

## Summary of Files to Modify

| File | Change |
|------|--------|
| `src/pages/app/Discover.tsx` | Remove `BumbleSwipeActions` from mobile, pass `onSuperLike` to ProfileCard |
| `src/components/discover/ProfileCard.tsx` | Add `onSuperLike` prop and SuperLike FAB button |

## Result
- Cleaner, more immersive mobile experience
- Card takes full available height
- Swipe gestures for Pass/Like (already working)
- Single SuperLike FAB in bottom-right corner of photo
- Matches Bumble's minimal mobile UI pattern
