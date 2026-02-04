
# Instagram-Style Buddy Messages Redesign

## Overview

Redesign the BuddyMessages page to match the Instagram DM interface, featuring:

1. **Online Buddies Row** - Horizontal scrollable avatars showing currently online/active buddies
2. **Filter Tabs** - "Primary", "General", "Requests" pill-shaped filter tabs
3. **Cleaner Conversation List** - Simplified layout with activity status and camera icon
4. **Updated Search** - Visible on mobile with "Filter" button

---

## Visual Layout

```text
┌────────────────────────────────┐
│ [🔍 Search...       ] [Filter] │
├────────────────────────────────┤
│ (Jane)  (Boss)  (Mike)  (...)  │
│   🟢      🟢      🟢           │
│  Jane   BOSS    Mike           │
├────────────────────────────────┤
│ [●Primary 2] [General] [Req's] │
├────────────────────────────────┤
│ ○ Jane Smith               📷  │
│   Active now                   │
├────────────────────────────────┤
│ ○ Mike Johnson             📷  │
│   Active 4h ago                │
└────────────────────────────────┘
```

---

## Implementation Plan

### 1. Create Online Buddies Row Component

New file: `src/components/messages/OnlineBuddiesRow.tsx`

- Horizontal scrollable row showing online buddies only
- 56-60px circular avatars with green online indicator ring
- Truncated names below avatars (max 8 characters)
- Clicking navigates directly to that buddy's chat
- Shows "No buddies online" if none are active

### 2. Add Filter Tabs

Replace the collapsible "Message Requests" section with horizontal tabs:

| Tab | Description |
|-----|-------------|
| **Primary** | Main conversations with unread count badge |
| **General** | Secondary/muted conversations (optional) |
| **Requests** | Pending message requests with count |

- Pill-shaped buttons with rounded-full styling
- Active tab has filled background (bg-foreground text-background)
- Inactive tabs have outline/secondary styling

### 3. Simplify Conversation Item Design

Update each conversation row to:

| Current | New |
|---------|-----|
| "BUDDY" badge | Remove (redundant in buddy messages) |
| Last message preview | Remove for cleaner look |
| Formatted timestamp | Replace with activity status |
| Unread badge | Keep, move to right side |
| Fish emoji indicator | Remove |
| - | Add Camera icon on right |

Activity status examples:
- "Active now" (green dot visible)
- "Active 2h ago"
- "Active yesterday"

### 4. Update Search Bar

- Make visible on all screen sizes (remove `hidden lg:block`)
- Add "Filter" text button on the right side
- Rounded input styling with bg-muted

---

## Technical Details

### New State Management

```typescript
// Filter tab state
const [activeTab, setActiveTab] = useState<'primary' | 'general' | 'requests'>('primary');

// Filter online buddies for the top row
const onlineBuddies = useMemo(() => 
  conversations.filter(conv => isOnline(conv.buddyUserId)),
  [conversations, isOnline]
);
```

### OnlineBuddiesRow Component

```typescript
interface OnlineBuddy {
  buddyId: string;
  displayName: string;
  photo: string;
}

function OnlineBuddiesRow({ 
  buddies, 
  onSelect 
}: { 
  buddies: OnlineBuddy[]; 
  onSelect: (buddyId: string) => void;
})
```

### Conversation Item Simplification

Before:
```tsx
<Badge>BUDDY</Badge>
<p>{conv.lastMessage}</p>
<span>{formatTime(conv.lastMessageTime)}</span>
<span>🎣</span>
```

After:
```tsx
<p className="font-semibold">{conv.displayName}</p>
<p className="text-muted-foreground text-sm">
  {online ? 'Active now' : `Active ${formatLastSeen(lastSeen)}`}
</p>
<Camera className="h-5 w-5 text-muted-foreground" />
```

---

## File Changes Summary

| File | Action | Changes |
|------|--------|---------|
| `src/components/messages/OnlineBuddiesRow.tsx` | Create | New component for online buddies horizontal scroll |
| `src/pages/app/BuddyMessages.tsx` | Modify | Add online row, filter tabs, simplify conversation items |

---

## Detailed Changes to BuddyMessages.tsx

1. **Add imports**: Camera icon, new OnlineBuddiesRow component
2. **Add state**: `activeTab` for filter tabs
3. **Add memo**: `onlineBuddies` to filter online users
4. **Replace search section**: Show on all sizes, add Filter button
5. **Add OnlineBuddiesRow**: After search, before tabs
6. **Replace Message Requests collapsible**: With horizontal filter tabs
7. **Add tab content switching**: Show requests when Requests tab selected
8. **Simplify conversation items**:
   - Remove BUDDY badge
   - Remove last message preview
   - Show "Active now" / "Active X ago" as subtitle
   - Add Camera icon on right
   - Keep avatar with online indicator
   - Keep unread count badge
