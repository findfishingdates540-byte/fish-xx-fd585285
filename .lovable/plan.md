

## Timestamp & Location Watermark on Catch Photos

The request (from the first image) is to overlay a visible **timestamp + address watermark** on photos taken in the app, similar to the example photos showing date/time and full address (street, city, county, state) burned into the bottom-right corner. This proves the photo was just taken at that location.

### What exists today

- `LiveCameraCapture` component already captures the photo, ISO timestamp, and GPS coordinates via the device camera.
- `LogCatchForm` receives this metadata and auto-fills the `caught_at` field.
- GPS coordinates are captured but **not** reverse-geocoded into an address, and **no watermark** is burned onto the image.

### Plan

**1. Create a photo watermark utility** (`src/utils/photo-watermark.ts`)
- Accept: image `File`, timestamp string, and location object (lat/lng + reverse-geocoded address lines).
- Use an HTML `<canvas>` to:
  - Draw the original photo.
  - Render a semi-transparent text overlay in the bottom-right corner with: date/time, street address, city, county, state — matching the style in the example photos (white text, right-aligned, slight text shadow for readability).
- Return a new `File` (JPEG) with the watermark baked in.

**2. Add reverse geocoding** 
- When the camera captures GPS coordinates, call the existing Mapbox geocoding (already used elsewhere in the app) to convert lat/lng into structured address components (street, city, county, state).
- Create a small helper or reuse existing geocoding logic from the app's location system.

**3. Update `LiveCameraCapture` component**
- After capturing the photo and obtaining GPS, reverse-geocode the coordinates.
- Run the watermark utility to burn timestamp + address onto the image.
- Return the watermarked file (and watermarked preview) to the parent via `onCapture`.
- The preview shown in the UI will display the watermarked version so users see exactly what gets saved.

**4. Apply to all live-capture flows**
- `LogCatchForm` (trophy photo + measurement photo) — already uses `LiveCameraCapture`.
- Photo Challenge entries — if they also use `LiveCameraCapture`, they get it automatically.

### Technical details

- **Canvas rendering**: Load image into an `Image` element, draw to canvas at original resolution, overlay text at ~2-3% of image height, right-aligned with 20px padding.
- **Text format** (matching examples):
  ```
  Apr 13, 2026 10:52:09 AM
  720 Pondella Road
  North Fort Myers
  Lee County
  Florida
  ```
- **Reverse geocoding**: Use Mapbox reverse geocoding endpoint (`/geocoding/v5/mapbox.places/{lng},{lat}.json`) with the token already available via the `get-mapbox-token` edge function.
- **Fallback**: If geocoding fails, watermark shows timestamp + raw coordinates. If GPS is unavailable, only timestamp is shown.

