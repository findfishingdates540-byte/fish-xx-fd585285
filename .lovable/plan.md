

# Update Mobile Home Landing to Use New Images

## Problem
The `MobileHomeLanding.tsx` component uses only one old image (`mobile-hero-couple.jpg`). The desktop home page (`Index.tsx`) uses the full set of newer images (hero carousel, fishing photos, dating/buddy photos) but none of these appear on mobile.

## Plan

### 1. Add a hero image carousel to MobileHomeLanding
Replace the single static hero image with a rotating carousel using the three hero images (`hero-fishing-1.jpg`, `hero-fishing-2.jpg`, `hero-fishing-3.jpg`) -- the same ones the desktop version uses. Auto-rotate every 4 seconds with a smooth crossfade transition.

### 2. Add a photo collage/grid section below the buttons
Add a small visual section showcasing the fishing community using a subset of the fishing photos (`fishing-photo-1` through `fishing-photo-4`), displayed as a compact 2x2 rounded grid or horizontal scroll strip -- keeping the mobile layout clean and fast-loading.

### 3. Keep layout compact
The current mobile landing is tight and well-structured. The carousel replaces the existing hero 1:1, and the photo grid slots in between the social login buttons and the terms text, or just above the buttons as social proof.

## Files to modify

| File | Change |
|------|--------|
| `src/components/home/MobileHomeLanding.tsx` | Import new images, add hero carousel with auto-rotation, add photo grid section |

