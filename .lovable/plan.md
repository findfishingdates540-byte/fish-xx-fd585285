

# FishX Rebrand & Architecture Overhaul Plan

## Summary

Rename the app from "Find Fishing Dates" to **FishX**. Reposition it as a fishing-first platform where dating is an optional add-on profile (similar to Facebook Dating). Users under 18 can use the fishing features. Dating profile creation requires age verification (18+). All public pages, policies, and branding must reflect these changes.

## Current State

- The app is branded as "Find Fishing Dates" -- a dating-first app for anglers
- Sign-up lets users choose between dating/fishing/both account modes upfront
- Onboarding enforces minimum age of 18 for ALL users (even fishing-only)
- All public pages (Index, About, Dating, Fishing, Safety, Privacy, Terms, Contact, Help, Pricing) use dating-forward messaging
- The name "Find Fishing Dates" appears in ~34 files across the codebase
- The `handle_new_user()` DB function defaults to `account_mode = 'both'`
- There's also a pre-existing build error: `NodeJS.Timeout` references fail because `@types/node` is not in the TS config

## Architecture Changes

### 1. Fix Build Errors First (NodeJS namespace)

Replace all `NodeJS.Timeout` references with `ReturnType<typeof setTimeout>` across 11 files. This is unrelated to the rebrand but blocks deployment.

**Files:** `IncomingCallOverlay.tsx`, `use-buddy-conversations.ts`, `use-daily-call.ts`, `use-dating-chat.ts`, `use-dating-conversations.ts`, `use-online-presence.ts`, `use-voice-recorder.ts`, `ProfileEdit.tsx`, `Buddies.tsx`, `BuddyChat.tsx`, `Feed.tsx`

### 2. Rebrand: "Find Fishing Dates" → "FishX"

Global find-and-replace across all files:

- **App name**: "Find Fishing Dates" → "FishX" (in ~34 files)
- **index.html**: Update `<title>`, meta tags, OG tags, Twitter card
- **PublicHeader/PublicFooter**: Update logo alt text
- **Auth page**: Update welcome toast, logo alt
- **Onboarding**: Update logo text
- **MobileHomeLanding**: Update brand badge text
- **Settings page**: Update share text, premium branding
- **Edge functions**: Update email sender name and footer text
- **config.ts**: Keep production URL as-is (domain unchanged for now)
- **Tagline**: Change from "Catch feelings, catch fish" to something fishing-first like "Your Ultimate Fishing Platform" or "Fish. Connect. Explore."

### 3. Auth Flow: Remove Account Mode Selection at Signup

Currently signup offers dating/fishing/both. New flow:

- **Remove** the account mode picker from the Auth page entirely
- All new users sign up as `fishing` by default
- Update `handle_new_user()` DB function to default to `'fishing'` instead of `'both'`
- Update `AuthContext.signUp()` to no longer pass `accountMode`

### 4. Onboarding: Fishing-Only Flow for All New Users

- Remove the dating and "both" onboarding paths from the initial signup flow
- All new signups go through fishing-only onboarding: basic_info → photo → location → lifestyle → experience → target_species → gear → interests
- **Remove the 18+ age restriction for fishing-only signup** -- allow users 13+ (or whatever minimum you want) for fishing accounts
- Keep the dating onboarding flow code intact but gate it behind the "Create Dating Profile" feature (step 5)

### 5. New Feature: "Create Dating Profile" Add-On

Add a new flow accessible from Settings or Profile page:

- **Age gate**: Check `date_of_birth` from profile. If user is under 18, show a message: "You must be 18 or older to create a dating profile."
- If 18+, launch a dating-specific onboarding flow (reuse existing dating steps: dating_preference, preference_sync for combo)
- On completion, update `account_mode` from `'fishing'` to `'both'` in the database
- Add a "Create Dating Profile" button/card in Settings under a new section
- The existing dating features (Discover, Matches, Messages, Likes) remain behind `DatingRoute` guards -- they just become accessible once the user upgrades to `both` mode

### 6. Update Public Pages Content

All public pages need content updates to reflect fishing-first positioning:

- **Index.tsx (Homepage)**: Rewrite hero as fishing platform. Move dating to a secondary "also available" section. Update stats, features, mission, CTA, testimonials. Change "Find Your Perfect Fishing Date" → "Your Ultimate Fishing Community"
- **MobileHomeLanding.tsx**: Update tagline, brand badge, feature list
- **About.tsx**: Rewrite mission/story to be fishing-platform-first, mention dating as add-on
- **Dating.tsx**: Reframe as "FishX Dating" -- an add-on for 18+ users
- **Fishing.tsx**: Make this the primary feature page
- **Safety.tsx**: Add section about underage user protection for fishing features
- **Terms.tsx**: Update eligibility section (13+ for fishing, 18+ for dating add-on)
- **Privacy.tsx**: Update children's privacy section to reflect 13+ minimum age, separate dating data handling
- **CommunityGuidelines.tsx**: Add age-appropriate content rules
- **Pricing.tsx**: Clarify what's included in fishing vs dating features
- **Help.tsx**: Add FAQ about creating dating profiles

### 7. Update Default Routes & Navigation

- `AppIndex.tsx`: Default all users to `/app/feed` (fishing feed). Only redirect to discover if they have dating enabled
- Auth redirect after login: Default to `/app/feed` instead of `/app/discover`
- Bottom nav / sidebar: Show dating nav items only when `account_mode` is `both` or `dating`

### 8. Database Migration

```sql
-- Update handle_new_user to default to 'fishing'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, account_mode, is_premium, premium_expires_at)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    'fishing'::account_mode,
    true, NOW() + INTERVAL '60 days'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

## Implementation Order

1. Fix `NodeJS.Timeout` build errors (11 files)
2. Database migration: update `handle_new_user` default to `fishing`
3. Auth page: remove account mode selector, default to fishing
4. Onboarding: adjust age gate (13+ for fishing, keep 18+ for dating steps)
5. Rebrand all "Find Fishing Dates" → "FishX" across ~34 files + index.html
6. Rewrite homepage (Index.tsx) and mobile landing as fishing-first
7. Add "Create Dating Profile" flow in Settings with 18+ age gate
8. Update all public pages content (About, Dating, Fishing, Safety, Terms, Privacy, etc.)
9. Update routing defaults (AppIndex, Auth redirect, navigation)

## Scope Warning

This is a very large change touching 50+ files. I recommend splitting implementation into 2-3 rounds:
- **Round 1**: Build errors fix + rebrand + auth/onboarding flow changes + DB migration
- **Round 2**: Public pages content rewrite + "Create Dating Profile" feature
- **Round 3**: Policy pages updates (Terms, Privacy, Safety, Guidelines)

