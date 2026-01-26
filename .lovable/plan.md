

# Bumble 2-Column Layout Redesign

## Overview

Redesign from the current 3-column layout to Bumble's 2-column layout with a conversation-focused left sidebar and a wide main area with integrated profile info.

---

## Layout Comparison

### Current (3-Column):
```text
┌──────────────┬───────────────────┬──────────────┐
│  Navigation  │   Profile Card    │  Who Likes   │
│  Sidebar     │   (centered)      │  + Matches   │
│  (260px)     │                   │  (288px)     │
└──────────────┴───────────────────┴──────────────┘
```

### Target (2-Column like Bumble):
```text
┌────────────────────┬───────────────────────────────────────────┐
│  Match Queue       │                                           │
│  [50][●][●][●]     │        Profile Card + Info Panel          │
│  ────────────────  │   ┌────────────────┬─────────────────┐    │
│  Conversations     │   │                │                 │    │
│  [●] Name [move]   │   │    [Photo]     │  Chris, 55 ✓    │    │
│  [●] Name [move]   │   │                │  Photo verified │    │
│  [●] Name [move]   │   │   [X] [★] [✓]  │  Owner at...    │    │
│  ...               │   └────────────────┴─────────────────┘    │
└────────────────────┴───────────────────────────────────────────┘
     (~320px)                     (Remaining width)
```

---

## 1. Left Sidebar Transformation

Replace navigation-focused sidebar with conversation-focused sidebar like Bumble.

### New Structure:
```text
┌─────────────────────────┐
│  [Logo] bumble          │  <- Brand header (compact)
├─────────────────────────┤
│  Match Queue (7)    >   │  <- Section with count
│  [50] [●] [●] [●] [●]   │  <- Horizontal avatars, first has count
├─────────────────────────┤
│  ▼ Conversations        │  <- Collapsible section
├─────────────────────────┤
│  [●] Enrique  [Your move]   │
│      Hello... How was...    │
│      ⏱ 4h left              │  <- Expiration timer
├─────────────────────────┤
│  [●] Jason    [Your move]   │
│      Hiiii. When are...     │
│  ...                        │
├─────────────────────────┤
│  [●] Profile  [⚙] [👤+]    │  <- Bottom: profile, settings, invite
└─────────────────────────┘
```

### Implementation Details:
- Increase sidebar width from 240px to ~320px to fit conversation previews
- Remove navigation links (Discover, Likes, Matches, Messages)
- Add horizontal Match Queue row with blurred likes count
- Add scrollable Conversations list with "Your move" badges
- Integrate existing `useDatingConversations` data
- Keep compact user profile + settings at bottom

### Files to Modify:
- `src/components/discover/DiscoverSidebar.tsx` - Complete redesign

---

## 2. Remove Right Sidebar

Remove the separate right sidebar column entirely. Its content will be integrated into the main area.

### Implementation Details:
- Remove `RightSidebar` from the Discover page layout
- Move "Who Likes You" data into left sidebar Match Queue
- Matches already displayed in left sidebar conversations

### Files to Modify:
- `src/pages/app/Discover.tsx` - Remove RightSidebar, adjust layout

---

## 3. Main Area with Integrated Profile Info Panel

Create a horizontal split in the main area: profile card on left, info panel on right.

### Design:
```text
┌─────────────────────────────────────────────────────────────┐
│                          [Filters]                          │  <- Top toolbar
├─────────────────────────────┬───────────────────────────────┤
│                             │                               │
│                             │   Chris, 55 ✓                 │
│                             │   Photo verified              │
│       [Profile Photo]       │                               │
│                             │   Owner at Sundevil Garage    │
│                             │   Door Sales & Repair         │
│                             │                               │
│                             │   [Interest] [Interest]       │
│   [X]    [★]    [✓]         │                               │
│                             │                               │
│   Block and report          │                               │
└─────────────────────────────┴───────────────────────────────┘
         (~60%)                        (~40%)
```

### Implementation Details:
- Main content area uses `flex` with card taking ~60% and info panel ~40%
- Profile info panel has warm cream/yellow background (`bg-amber-50/80`)
- Panel shows: Name + age + verification, "Photo verified" badge, occupation, interests
- On tablet/smaller screens, info panel hides and full card is shown

### New Component:
- `src/components/discover/ProfileInfoPanel.tsx` - Right-side info panel

### Files to Modify:
- `src/pages/app/Discover.tsx` - New layout structure with info panel

