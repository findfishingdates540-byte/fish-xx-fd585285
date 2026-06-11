/**
 * Supabase Storage Image Transformations helper.
 *
 * Rewrites Supabase public object URLs into the on-the-fly render endpoint
 * so we serve small, CDN-cached variants in feeds/grids instead of multi-MB
 * originals. Falls through unchanged for non-Supabase URLs (blob:, data:,
 * external CDNs).
 *
 * Requires the project to be on a Supabase plan that includes image
 * transformations. If unavailable the render URL returns 400 — fall back
 * to the original by passing the raw URL.
 */

type Resize = "cover" | "contain" | "fill";

export interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number; // 20-100
  resize?: Resize;
}

const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

export function getTransformedUrl(
  url: string | null | undefined,
  opts: TransformOptions = {}
): string {
  if (!url) return "";
  // Skip non-http(s) sources and obvious non-Supabase URLs.
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  const idx = url.indexOf(OBJECT_PATH);
  if (idx === -1) return url; // not a Supabase public object URL — leave alone

  const base = url.slice(0, idx);
  const rest = url.slice(idx + OBJECT_PATH.length);

  const params = new URLSearchParams();
  if (opts.width) params.set("width", String(Math.round(opts.width)));
  if (opts.height) params.set("height", String(Math.round(opts.height)));
  if (opts.quality) params.set("quality", String(Math.round(opts.quality)));
  params.set("resize", opts.resize ?? "cover");

  const qs = params.toString();
  return `${base}${RENDER_PATH}${rest}${qs ? `?${qs}` : ""}`;
}

/** Small thumbnail for feed cards, grids, avatars. */
export function thumb(url: string | null | undefined): string {
  return getTransformedUrl(url, { width: 400, quality: 70 });
}

/** Medium variant for single-post viewers and lightbox previews. */
export function medium(url: string | null | undefined): string {
  return getTransformedUrl(url, { width: 1080, quality: 80 });
}

/** Tiny avatar variant (profile pics in lists, comments, nav). */
export function avatarThumb(url: string | null | undefined): string {
  return getTransformedUrl(url, { width: 160, height: 160, quality: 70 });
}