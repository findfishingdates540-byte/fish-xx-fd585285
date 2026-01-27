
Goal (what will change)
- Scrolling up/down should switch the entire Discover “combined profile card” between 4 distinct cards (like Bumble).
- Card 1 shows the photo + basics (name/age/verification/occupation/bio) together in one view.
- Cards 2–4 are full-width (no photo) and replace Card 1 entirely.
- No card is internally scrollable; the only vertical gesture is “swap to next/previous card”.
- The small “scrollbar/progress” indicator stays at the top-right of the overall card container (outside the card content), showing which of the 1–4 cards you’re on.

What’s wrong right now (root cause)
- The current implementation renders a two-panel layout:
  - Left: BumbleProfileCard (photo)
  - Right: ProfileCardStack (text cards)
- The scroll listeners live inside ProfileCardStack (right panel), so only the right panel swaps cards, while the photo panel stays visible.

High-level fix
- Convert the Discover desktop “combined card” from a 2-panel layout into a single “full-card stack”:
  - The stack controls which card is showing (1–4).
  - Card 1’s content includes BOTH the photo component and the basics content.
  - Cards 2–4 render as full-width content cards.
- Keep the progress indicator in Discover.tsx (overlayed at the top-right of the outer container) and keep using onCardChange to drive it.

Implementation details (code changes)

1) Update `src/components/discover/ProfileCardStack.tsx` to become a “full card stack”
- Keep the existing “cards array” logic (skip interests/lifestyle/prompts if empty).
- Keep wheel + touch listeners, but attach them to the outermost container that now represents the whole card.
- Change the render logic:
  - If current card type is `basics`:
    - Render a responsive “combined basics card”:
      - Desktop (lg+): split layout inside the same card (left photo, right basics panel)
      - Tablet (<lg): stacked layout (photo on top, basics below)
    - The photo area uses `<BumbleProfileCard />`.
    - The basics panel uses the existing basics renderer (name/age/verification/occupation/bio + “more” button).
  - If current card type is `interests` / `lifestyle` / `prompts`:
    - Render a full-width panel (bg-muted, padding) and the corresponding existing content.
- Add new props so the basics card can render the photo:
  - `profileCard: ProfileData` (or a minimal subset containing photos/name/id, etc.) for `<BumbleProfileCard />`
  - `onSwipeLeft`, `onSwipeRight`, `onExpandClick` so swiping/expanding still works on Card 1.
  - Optional `profileId` (e.g., currentProfile.id) so we can reset `currentCardIndex` to 0 when the user changes to a new profile.

2) Update `src/components/discover/BumbleProfileCard.tsx` to avoid UI overlap (progress indicator vs expand button)
- Problem: BumbleProfileCard has an expand button at `top-4 right-4`, and we also overlay the progress indicator at `top-4 right-4`.
- Add a prop like `showExpandButton?: boolean` (default true).
- In the new Card 1 layout, set `showExpandButton={false}` and rely on the “More” button in the basics panel to open the detailed profile.
  - This keeps the top-right corner free for the progress indicator, matching Bumble’s look.

3) Update `src/pages/app/Discover.tsx` (desktop layout) to render a single stack instead of left+right panels
- Replace this block:
  - `<div className="w-full lg:w-1/2 ..."><BumbleProfileCard ... /></div>`
  - `<div className="w-full lg:w-1/2 ..."><ProfileCardStack ... /></div>`
- With a single stack that fills the entire container:
  - Keep the same outer wrapper (rounded-3xl, shadow-lg, fixed height) as the “card container”.
  - Keep the existing progress indicator overlay exactly where it is.
  - Render:
    - `<ProfileCardStack ... onCardChange={setCardStackState} className="h-full w-full" />`
- Continue to keep the action buttons (Pass/Super/Like) outside and overlapping the bottom, unchanged.

4) Edge cases & behaviors to ensure
- Switching to a new profile resets the stack to Card 1 automatically.
- If a profile has no interests/lifestyle/prompts, those cards are omitted and the progress indicator shows fewer segments.
- When totalCards shrinks (because data is missing), clamp currentIndex so it never points past the end.
- Maintain “no internal scrollbars” by ensuring:
  - outer card container uses `overflow-hidden`
  - inner cards are `h-full` and content stays vertically centered as currently designed

Files that will be modified
- `src/components/discover/ProfileCardStack.tsx`
  - Add support for rendering Card 1 with photo + basics
  - Add new props for profile photos + swipe callbacks
  - Add reset-on-profile-change behavior
- `src/components/discover/BumbleProfileCard.tsx`
  - Add `showExpandButton?: boolean` and conditional rendering of the expand button
- `src/pages/app/Discover.tsx`
  - Replace the 2-panel composition with a single full-width stack
  - Keep the progress indicator overlay (already correct)

How you’ll be able to verify it quickly (acceptance checklist)
- On /app/discover (desktop):
  - Scroll down once: the entire card changes from Card 1 (photo+basics) to Card 2 (Interests, full width).
  - Scroll down again: entire card changes to Card 3 (Lifestyle).
  - Scroll down again: entire card changes to Card 4 (Prompts).
  - Scroll up reverses the order.
  - The progress indicator stays at the top-right of the overall card container the whole time.
  - The photo is only present on Card 1 and disappears entirely on Cards 2–4.
