## Plan: 3 Changes to FishX

### 1. Remove the "Find Your Date" dating card from the landing page

The desktop landing page (`src/pages/Index.tsx`, lines 396-433) has a "Find Your Date" card with couples photos (`datingCouple1`, `datingCouple2`, `coupleFishing`). This will be completely removed so visitors don't think FishX is a dating site. The "Find Fishing Buddies" card will remain and be made full-width.

The unused couple image imports (`coupleFishing`, `datingCouple1`, `datingCouple2`) will also be cleaned up.

### 2. Remove dating questions from the onboarding flow

Currently, the onboarding flow includes `dating_preference` and `preference_sync` steps for dating/both modes. These steps ask "interested in men/women", age range, looking for, etc.

Changes:

- Remove `dating_preference` and `preference_sync` from the step configs in `Onboarding.tsx` for all account modes
- The onboarding will default all users to **fishing-only** mode, skipping dating setup entirely
- Users can activate dating later in-app via the account switcher (existing `/app/dating-setup` flow)

### 3. Add "who liked this" modal on feed posts

When a user taps the like count on a post, a modal/sheet will open showing a list of users who liked it. Each user row will show their avatar, name, and a Follow/Invite button.

Changes:

- Create a new `LikersModal` component that fetches likers from the `post_likes` table
- In `FeedPost.tsx`, make the likes count clickable to open this modal
- Also, below the action icons 'like', 'comment', 'repost', etc (not inside the section), add a feature that's says liked by 'Joshua Campbell and others' . This should happen when a user has a following that liked the post
- Each liker row will link to their profile and show a follow button

### Technical details

**Files to modify:**

- `src/pages/Index.tsx` — remove dating card section and couple image imports
- `src/pages/Onboarding.tsx` — remove `dating_preference` and `preference_sync` from all step configs, default account mode to `fishing`
- `src/components/feed/FeedPost.tsx` — make likes count clickable, open likers modal

**Files to create:**

- `src/components/feed/LikersModal.tsx` — modal showing who liked a post with follow buttons