---

## 4. Action Buttons Update

Match Bumble's button style exactly.

### Current vs Target:
```text
Current:  [X]  [★]  [♥]      →     Target:  [X]  [★]  [✓]
          red  blue green                    gray amber gray
```

### Implementation:
- Pass button: White/gray background, gray X icon
- Super Like button: Amber/yellow background, white star icon
- Like button: White/gray background, gray checkmark icon (NOT heart)

### Files to Modify:
- `src/components/discover/SwipeActions.tsx` - Update icons and colors

---

## 5. Match Queue Component

Horizontal row of match avatars with likes count on first card.

### Design:
```text
[50]  [●]  [●]  [●]  [●]  [●]  →
 ↑     ↑
 Blurred likes count   Match avatars with online dots
```

### Implementation:
- First "card" shows likes count (blurred for non-premium)
- Circular avatars with green online dots
- Horizontal scroll
- Click navigates to chat or likes page

### Files to Modify:
- Integrated into `DiscoverSidebar.tsx` redesign

---

## 6. Conversation List in Sidebar

Embed conversation list directly in the left sidebar.

### Features:
- Avatar with online dot
- Name + "Your move" badge (amber)
- Message preview (truncated)
- Expiration timer ("4h left")
- Click to open chat

### Data Source:
- Reuse `useDatingConversations` hook (already exists)
- Already includes `last_sender_id` for "Your move" logic

---

## Technical Summary

### Files to Modify:

| File | Changes |
|------|---------|
| `src/components/discover/DiscoverSidebar.tsx` | Complete redesign - Match Queue + Conversations |
| `src/components/discover/SwipeActions.tsx` | Checkmark icon, amber star, gray styling |
| `src/pages/app/Discover.tsx` | 2-column layout, integrated info panel, remove RightSidebar |

### Files to Create:

| File | Purpose |
|------|---------|
| `src/components/discover/ProfileInfoPanel.tsx` | Warm cream panel with profile details |
| `src/components/discover/SidebarConversationItem.tsx` | Reusable conversation row for sidebar |
| `src/components/discover/SidebarMatchQueue.tsx` | Horizontal match queue with likes count |

### Components to Reuse:
- `YourMoveBadge` - Already created
- `ExpirationTimer` - Already created
- `useDatingConversations` - Already has last_sender_id
- `useMatchExpiration` - Already tracks expiration

---

## Visual Transformation

### Before:
```text
┌──────────┬──────────────────┬──────────┐
│ Nav      │    Card          │ Matches  │
│ Sidebar  │    [Photo]       │ Sidebar  │
│          │    [X][★][♥]     │          │
│          │                  │          │
└──────────┴──────────────────┴──────────┘
  260px        flexible          288px
```

### After (Bumble-style):
```text
┌─────────────────────┬───────────────────────────────────┐
│ Match Queue         │        [Filters]                  │
│ [50][●][●][●]       │  ┌──────────────┬───────────────┐ │
│ ─────────────────   │  │   [Photo]    │  Chris, 55 ✓  │ │
│ Conversations       │  │              │  Verified ✓   │ │
│ [●] Name  [move]    │  │              │  Owner at...  │ │
│ [●] Name  [move]    │  │  [X][★][✓]   │               │ │
│ [●] Name  [move]    │  └──────────────┴───────────────┘ │
│ ─────────────────   │                                   │
│ [Profile] [⚙]       │        Block and report           │
└─────────────────────┴───────────────────────────────────┘
      320px                      remaining
```

---

## Mobile Behavior

On mobile, the layout remains single-column (card only), since Bumble's 2-column is desktop-only. The left sidebar and info panel are hidden.

---

## Implementation Priority

| Priority | Change | Impact | Effort |
|----------|--------|--------|--------|
| 1 | Left sidebar redesign (Match Queue + Conversations) | High | High |
| 2 | Remove right sidebar, update main layout | High | Medium |
| 3 | Create ProfileInfoPanel component | High | Medium |
| 4 | Update action buttons (X, Star, Check) | Medium | Low |
| 5 | Polish & fine-tuning | Low | Low |

---

## Estimated Implementation Time

- **Phase 1**: Left sidebar with Match Queue + Conversations (~45-60 min)
- **Phase 2**: Main area with ProfileInfoPanel (~30-45 min)
- **Phase 3**: Layout integration + action buttons (~20-30 min)

**Total: ~2-2.5 hours**

