

# Migrate from Natively to Capacitor

## Overview
Replace the Natively SDK wrapper with Capacitor to build native Android and iOS apps. This involves installing Capacitor, configuring it, updating push notification handling, and providing steps to build in Android Studio.

## Step 1: Install Capacitor Dependencies

Add the following packages:
- `@capacitor/core`
- `@capacitor/cli` (dev dependency)
- `@capacitor/ios`
- `@capacitor/android`
- `@capacitor/push-notifications` (replaces Natively Firebase push)

## Step 2: Initialize Capacitor

Run `npx cap init` and configure `capacitor.config.ts`:
- **appId**: `app.lovable.df5847982ad9482a9cd6d5a123462cf6`
- **appName**: `FishX`
- **webDir**: `dist`
- **Server config** for dev hot-reload pointing to the sandbox preview URL

## Step 3: Update Push Notifications

Replace `use-natively-push.ts` with a Capacitor-based implementation using `@capacitor/push-notifications`:
- `PushNotifications.requestPermissions()`
- `PushNotifications.register()`
- Listen for `registration` event to get the FCM token
- Save token to `push_subscriptions` table (same DB schema, just different source)

Update `use-push-notifications-unified.ts` to detect Capacitor native instead of Natively:
- Check `Capacitor.isNativePlatform()` from `@capacitor/core`

## Step 4: Clean Up Natively References

Remove or update:
- `src/hooks/use-natively-push.ts` -- replace with Capacitor version
- `src/vite-env.d.ts` -- remove Natively type declarations
- Any `window.natively` or `window.NativelyFirebaseNotifications` checks throughout the codebase

## Step 5: Build & Run Instructions

After the code changes, you will need to do the following on your local machine:

1. Export to GitHub via Settings → GitHub
2. `git clone` and `cd` into the project
3. `npm install`
4. `npm run build`
5. `npx cap add android` (and/or `npx cap add ios`)
6. `npx cap sync`
7. `npx cap open android` -- opens the project in Android Studio
8. Build and run from Android Studio onto a device or emulator

For subsequent code changes pulled from Lovable, just run `npm run build && npx cap sync`.

## Files to Create/Edit
1. `capacitor.config.ts` -- new Capacitor config
2. `src/hooks/use-capacitor-push.ts` -- new push hook using Capacitor API
3. `src/hooks/use-push-notifications-unified.ts` -- swap Natively detection for Capacitor
4. `src/hooks/use-natively-push.ts` -- delete or gut
5. `src/vite-env.d.ts` -- remove Natively types
6. `package.json` -- add Capacitor dependencies

Read more about using Capacitor with Lovable: https://docs.lovable.dev/tips-tricks/native-mobile-apps

