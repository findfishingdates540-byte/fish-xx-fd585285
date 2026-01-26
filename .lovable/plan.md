

# Dating App Optimization Plan (Bumble-Inspired Features)

## Overview

This plan outlines enhancements to bring your dating app closer to Bumble's polished UX, focusing on engagement, urgency, and conversation flow mechanics.

---

## 1. "Your Move" Conversation Status Badges

**Problem:** Users don't know whose turn it is to reply, leading to stalled conversations.

**Solution:** Add visual badges showing conversation responsibility.

### Implementation Details

- Add a `last_sender_id` field tracking to conversations
- Display "Your move" badge (amber/yellow) when the other person sent the last message
- Display no badge (or subtle "Waiting" indicator) when you sent the last message
- Badge styling: Rounded pill with amber background, dark text

### Files to Modify
- `src/hooks/use-dating-conversations.ts` - Add `last_sender_id` to RPC return data
- `src/pages/app/Messages.tsx` - Render badges in conversation list
- `src/components/chat/ChatSidebar.tsx` - Add badge component to conversation items

### UI Placement
Position the badge to the right of the user's name in the conversation list, exactly like Bumble's layout.

---

## 2. Match/Conversation Expiration System

**Problem:** Matches can sit indefinitely, reducing engagement urgency.

**Solution:** Implement 24-48 hour expiration timers for matches without messages.

### Implementation Details

**Database Changes:**
- Add `expires_at` column to `matches` table (nullable, set when match occurs)
- Create `match_expiration_settings` in app_settings for configurable timeouts

**Backend Logic:**
- Edge Function: `process-match-expirations` - Runs hourly to mark expired matches
- Set `expires_at = matched_at + 24 hours` when a match is created
- Extend or remove expiration when first message is sent

**Frontend Display:**
- Show countdown timer: "Expires in 4 hours" below conversation preview
- Visual urgency: Amber text when <6h remaining, Red when <1h
- Animate expiration indicator subtly

### Files to Create
- `supabase/functions/process-match-expirations/index.ts`
- `src/hooks/use-match-expiration.ts`

### Files to Modify
- `src/components/messages/NewMatchesRow.tsx` - Add countdown display
- `src/pages/app/Messages.tsx` - Show expiration in conversation list
- Database migration for `expires_at` column

---

## 3. Enhanced Match Queue UI

**Problem:** Match queue is basic compared to Bumble's prominent, count-displaying design.

**Solution:** Make the match queue more visually prominent with counts and improved layout.

### Implementation Details

- Add total match count badge (like Bumble's "50" badge on first card)
- Show "X New" indicator more prominently
- Add subtle animations for new matches appearing
- Improve card sizing and spacing in the horizontal scroll

### Files to Modify
- `src/components/messages/NewMatchesRow.tsx`
- `src/components/messages/LikesCard.tsx`

### Design Specifications
- First card: Large count badge (gradient background)
- Match cards: 16×20 aspect ratio with name below
- Online status: Green dot bottom-right of avatar

---

## 4. Quick Filters Above Profile Card

**Problem:** Users must navigate to settings to change discovery preferences.

**Solution:** Add a "Filters" button above the profile card for quick access.

### Implementation Details

- "Filters" button with icon at top of Discover page
- Opens a bottom sheet (mobile) or dropdown (desktop) with:
  - Age range slider
  - Distance range slider  
  - Looking for toggle (Date/Buddies)
- Persist filter changes immediately

### Files to Create
- `src/components/discover/QuickFiltersSheet.tsx`

### Files to Modify
- `src/pages/app/Discover.tsx` - Add filters button and sheet trigger
- `src/hooks/use-discover-profiles.ts` - Accept filter parameters

---

## 5. Block and Report Quick Access

**Problem:** No easy way to report/block from the main profile card view.

**Solution:** Add "Block and report" link below profile cards.

### Implementation Details

- Subtle link/button below the swipe action buttons
- Opens a report modal with reason selection:
  - Inappropriate photos
  - Fake profile/scam
  - Underage
  - Offensive behavior
  - Other

### Files to Create
- `src/components/discover/ReportProfileSheet.tsx`

### Files to Modify
- `src/pages/app/Discover.tsx` - Add report link below SwipeActions

---

## 6. Profile Detail Panel (Right Side)

**Problem:** Right sidebar exists but could better mirror Bumble's info-rich layout.

**Solution:** Enhance the right panel with more profile details.

### Bumble-Inspired Additions
- Larger name + age with verification badge
- Job/company title (like "Owner at Sundevil...")
- "Photo verified" badge styling
- Additional profile prompts/answers
- Shared interests/compatibility indicators

### Files to Modify
- `src/components/discover/RightSidebar.tsx` - If used for profile details
- `src/components/discover/ProfileDetailView.tsx` - Enhance content sections

---

## 7. Keyboard Navigation Improvements

**Current:** Arrow keys work for like/pass.

**Enhancement:** Add visible keyboard shortcut hints on desktop.

### Implementation Details
- Show small hint icons near action buttons: "←" "→" "↑"
- Add tooltip on hover explaining shortcuts

### Files to Modify
- `src/components/discover/SwipeActions.tsx` - Add keyboard hint labels

---

## Technical Architecture Summary

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Changes                          │
├─────────────────────────────────────────────────────────────────┤
│  Messages Page                                                   │
│  ├── "Your move" badges in conversation list                    │
│  ├── Expiration countdown timers                                │
│  └── Enhanced match queue with counts                           │
│                                                                  │
│  Discover Page                                                   │
│  ├── Quick Filters button + sheet                               │
│  ├── Block/Report link below actions                            │
│  └── Keyboard shortcut hints                                    │
│                                                                  │
│  Components                                                      │
│  ├── YourMoveBadge.tsx (new)                                    │
│  ├── ExpirationTimer.tsx (new)                                  │
│  ├── QuickFiltersSheet.tsx (new)                                │
│  └── ReportProfileSheet.tsx (new)                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Backend Changes                           │
├─────────────────────────────────────────────────────────────────┤
│  Database                                                        │
│  ├── matches.expires_at column                                  │
│  └── Index on expires_at for cleanup queries                    │
│                                                                  │
│  Edge Functions                                                  │
│  └── process-match-expirations (scheduled)                      │
│                                                                  │
│  RPC Updates                                                     │
│  └── get_dating_conversations → include last_sender_id          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Priority

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| 1 | "Your move" badges | High | Low |
| 2 | Quick Filters | High | Medium |
| 3 | Match expiration timers | High | Medium |
| 4 | Block/Report access | Medium | Low |
| 5 | Enhanced match queue | Medium | Low |
| 6 | Keyboard hints | Low | Low |

---

## Estimated Timeline

- **Phase 1** (Quick wins): "Your move" badges, Block/Report, Keyboard hints - 1-2 hours
- **Phase 2** (Core features): Quick Filters, Enhanced match queue - 2-3 hours  
- **Phase 3** (Advanced): Match expiration system with backend - 3-4 hours

Total estimated implementation: 6-9 hours

