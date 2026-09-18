# Link the Fish-X Booking Platform (bookfishingtrips.com) in Three Places

Connect the new Fish-X Business booking platform to the fishing app so users can jump to charters, guides, and tackle shopping from the trip planner, the desktop navigation, and the mobile "+" action sheet.

**Platform URL:** `https://www.bookfishingtrips.com` (external site — opens in a new tab so users never lose their place in the app)

## Changes

### 1. Trip card button → "Book a Charter" (`src/components/trips/NextUpTrip.tsx`)
- The second button on the "Next Up Trip" card currently says "Message" and has no click handler (dead button).
- Relabel it to **"Book a Charter"** with a ship/anchor icon (replacing the message icon).
- Clicking it opens `https://www.bookfishingtrips.com` in a new tab (`target="_blank"`, `rel="noopener noreferrer"`).

### 2. Desktop navigation → "Book Charters" (`src/components/layout/FishingHeader.tsx`)
- Add a **"Book Charters"** item to the top nav, right after the existing items (Feed, Find Spots, Trips, Buddies, Messages, Catches).
- Rendered as an external link (new tab) instead of an internal route, styled the same as the other nav items.
- Desktop header only — mobile navigation is handled by item 3.

### 3. Mobile "+" action sheet → "Book Charters" (`src/components/layout/CreateActionSheet.tsx`)
- Add a **"Book Charters"** tile to the action sheet grid (shown to fishing/both accounts, like the other actions).
- Tapping it closes the sheet and opens `https://www.bookfishingtrips.com` in a new tab.

## Technical details
- Add a single constant `BOOKING_PLATFORM_URL = "https://www.bookfishingtrips.com"` in `src/lib/config.ts` so all three places share one source of truth.
- In `CreateActionSheet.tsx`, extend the `Action` type with an optional `external` field; `handleAction` closes the sheet and does `window.open(url, "_blank", "noopener")` for external actions instead of `navigate()`.
- In `FishingHeader.tsx`, extend `fishingNavItems` with an optional `external` field and render an `<a>` element for that entry (regular `NavLink` cannot point outside the app).
- No database, RLS, or routing changes — purely frontend link integration.

## Verification
- Open the Trips page: the trip card shows "Book a Charter" and opens the booking site in a new tab.
- Desktop: "Book Charters" appears in the header nav and opens the site in a new tab.
- Mobile: tapping "+" shows the "Book Charters" tile, which opens the site in a new tab.
- Typecheck passes.
