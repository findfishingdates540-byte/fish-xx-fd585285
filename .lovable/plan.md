## Plan: Fix Signup Finalize Error + De-Dating the Onboarding

The client reported two issues from the screenshots:

1. **"Won't finalize"** — clicking the final button shows red error: `invalid input value for enum drinking_habit: ""`.
2. **"Take off Find Matches and those questions"** — the onboarding feels like a dating site (button says "Finalize & Find Matches", and dating-style steps appear even in fishing mode).

---

### 1. Fix the finalize crash (root cause)

In `src/pages/Onboarding.tsx`, the lifestyle fields are sent to Supabase directly:
```ts
smoking,
drinking,
```
Both default to empty string `""`. The DB columns are Postgres enums (`drinking_habit`, `smoking_habit`) that only accept `"never" | "socially" | "regularly"` (or `null`). Sending `""` triggers the error.

**Fix:** Coerce empty strings to `null` before the update, and do the same for any other optional enum-ish field (`zodiac_sign`, `occupation`, `bio`, `heightCm`):
```ts
smoking: smoking || null,
drinking: drinking || null,
zodiac_sign: zodiacSign || null,
occupation: occupation || null,
bio: bio || null,
height_cm: heightCm || null,
```

This lets users skip the lifestyle step (as the UI already allows) without a crash.

---

### 2. Remove dating language for fishing-mode users

In `src/pages/Onboarding.tsx` line 761:
```tsx
{isLastStep ? 'Finalize & Find Matches' : 'Continue'}
```

Change to be mode-aware:
- `fishing` → **"Finish Setup"**
- `dating` → **"Finalize & Find Matches"**
- `both` → **"Finish Setup"**

So a user signing up purely for fishing never sees "Find Matches" wording.

---

### 3. Verify dating-only steps are excluded for fishing mode

The screenshot shows the user on the Interests step in fishing mode — that step is fine and should stay (Camping, Boating, Photography, etc. are general interests). The dating preference / age range / "interested in" steps are already gated by `accountMode` in `stepConfigs`, so no change needed there. We'll just confirm the fishing flow doesn't include `dating_preference` or `preference_sync` keys.

---

### Files to change

- `src/pages/Onboarding.tsx`
  - Coerce empty strings to `null` for `smoking`, `drinking`, `zodiac_sign`, `occupation`, `bio`, `height_cm` in the `updateData` payload.
  - Make the final button label depend on `accountMode` (no "Find Matches" for fishing/both).

No DB migration, no other files affected.

---

### What the user will see after the fix

- They can complete signup without filling in drinking/smoking — no more red error.
- The big blue button at the end of fishing signup says **"Finish Setup"** instead of "Finalize & Find Matches".
- The flow no longer reads like a dating site for fishing users.
