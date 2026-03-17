

# Fish X Photo Challenge Feature

## Overview
A new "Photo Challenge" system where users submit fish photos, pay a small entry fee, and the community votes on the best photo. The winner takes half the prize pool (or a gift card). Challenges rotate every few weeks with different themes.

## Database Design

### New Tables

**`photo_challenges`** -- The challenge definition (theme, dates, prize info)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| title | text | e.g. "Best Bass Shot March 2026" |
| description | text | Theme details |
| banner_url | text | Challenge banner image |
| entry_fee | numeric | Default 5.00 (stored in dollars) |
| prize_type | text | 'cash' or 'gift_card' |
| prize_description | text | e.g. "$50 Gift Card" or "Half the pot" |
| start_date | timestamptz | Submissions open |
| end_date | timestamptz | Submissions close |
| voting_end_date | timestamptz | Voting closes (a few days after end_date) |
| status | text | 'upcoming', 'submissions_open', 'voting', 'completed' |
| winner_id | uuid | Set after voting ends |
| created_by | uuid | Admin/creator |
| created_at | timestamptz | |

**`photo_challenge_entries`** -- Each submitted photo
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| challenge_id | uuid FK → photo_challenges | |
| user_id | uuid | Submitter |
| photo_url | text | Uploaded fish photo |
| caption | text | Optional description |
| has_paid | boolean | Entry fee confirmed |
| created_at | timestamptz | |
| UNIQUE(challenge_id, user_id) | | One entry per user per challenge |

**`photo_challenge_votes`** -- One vote per user per challenge
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| challenge_id | uuid FK → photo_challenges | |
| entry_id | uuid FK → photo_challenge_entries | Which photo they voted for |
| user_id | uuid | Voter |
| created_at | timestamptz | |
| UNIQUE(challenge_id, user_id) | | One vote per user per challenge |

### RLS Policies
- **photo_challenges**: SELECT for all authenticated; INSERT/UPDATE for admins only
- **photo_challenge_entries**: SELECT for all authenticated; INSERT for authenticated (own rows); DELETE for own rows
- **photo_challenge_votes**: SELECT for all authenticated; INSERT for authenticated (own rows, one per challenge); DELETE for own rows

## Frontend Pages

### 1. Photo Challenges Hub (`/app/photo-challenges`)
- List of active/upcoming/completed photo challenges (tabbed like fishing challenges)
- Each card shows: banner, title, entry fee, prize, entry count, time remaining
- "Enter Challenge" CTA on active ones

### 2. Photo Challenge Detail (`/app/photo-challenges/:id`)
- Banner + title + description at top
- Two phases shown contextually:
  - **Submission phase**: Upload form (photo + caption), entry fee notice, gallery of current entries (photos blurred or visible based on preference)
  - **Voting phase**: Photo gallery grid, tap to enlarge, "Vote" button per photo, user can only vote once, cannot vote for own entry
  - **Completed**: Winner highlighted with crown, vote counts revealed, prize info
- Sidebar/stats: total entries, total prize pool (entry_fee × entry count × 0.5), time remaining

### 3. Create Photo Challenge (`/app/photo-challenges/new`) -- Admin/creator page
- Form: title, description, banner upload, entry fee, prize type, dates (start, end, voting end)

## Entry Fee Handling
For the initial implementation, entry fees will be tracked as a boolean (`has_paid`) on entries. Actual payment processing can be wired to Stripe later. The prize pool is calculated as: `entry_fee × paid_entries × 0.5`. This avoids gambling regulation issues initially -- the note about gift cards as an alternative is preserved in the admin creation form as a prize_type toggle.

## Vote Counting & Winner Selection
- A database function `tally_photo_challenge_votes(challenge_id)` counts votes per entry and returns ranked results
- Winner determination can be triggered manually by admin or via a scheduled check

## Navigation
- Add "Photo Challenges" to the Scoreboard Hub dropdown in `BothHeader.tsx` alongside existing Challenges/Teams/Leaderboard links
- Add routes in `App.tsx`

## Files to Create/Edit
1. **Migration SQL** -- 3 new tables, RLS policies, vote tally function
2. `src/pages/app/PhotoChallenges.tsx` -- Hub listing page
3. `src/pages/app/PhotoChallengeDetail.tsx` -- Detail/submit/vote page
4. `src/pages/app/CreatePhotoChallenge.tsx` -- Creation form
5. `src/App.tsx` -- New routes
6. `src/components/layout/BothHeader.tsx` -- Nav link

