

# Photo Challenge Flow -- Issues Found

## Critical Bug: Stripe Checkout Blocks Payment

The `photo-challenge-checkout` edge function (line 57) throws "You have already entered this challenge" if an entry already exists. But the user flow is:
1. Upload photo → creates `photo_challenge_entries` row with `has_paid: false`
2. Click "Pay Entry Fee" → calls `photo-challenge-checkout`

Step 2 will **always fail** because the entry already exists from step 1. The check should instead verify the entry exists but is unpaid, not reject it.

**Fix**: Change the checkout function to check for an **unpaid** entry instead of rejecting existing entries. It should verify an entry exists with `has_paid = false`.

## Missing: Mobile Navigation Access

The BottomNav (mobile navigation bar) has no link to Photo Challenges. Users on mobile have no way to discover or navigate to the feature unless they use the desktop Scoreboard Hub dropdown.

**Fix**: Add Photo Challenges to the mobile bottom nav or to a mobile-accessible menu/hub.

## Missing: RLS UPDATE Policy on `photo_challenge_entries`

The webhook needs to update `has_paid` on entries. The webhook uses `service_role` key (bypasses RLS), so this technically works. However, there's **no UPDATE policy at all** on `photo_challenge_entries`, meaning if the app ever needs to update entries from the client side (e.g., editing a caption), it would fail. Low priority but worth noting.

## Missing: Admin "View Entries" for a Challenge

The admin page (`AdminPhotoChallenges.tsx`) only shows a table with challenge metadata and a delete button. There's no way for admins to:
- View submitted entries/photos for a specific challenge
- Pick/confirm a winner
- See who has paid vs unpaid

**Fix**: Add a "View" action that links to the challenge detail page or opens a modal showing entries.

## Missing: Winner Selection

When a challenge is marked "completed", there's no mechanism to set the `winner_id`. The tally function exists and ranks entries, but nothing writes the winner back. Admin should be able to select a winner (auto from tally or manual).

## Summary of Changes

| # | Issue | Priority |
|---|-------|----------|
| 1 | Fix checkout function -- allow payment for existing unpaid entries | **Critical** |
| 2 | Add mobile nav access to Photo Challenges | High |
| 3 | Add admin "View Entries" + winner selection | Medium |
| 4 | Add UPDATE RLS policy on entries (for future flexibility) | Low |

### Implementation

1. **`supabase/functions/photo-challenge-checkout/index.ts`** -- Replace the "already entered" rejection with a check that verifies an unpaid entry exists (or allow creating entry + paying in one step)

2. **`src/components/layout/BottomNav.tsx`** -- Add Photo Challenges link or integrate it into an existing mobile menu section

3. **`src/pages/admin/AdminPhotoChallenges.tsx`** -- Add a "View" button per challenge linking to `/app/photo-challenges/:id`, and add a "Set Winner" action that writes the top-ranked entry from the tally to `winner_id`

4. **Migration SQL** -- Add UPDATE policy on `photo_challenge_entries` for service role / own-user updates

