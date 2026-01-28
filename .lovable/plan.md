

## Replace Blocking Modal with Guided Tooltips and Auto-Navigation

### Summary
Instead of blocking users with a non-dismissible modal when their profile is incomplete, we'll implement a friendly, guided experience using:
1. **A dismissible banner** at the top of the Discover page showing completion status
2. **Auto-navigation** to the Profile Edit page on first detection of incomplete profile
3. **Step-by-step tooltips** (using react-joyride) that highlight each missing field on the Profile Edit page

### User Experience Flow

```text
User opens Discover page
         │
         ▼
   ┌─────────────────────┐
   │ Profile incomplete? │
   └─────────────────────┘
         │
    Yes  │  No
         │   └──► Show Discover normally
         ▼
   ┌─────────────────────────────────────┐
   │ First time seeing incomplete?       │
   │ (checked via localStorage)          │
   └─────────────────────────────────────┘
         │
    Yes  │  No
         │   └──► Show dismissible banner
         ▼
   ┌─────────────────────────────────────┐
   │ Auto-navigate to /app/profile/edit  │
   │ Start guided tooltip tour           │
   └─────────────────────────────────────┘
```

### Changes

#### 1. New Hook: `use-profile-completion-guide.ts`
**Purpose**: Manage the guided completion state and determine what fields are missing

- Track whether guide has been shown (localStorage: `profile_completion_guide_shown`)
- Calculate missing fields dynamically
- Map missing fields to element selectors on ProfileEdit page
- Provide methods: `startGuide()`, `dismissGuide()`, `shouldAutoNavigate`

#### 2. New Component: `ProfileCompletionGuide.tsx`
**Purpose**: The react-joyride tutorial for ProfileEdit page

- Dynamically generate steps based on missing fields only
- Map each missing field to its input element:
  - Bio → `#bio`
  - Occupation → `#occupation`
  - Height → `#height`
  - Smoking → `[data-profile-field="smoking"]`
  - Drinking → `[data-profile-field="drinking"]`
  - Zodiac → `[data-profile-field="zodiac"]`
  - Photo → `[data-profile-field="photos"]`
  - Location → `#city`
- Uses same styling as existing DatingTutorial for consistency
- Completes tour after user views all steps

#### 3. Modified: `ProfileCompletionBanner.tsx`
**Purpose**: Change from blocking modal to dismissible banner

- Replace `Dialog` with a slim, dismissible banner at page top
- Show completion progress bar
- "Complete Now" button navigates to edit page and starts guide
- "Dismiss" button hides banner for the session
- No longer blocks the entire UI

#### 4. Modified: `ProfileEdit.tsx`
**Purpose**: Add data attributes for tooltip targeting

- Add `data-profile-field` attributes to relevant form fields:
  - Photo gallery section: `data-profile-field="photos"`
  - Bio textarea: already has `id="bio"`
  - Occupation input: already has `id="occupation"`
  - Height input: already has `id="height"`
  - Drinking select: `data-profile-field="drinking"`
  - Smoking select: `data-profile-field="smoking"`
  - Zodiac select: `data-profile-field="zodiac"`
  - City input: already has `id="city"`
- Integrate `ProfileCompletionGuide` component

#### 5. Modified: `Discover.tsx`
**Purpose**: Handle auto-navigation logic

- Check if profile is incomplete and guide hasn't been shown yet
- If first time detection, auto-navigate to `/app/profile/edit?guide=true`
- Pass query param to trigger the guide on ProfileEdit page

### Technical Details

**New Hook Structure:**
```typescript
// use-profile-completion-guide.ts
export interface MissingField {
  key: string;
  label: string;
  selector: string;
  description: string;
}

export function useProfileCompletionGuide(profile: ProfileData | null) {
  // Returns:
  // - missingFields: MissingField[]
  // - completionPercent: number
  // - shouldAutoNavigate: boolean (first time seeing incomplete)
  // - markGuideShown: () => void
  // - isGuideRunning: boolean
  // - startGuide: () => void
  // - stopGuide: () => void
}
```

**Dynamic Joyride Steps:**
```typescript
const generateSteps = (missingFields: MissingField[]): Step[] => {
  return missingFields.map((field, index) => ({
    target: field.selector,
    title: `Step ${index + 1}: ${field.label}`,
    content: field.description,
    placement: 'auto',
    disableBeacon: index === 0,
    spotlightClicks: true, // Allow clicking the highlighted element
  }));
};
```

**Banner Component:**
```tsx
// Non-blocking, dismissible banner
<div className="bg-primary/10 border-b border-primary/20 px-4 py-3">
  <div className="flex items-center justify-between max-w-7xl mx-auto">
    <div className="flex items-center gap-3">
      <Progress value={completionPercent} className="w-24 h-2" />
      <span className="text-sm">{completionPercent}% complete</span>
    </div>
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={handleCompleteProfile}>
        Complete Now
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDismiss}>
        Later
      </Button>
    </div>
  </div>
</div>
```

### Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/use-profile-completion-guide.ts` | Hook to manage guide state and missing field detection |
| `src/components/profile/ProfileCompletionGuide.tsx` | Joyride-based guided tour component |

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/profile/ProfileCompletionBanner.tsx` | Replace modal with dismissible banner |
| `src/pages/app/ProfileEdit.tsx` | Add data attributes, integrate guide component |
| `src/pages/app/Discover.tsx` | Add auto-navigation logic for first-time incomplete profiles |
| `src/components/profile/index.ts` | Export new component |

### Benefits Over Current Approach
1. **Non-blocking**: Users can explore the app while being reminded to complete profile
2. **Guided experience**: Tooltips walk users through exactly what to fill out
3. **Context-aware**: Only shows steps for fields that are actually missing
4. **Persistent but not annoying**: Auto-navigates once, then shows dismissible banner
5. **Consistent UI**: Uses same Joyride styling as the dating tutorial

