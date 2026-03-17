

# Seed Photo Challenges & Fishing Challenges with Sample Data

Both the `photo_challenges` and `fishing_challenges` tables are empty, and there are no `fishing_teams`. We need to insert realistic seed data so the pages display active, upcoming, and completed items.

## What will be inserted

### 1. Fishing Teams (3 teams)
- "Bass Busters", "Reel Legends", "Cast & Conquer" with logos from placeholder images and assigned captains from existing profiles.

### 2. Fishing Challenges (6 challenges)
- 2 **active/live** (status `active`, dates spanning now)
- 2 **upcoming** (status `upcoming`, future dates)
- 2 **completed** (status `completed`, past dates)
- Mixed types: `largest_fish`, `most_caught`, `total_weight`, `species_variety`
- Linked to real species IDs from `fish_species`
- Some marked `is_official: true`

### 3. Challenge Participants (seed ~8-10 entries)
- Assign existing profile IDs as participants across the challenges with scores

### 4. Photo Challenges (6 challenges)
- 2 **submissions_open** (active, accepting photos now)
- 2 **voting** (submissions closed, voting open)
- 1 **upcoming** (starts in the future)
- 1 **completed** (with a winner_id set)
- Varied entry fees ($5, $10), prize types (cash, gift_card)
- Banner URLs using high-quality Unsplash fishing/nature images

### 5. Photo Challenge Entries (seed ~10-15 entries)
- Spread across the active/voting challenges
- Photo URLs from Unsplash fishing images
- Mix of `has_paid: true` and `has_paid: false`

### 6. Photo Challenge Votes (seed ~20 votes)
- Distributed across entries in voting-phase challenges

## Data sources
- **User IDs**: Pulled from existing `profiles` table (5 IDs already confirmed)
- **Species IDs**: Pulled from existing `fish_species` table (confirmed available)
- **Images**: Unsplash URLs for banners and entry photos (free, no auth needed)

## Technical details
- All inserts use the Supabase insert tool (data operations, not schema changes)
- `created_by` fields use real profile UUIDs to satisfy RLS/foreign key constraints
- Dates calculated relative to today (2026-03-17) for realistic time labels

