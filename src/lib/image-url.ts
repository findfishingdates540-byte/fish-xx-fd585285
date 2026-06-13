/**
 * Image URL helper.
 *
 * Previously this rewrote Supabase public object URLs into the on-the-fly
 * `/render/image/` endpoint to serve resized variants. That endpoint is
 * metered (Storage Image Transformations) and we were going into overage,
 * so we now bypass it entirely and return the original public URL.
 *
 * The original object is still served from Supabase's CDN, so it's cached
 * globally — just at full resolution. To keep payloads small, prefer
 * uploading appropriately sized images at capture time (see
 * `utils/photo-watermark` and the upload flows) rather than resizing on
 * read.
 *
 * If we ever want resizing back, swap the body of `getTransformedUrl` to
 * build the `/storage/v1/render/image/public/...` URL again.
 */

type Resize = "cover" | "contain" | "fill";

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 20-100
  resize?: Resize;
}

export function getTransformedUrl(
  url: string | null | undefined,
  _opts: TransformOptions = {}
): string {
  // Bypass Supabase image transformations to avoid overage on the
  // metered render endpoint. Return the original URL as-is.
  return url ?? "";
}

/** Small thumbnail for feed cards, grids, avatars. */
export function thumb(url: string | null | undefined): string {
  return getTransformedUrl(url);
}

/** Medium variant for single-post viewers and lightbox previews. */
export function medium(url: string | null | undefined): string {
  return getTransformedUrl(url);
}

/** Tiny avatar variant (profile pics in lists, comments, nav). */
export function avatarThumb(url: string | null | undefined): string {
  return getTransformedUrl(url);
}