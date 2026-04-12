

# Add Challenges & Tournaments Content to Public Pages

## Current State

The **Fishing landing page** (`/fishing`) has zero mention of challenges, contests, or tournaments. It covers: Catch Logging, Fishing Spots, Fishing Buddies, Photo Gallery, Personal Stats, Gear Tracking, and Premium. The **home page** (`/`) also has no challenges/prizes content.

The app already has a full Photo Challenges system and Tournaments system built out -- but visitors to the public site would never know about them.

## Plan

### 1. Add "Compete & Win" Section to the Fishing Page

Insert a new prominent section between "Fishing Buddies" and "Premium Features" in `src/pages/Fishing.tsx`. Content will include:

- **Headline**: "Compete & Win Real Prizes"
- **Subtext**: AI-written compelling copy about entering challenges for as little as $5, competing against anglers nationwide, and winning cash prizes and gift cards from fishing brands
- **Three pillars**:
  - **Photo Challenges** -- Submit your best catch photos, community votes, winner takes the pot
  - **Fishing Tournaments** -- Single/double elimination brackets, scored by biggest catch or total weight
  - **Team Competitions** -- Form teams, climb the leaderboard, compete by category
- **Call-to-action**: "Enter for just $5" / "Join a Challenge" linking to signup
- Visual: Use existing fishing photos from assets

### 2. Add "Challenges & Prizes" Feature Card to Features Grid

Replace the generic "Photo Gallery" and "Personal Stats" cards in the Fishing page features grid with:
- **Challenges & Contests** (Trophy icon) -- "Enter photo challenges and tournaments for as little as $5. Compete against anglers from across the country and win cash prizes, gift cards, and bragging rights."
- **Leaderboards & Rankings** (Trophy icon) -- "Climb the global rankings. Track your standing against other anglers by species, region, and season."

### 3. Add Challenges Mention to Home Page

Add a brief "Compete & Win" card or section in the Features grid on `src/pages/Index.tsx` so visitors see challenges mentioned on the main landing page too. A single feature card with Trophy icon highlighting "$5 entry, real prizes."

### 4. Update Fishing Page Hero Subtitle

Update the hero paragraph in Fishing.tsx to mention competitions:
> "FishX is your complete fishing platform. Log catches, discover spots, find fishing buddies, **enter competitions for as little as $5**, and win real prizes."

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Fishing.tsx` | Add "Compete & Win" section, update feature cards, update hero text |
| `src/pages/Index.tsx` | Add challenges/prizes feature card to the features grid |

