
Fix plan: replace the app’s fragile direct `navigator.geolocation` usage with a shared, native-aware location service.

1. Confirm the root cause
- Do I know what the issue is? Yes.
- The failing step is getting coordinates from the device, before Mapbox is used.
- Current code relies on browser geolocation only, which is unreliable in Capacitor/native contexts and gives misleading “granted” states via `navigator.permissions`.
- The app also still has a Capacitor dev `server.url` config, which is fine for sandbox testing but not ideal for real native builds.

2. Build one shared location helper
- Add a reusable helper/hook (for example `src/lib/location.ts`) that:
  - Uses `@capacitor/geolocation` when `Capacitor.isNativePlatform()` is true
  - Falls back to `navigator.geolocation` on web
  - Normalizes errors into clear app-level states:
    - permission_denied
    - services_disabled
    - timeout
    - unavailable
  - Retries once with lower accuracy / cached location if the precise request fails
- This removes the duplicated location logic currently spread across Settings, Profile Edit, onboarding, live camera capture, and spots.

3. Refactor the Settings location flow
- Update `src/pages/app/Settings.tsx` to use the shared helper instead of calling `navigator.geolocation.getCurrentPosition` directly.
- Stop treating `navigator.permissions.query()` as the source of truth.
- Show accurate user messages:
  - permission denied
  - device location services off
  - timed out
  - location unavailable
- Keep Mapbox reverse geocoding only after coordinates are successfully obtained.

4. Align saved profile data with the precision system
- When location is successfully fetched, save:
  - `location_lat`
  - `location_lng`
  - `location_name`
  - and, if available from reverse geocoding, structured `city`, `state`, `zip_code`
- This keeps the profile consistent with the rest of the app’s location and distance logic.

5. Fix the same bug everywhere else
- Update these files to use the same helper so the bug does not reappear in other flows:
  - `src/pages/app/ProfileEdit.tsx`
  - `src/components/onboarding/StepLocation.tsx`
  - `src/components/ui/live-camera-capture.tsx`
  - any other direct geolocation callsites such as `src/pages/app/Spots.tsx`

6. Native app hardening
- Add `@capacitor/geolocation` to dependencies.
- Keep the project ready for native permission sync.
- Adjust `capacitor.config.ts` so the remote `server.url` is not used for real release/native builds.
- After implementation, you’ll need to:
  - git pull
  - run `npx cap sync`
- If you are testing on a real native app, this step is important.

Technical details
- Files to change:
  - `package.json`
  - `capacitor.config.ts`
  - new shared location helper file
  - `src/pages/app/Settings.tsx`
  - `src/pages/app/ProfileEdit.tsx`
  - `src/components/onboarding/StepLocation.tsx`
  - `src/components/ui/live-camera-capture.tsx`
  - possibly `src/pages/app/Spots.tsx`
- No Mapbox edge-function change is required for the main bug, because the failure happens before reverse geocoding.
- Main success criteria:
  - Settings location update works on web and native
  - Errors are specific instead of generic
  - Other location features reuse the same robust logic
  - Native builds work after `npx cap sync`
