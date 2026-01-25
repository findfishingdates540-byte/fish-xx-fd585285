

# Enhance Feed Post Actions to Match Instagram

## Overview
Expand the actions row to include more engagement options like Instagram, adding share, send, and bookmark icons with inline counts for better engagement metrics visibility.

## Visual Changes

### Current State
- Only Heart and Comment icons
- Counts displayed separately below

### Proposed New State
```text
+-----------------------------------------------+
| [Heart] [Comment] [Share] [Send]   [Bookmark] |
|  17.3K    251      603     14K                |
+-----------------------------------------------+
```

### New Icons to Add
1. **Share/Repost** (Repeat icon) - For sharing posts
2. **Send** (Send icon) - For sending to friends via DM  
3. **Bookmark** (Bookmark icon) - For saving posts to collections

### Layout Structure
- Left side: Heart, Comment, Share, Send (with counts below each)
- Right side: Bookmark icon (far right, no count)
- Use `justify-between` to push bookmark to the right

## Technical Details

### File: `src/components/feed/FeedPost.tsx`

**1. Import additional icons:**
```tsx
import { Heart, MessageCircle, Repeat2, Send, Bookmark } from 'lucide-react';
```

**2. Update Actions Row:**
```tsx
<div className="px-3 pt-3 flex items-center justify-between">
  {/* Left actions group */}
  <div className="flex items-center gap-4">
    {/* Heart with count */}
    <button className="flex flex-col items-center">
      <Heart className="h-6 w-6" />
      <span className="text-xs">{formatCount(post.likes_count)}</span>
    </button>
    
    {/* Comment with count */}
    <button className="flex flex-col items-center">
      <MessageCircle className="h-6 w-6" />
      <span className="text-xs">{post.comments_count}</span>
    </button>
    
    {/* Share */}
    <button className="flex flex-col items-center">
      <Repeat2 className="h-6 w-6" />
    </button>
    
    {/* Send */}
    <button className="flex flex-col items-center">
      <Send className="h-6 w-6" />
    </button>
  </div>
  
  {/* Bookmark on far right */}
  <button>
    <Bookmark className="h-6 w-6" />
  </button>
</div>
```

**3. Add count formatter for large numbers:**
```tsx
const formatCount = (count: number) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};
```

### Optional Future Enhancements
- Track bookmark state per user (requires database)
- Track share counts (requires database)
- Native share sheet integration for Send button

## Summary of Changes
1. Add Share (Repeat2), Send, and Bookmark icons from lucide-react
2. Restructure actions row with left group and right bookmark
3. Add inline counts below Heart and Comment icons
4. Add count formatter for K/M suffixes
5. Remove separate "likes" row since count is now inline

