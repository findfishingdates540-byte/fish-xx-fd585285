

# Prize Distribution System for Tournaments & Challenges

## Overview

Build a prize tracking and distribution system where:
- **Cash prizes**: Admin manually sends payment outside the app; the app tracks payout status and notifies winners
- **Gift cards**: Admin uploads gift card codes in advance; codes are automatically revealed to winners when declared

## Database Changes

### New table: `prize_payouts`

Tracks prize status for every winner across photo challenges, fishing challenges, and tournaments.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| winner_id | uuid | The winning user |
| challenge_id | uuid | nullable, for photo/fishing challenges |
| tournament_id | uuid | nullable, for tournaments |
| prize_type | text | 'cash' or 'gift_card' |
| prize_amount | numeric | Cash amount (calculated from entry fees x entries) |
| prize_description | text | e.g. "$50 Bass Pro Gift Card" |
| gift_card_code | text | The actual code, revealed only to winner |
| status | text | 'pending', 'sent', 'claimed', 'failed' |
| admin_notes | text | Admin can add notes (tracking number, payment method used) |
| notified_at | timestamptz | When winner was notified |
| sent_at | timestamptz | When admin marked as sent |
| created_at | timestamptz | |

RLS: Winners can SELECT their own rows. Admins have full access.

### Add `gift_card_code` column to `photo_challenges`

Optional -- admin can pre-load the gift card code when creating the challenge. When winner is declared, it gets copied to the `prize_payouts` row.

## Implementation

### 1. Auto-create payout record when winner is declared

When admin sets a winner (via `setWinnerMutation` in AdminPhotoChallenges or via the `update-challenge-statuses` edge function), automatically insert a `prize_payouts` row with:
- For cash: `prize_amount` = `entry_fee * entry_count` (the pot), status = 'pending'
- For gift_card: copy the `gift_card_code` from the challenge, status = 'pending'

Also create an in-app notification for the winner.

### 2. Admin Prize Management UI

Add a **"Prize Payouts"** section in the admin dashboard (new page or tab in AdminPhotoChallenges):
- List all pending/sent payouts with winner name, prize type, amount
- For cash: Show winner's display name + a "Mark as Sent" button with optional notes field
- For gift cards: Show the code and auto-delivery status
- Status badges: Pending (yellow), Sent (blue), Claimed (green)

### 3. Winner Notification & Prize Reveal

- When payout is created, send an in-app notification: "Congratulations! You won [challenge name]!"
- On the challenge detail page, show a prize card to the winner:
  - Cash: "Your prize of $X is being processed. You'll be contacted by the organizer."
  - Gift card: Show the actual gift card code with a copy button
- Mark as 'claimed' when winner views the prize

### 4. Gift Card Code Input in Challenge Creation

Add an optional "Gift Card Code" field in the admin create-challenge dialog when `prize_type` is `gift_card`. This gets stored and auto-delivered when the winner is declared.

### 5. Tournament Prize Integration

Same `prize_payouts` table is used. When a tournament final match has a winner, create the payout record. Tournament `prize_description` text is used as the prize details.

## Files to Modify/Create

| File | Change |
|------|--------|
| Migration SQL | Create `prize_payouts` table + add `gift_card_code` to `photo_challenges` |
| `src/pages/admin/AdminPhotoChallenges.tsx` | Add gift card code field in create form; auto-create payout on set winner; add payout management UI |
| `src/pages/app/PhotoChallengeDetail.tsx` | Show prize card to winner (cash status or gift card code) |
| `supabase/functions/update-challenge-statuses/index.ts` | Create payout record + notification when auto-completing challenges |
| `src/pages/app/TournamentDetail.tsx` | Show prize info to tournament winner |

## No Changes Needed
- Stripe Connect or external payout APIs (manual process)
- Entry fee collection flow (already working)

