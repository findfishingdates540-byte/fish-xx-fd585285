

# Beautify the Bottom Pill Nav

## What changes

### 1. Frosted glass effect
Replace the solid white `bg-background` with a glassmorphic backdrop blur. The pill becomes semi-transparent with `backdrop-blur-xl` and a subtle white/dark overlay, giving it a modern floating feel.

### 2. Subtle inner shadow and refined border
Drop the flat `border-border` stroke on SVG paths and CSS bars. Instead, apply a soft `shadow-lg` on the outer container and use a thinner, semi-transparent border (`border-white/20` in light, `border-white/10` in dark) for depth.

### 3. Active tab indicator dot
Instead of just bolding the active icon/label, add a small colored dot (4px) below the label for the active tab. This gives a clear, elegant active state without visual clutter.

### 4. Plus button glow ring
Add a subtle pulsing ring around the center Create button using `ring-4 ring-primary/10` and an `animate-pulse` on the ring only, drawing attention without being distracting.

### 5. Smoother notch curve
Refine the SVG notch path to use a wider, shallower arc (increase width from 88px to 96px, adjust control points) so the curve feels more organic and less pinched.

## Technical details

**File**: `src/components/layout/BottomNav.tsx`

- `PillBackground`: Update SVG `fill` classes to use `fill-background/80` (semi-transparent). Add `backdrop-blur-xl` to the outer container. Replace `stroke-border` with `stroke-white/15`. Widen notch SVG from 88px to 96px and adjust flat bar calc offsets.
- Active dot: In `renderNavItem`, add a `<div>` with `h-1 w-1 rounded-full bg-primary` below the label when `isActive`.
- Plus button: Add `ring-4 ring-primary/10` class. Remove the heavy `shadow-xl` in favor of `shadow-lg`.
- Adjust center spacer from `w-[68px]` to `w-[76px]` to match wider notch.

No new dependencies. All changes are CSS/SVG-only in a single file.

