

# Instagram-Style Feed Post Cards

## Overview
Redesign the FeedPost component to match Instagram's card layout with edge-to-edge images, dot indicators for carousels, swipe navigation (no buttons on mobile), and repositioned caption below the actions.

## Visual Changes

### 1. Remove Card Border/Padding for Images
- Remove the Card wrapper's default styling that adds borders
- Make images extend to the full width (edge-to-edge)
- Keep only subtle separator between posts

### 2. Add Carousel Dot Indicators
- Add a `CarouselDots` component to the carousel system
- Display blue dots centered below the image
- Highlight the current slide with a filled blue dot
- Only show dots when there are multiple images

### 3. Remove Arrow Buttons on Mobile/Tablet
- Hide `CarouselPrevious` and `CarouselNext` on mobile/tablet
- Keep arrows visible on desktop only for accessibility
- Embla Carousel already supports swipe gestures by default

### 4. Reposition Caption
- Move caption from above the image to below the actions
- Display as: **username** caption text (Instagram style)
- Add "more" truncation for long captions

## Technical Implementation

### File Changes

**1. `src/components/ui/carousel.tsx`**
- Add new `CarouselDots` component that:
  - Uses the carousel API to track current slide index
  - Renders dot indicators with active state styling
  - Blue color for active dot, gray for inactive

**2. `src/components/feed/FeedPost.tsx`**
- Remove Card border styling, use plain div with border-b separator
- Import and add `CarouselDots` below the image carousel
- Hide `CarouselPrevious`/`CarouselNext` on mobile (`hidden md:flex`)
- Move caption section below actions row
- Update caption format to: `<username> <caption>` inline

### Code Structure

```
Post Container (no card border)
├── Header (avatar, username, time, menu)
├── Image/Video Section (full-bleed)
│   └── Carousel (if multiple images)
│       └── Dot Indicators (centered, below image)
├── Catch Tags (species, weight)
├── Actions Row (heart, comment icons)
└── Caption (username + text, below actions)
```

### Carousel Dots Component
```tsx
// New component in carousel.tsx
const CarouselDots = () => {
  const { api } = useCarousel();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  if (count <= 1) return null;

  return (
    <div className="flex justify-center gap-1.5 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i === current ? "bg-blue-500" : "bg-gray-300"
          )}
          onClick={() => api?.scrollTo(i)}
        />
      ))}
    </div>
  );
};
```

## Summary of Changes
1. **carousel.tsx**: Add `CarouselDots` component with blue active indicator
2. **FeedPost.tsx**: 
   - Remove Card styling, use borderless container
   - Add dot indicators for multi-image posts
   - Hide arrow buttons on mobile (swipe works by default)
   - Move caption below actions with username inline

