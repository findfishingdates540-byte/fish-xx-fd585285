## Goal

Stop loading multi-MB originals in the feed, profile gallery, and catch photos. Use **Supabase Storage Image Transformations** to request a CDN-cached, resized variant of the image already in storage — no re-uploads, no extra tables.

Requires the project to be on **Supabase Pro** (transformations are a paid-tier feature). If we're not on Pro, the URLs will 400 and we'll need the alternate approach.

## How it works

Supabase exposes a render endpoint:

```
/storage/v1/render/image/public/<bucket>/<path>?width=400&height=400&resize=cover&quality=75
```

The first request generates and caches the variant on the CDN; subsequent requests are instant. We never need to store variant URLs — the URL is the variant.

## Step 1 — Build a helper

Add `src/lib/image-url.ts`:

- `getTransformedUrl(originalUrl, { width, height, quality, resize })` — rewrites any `…/storage/v1/object/public/<bucket>/<path>` URL into the matching `…/storage/v1/render/image/public/<bucket>/<path>?…` URL. Falls through unchanged for non-Supabase URLs (external CDN images, blob:, data:).
- `thumb(url)` → 400px wide, q=70 (feed cards, grids, avatars)
- `medium(url)` → 1080px wide, q=80 (single-post viewer, lightbox preview)
- Original URL stays untouched for full-screen views and downloads.

## Step 2 — Wire it into the three target surfaces

Replace `<img src={url}>` with `<img src={thumb(url)}>` (or `medium`) at these render sites only — no upload or DB changes:

**Catch photos (feed + profile)**
- `src/pages/app/Catches.tsx` (grid) → thumb
- `src/pages/app/CatchDetail.tsx` (hero) → medium
- Any `CatchCard` / catch thumbnail components rendered from these pages

**Feed post media**
- `src/components/feed/` post card image renders → thumb
- Post viewer overlay (`PostViewer*`) → medium

**Profile + gallery photos**
- Avatar renders across the app (small `<Avatar>` usages) → thumb
- Profile gallery grid → thumb
- Profile gallery lightbox → medium or original

Also add `loading="lazy"` and `decoding="async"` on the same `<img>` tags while we're there — costs nothing and helps feed scroll.

## Step 3 — Verify

1. Open the feed, DevTools → Network → Img. Confirm:
   - URLs contain `/render/image/public/` with `width=` param
   - Response sizes drop from MBs to ~20–80 KB per thumbnail
   - Status 200 (not 400 — 400 means the project isn't on Pro)
2. Click into a post — confirm the larger `medium` variant loads in the viewer.
3. Check a profile gallery — thumbnails small, lightbox sharp.

## Out of scope (intentionally)

- No edge function, no Sharp, no upload-time processing.
- No DB schema changes — no `thumbnail_url` columns.
- Stories, messaging attachments, team posts, and admin surfaces are not changed in this pass. Easy to extend later by reusing the same helper.

## Risk / fallback

If the Supabase project isn't on Pro, `/render/image/` returns 400. In that case we have two options:
- Upgrade to Pro, or
- Switch to client-side resize on upload (browser canvas → 400px + 1080px JPEGs stored alongside the original, URLs saved in the row). Larger change — separate plan.

Want me to go ahead and implement Step 1 + Step 2?