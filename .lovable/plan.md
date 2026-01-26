

# Fix: Exact Bumble Design Implementation

## Problem Analysis

After reviewing the Bumble screenshot carefully, I identified these critical issues:

### Issue 1: Logo Placement (Wrong)
**Current:** Logo is inside the left sidebar header with brand name
**Bumble:** Logo is in a minimal top bar above the entire layout, just the "bumble" text/logo

### Issue 2: Filter Button (Wrong)
**Current:** Visible "Filters" pill button above the card
**Bumble:** No visible filter button - cleaner interface

### Issue 3: Profile Card is NOT Unified (Critical)
**Current:** `ProfileCard` (photo) and `ProfileInfoPanel` are separate components with visual gap
**Bumble:** Photo and info panel are ONE connected card - they share the same container with no gap, creating a seamless visual unit

```text
CURRENT (Wrong):
┌──────────────┐    ┌──────────────┐
│              │    │              │
│   [Photo]    │    │  Info Panel  │
│              │    │              │
└──────────────┘    └──────────────┘
   Gap between them - TWO cards

BUMBLE (Correct):
┌──────────────────────────────────┐
│              │                   │
│   [Photo]    │   Info Panel      │
│              │                   │
└──────────────────────────────────┘
   ONE unified card - no gap
```

---

## Technical Solution

### 1. Create Unified Profile Card Component

Merge the photo section and info panel into a single `ProfileCard` component that renders both as one connected card.

**New Structure:**
```tsx
<div className="rounded-2xl overflow-hidden shadow-lg flex">
  {/* Left: Photo Section */}
  <div className="flex-[3] relative">
    <img src={photo} className="w-full h-full object-cover" />
    {/* Photo navigation, badges, etc. */}
  </div>
  
  {/* Right: Info Panel (desktop only) */}
  <div className="hidden lg:flex flex-[2] bg-amber-50/80 p-6 flex-col">
    <h2>Name, Age ✓</h2>
    <Badge>Photo verified</Badge>
    <p>Occupation</p>
    {/* ... */}
  </div>
</div>
```

### 2. Remove Separate ProfileInfoPanel

Since the info panel is now integrated into ProfileCard, remove the separate `ProfileInfoPanel` component from the layout.

### 3. Fix Sidebar Logo

Move the logo to a minimal top bar or remove it from the sidebar header entirely, matching Bumble's clean sidebar that focuses on conversations.

### 4. Remove/Hide Filters Button

Remove the prominent QuickFiltersSheet button - can be accessed via settings or a subtle icon instead.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/discover/ProfileCard.tsx` | Integrate info panel directly into card as a connected section |
| `src/pages/app/Discover.tsx` | Remove `ProfileInfoPanel` component, simplify layout, remove filters button |
| `src/components/discover/DiscoverSidebar.tsx` | Remove or minimize logo header |
| `src/components/discover/ProfileInfoPanel.tsx` | Delete or deprecate this component |

---

## New ProfileCard Structure (Desktop)

```text
┌─────────────────────────────────────────────────────────────┐
│  ▬▬▬▬ ▬▬▬▬ ▬▬▬▬                                            │
│ ┌─────────────────────────────┬───────────────────────────┐ │
│ │                             │                           │ │
│ │                             │   Chris, 55 ✓             │ │
│ │                             │   Photo verified          │ │
│ │        [Photo]              │                           │ │
│ │                             │   Owner at Sundevil       │ │
│ │                             │   Garage Door Sales       │ │
│ │                             │                           │ │
│ │    [LIKE stamp]             │   [●●●]                   │ │
│ └─────────────────────────────┴───────────────────────────┘ │
│                                                             │
│              [X]      [★]      [✓]                          │
│                                                             │
│              Block and report                               │
└─────────────────────────────────────────────────────────────┘
        Photo + Info = ONE card (flex row inside)
```

---

## Mobile Behavior

On mobile, the info panel remains hidden - only the photo section of the card is shown (full-screen card). This maintains the swipe-focused mobile experience.

---

## Updated Discover.tsx Layout

```tsx
// Simplified structure
<div className="flex h-screen">
  {/* Left Sidebar - Conversations (no logo header) */}
  <DiscoverSidebar />
  
  {/* Main Content */}
  <main className="flex-1 flex flex-col items-center justify-center lg:ml-80">
    {/* Unified Profile Card with integrated info panel */}
    <ProfileCard 
      profile={currentProfile} 
      showInfoPanel={!isMobile}  // Show info section on desktop only
    />
    
    {/* Action Buttons */}
    <SwipeActions />
    
    {/* Block and report link */}
    <ReportProfileSheet />
  </main>
</div>
```

---

## Implementation Steps

1. **Update ProfileCard.tsx:**
   - Add `showInfoPanel` prop
   - Restructure as a flex row with photo section (left) and info section (right)
   - Info section uses warm amber background
   - Both sections share the same rounded card container

2. **Update DiscoverSidebar.tsx:**
   - Remove or minimize the logo/brand header section
   - Keep focus on Match Queue and Conversations

3. **Update Discover.tsx:**
   - Remove `ProfileInfoPanel` import and usage
   - Remove `QuickFiltersSheet` from the visible UI (or make it icon-only in header)
   - Simplify the main content layout

4. **Delete ProfileInfoPanel.tsx:**
   - No longer needed as a separate component

---

## Expected Result

After implementation:
- Clean sidebar with Match Queue + Conversations (minimal/no header)
- Unified profile card where photo and info panel are visually connected
- Action buttons below the unified card
- Matches Bumble's exact layout aesthetic

