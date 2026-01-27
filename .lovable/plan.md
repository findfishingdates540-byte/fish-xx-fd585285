

# Bumble-Style Scrollable Profile Cards Implementation

## Overview

Transform the `ProfileInfoPanel` into a Bumble-inspired card stack with 4 distinct profile cards that swap on scroll. Each card shows different profile content, with a small scroll progress indicator in the top-right corner.

## Visual Design

```text
+----------------------------------+
|  Photo Side  |  Info Cards Side  |
|              | [====] <- progress |
|              |                    |
|   Profile    |  Card 1: Basics    |
|    Photo     |  - Name, Age       |
|              |  - Verification    |
|              |  - Occupation      |
|              |  - Bio             |
|              |                    |
+--------------+--------------------+
```

**Card Progression (scroll/swipe to navigate):**
- Card 1: Profile Basics (name, age, verification, occupation, bio)
- Card 2: Interests (hobby tags - fishing, outdoor activities, etc.)
- Card 3: Lifestyle (height, drinking, smoking, zodiac, personality)
- Card 4: Prompts (Q&A responses)

## Technical Implementation

### 1. Create New Component: `ProfileCardStack.tsx`

**Location:** `src/components/discover/ProfileCardStack.tsx`

**Props Interface:**
```typescript
interface ProfileCardStackProps {
  profile: {
    name: string;
    age: number;
    bio?: string;
    occupation?: string;
    idVerified?: boolean;
    liveVerified?: boolean;
    // Interests
    interests?: string[];
    // Lifestyle
    heightCm?: number;
    smoker?: string;
    drinker?: string;
    zodiacSign?: string;
    personalityType?: string;
    // Prompts
    promptResponses?: { question: string; answer: string }[];
  };
  onMoreClick?: () => void;
  className?: string;
}
```

**Core Features:**
- **Wheel/Touch Scroll Detection**: Use `onWheel` and touch gestures to detect scroll direction
- **Card Index State**: Track current card (0-3) with `useState`
- **Snap Behavior**: Cards snap to full view (no partial scroll)
- **Progress Indicator**: 4 small dots/bars in top-right corner showing current card

### 2. Card Content Components

**Card 1 - Basics Card:**
- Name + Age with large typography
- Verification badge (ID/Live)
- Occupation if available
- Full bio text (multi-line allowed)

**Card 2 - Interests Card:**
- Title: "Interests"
- Grid/flex of interest badges
- Uses `InterestDisplay` component styling

**Card 3 - Lifestyle Card:**
- Title: "Lifestyle"
- Icon + label rows for:
  - Height (Ruler icon)
  - Drinking (Wine icon)
  - Smoking (Cigarette icon)
  - Zodiac (Star icon)
  - Personality (Brain icon)

**Card 4 - Prompts Card:**
- Title: "Prompts"
- List of Q&A cards with question + answer
- MessageCircle icon per prompt

### 3. Scroll/Swipe Logic

```typescript
// Scroll handler for wheel events
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  if (e.deltaY > 20 && currentCard < 3) {
    setCurrentCard(prev => prev + 1);
  } else if (e.deltaY < -20 && currentCard > 0) {
    setCurrentCard(prev => prev - 1);
  }
};

// Touch swipe handling using refs for touch start/end
```

### 4. Progress Indicator Component

Small vertical progress bar in top-right corner:
```tsx
<div className="absolute top-4 right-4 flex flex-col gap-1">
  {[0, 1, 2, 3].map(i => (
    <div 
      key={i}
      className={cn(
        "w-1 h-4 rounded-full transition-colors",
        i === currentCard ? "bg-foreground" : "bg-muted-foreground/30"
      )}
    />
  ))}
</div>
```

### 5. Animation Between Cards

Use Framer Motion for smooth card transitions:
```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentCard}
    initial={{ opacity: 0, y: direction > 0 ? 20 : -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: direction > 0 ? -20 : 20 }}
    transition={{ duration: 0.2 }}
  >
    {/* Current card content */}
  </motion.div>
</AnimatePresence>
```

### 6. Update Discover.tsx

Replace `ProfileInfoPanel` with new `ProfileCardStack`:

```tsx
// Instead of:
<ProfileInfoPanel
  name={currentProfile.name}
  age={currentProfile.age}
  ...
/>

// Use:
<ProfileCardStack
  profile={currentDetailProfile} // Pass full detail profile
  onMoreClick={handleProfileClick}
/>
```

### 7. Handle Empty Cards

Skip cards that have no content:
- If no interests, skip Card 2
- If no lifestyle info, skip Card 3
- If no prompts, skip Card 4

Dynamically build the cards array based on available data.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/discover/ProfileCardStack.tsx` | Create (new component) |
| `src/components/discover/index.ts` | Export new component |
| `src/pages/app/Discover.tsx` | Import and use ProfileCardStack |

## Edge Cases

1. **No Bio**: Show "No bio yet" placeholder
2. **No Interests**: Skip the interests card entirely
3. **No Lifestyle Data**: Skip the lifestyle card
4. **No Prompts**: Skip the prompts card
5. **Only 1 Card Available**: Hide progress indicator
6. **Tablet/Desktop Only**: Mobile uses different layout (already handled)

