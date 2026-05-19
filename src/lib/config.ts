/**
 * Application configuration constants
 */

// The production domain for share links, referrals, etc.
export const PRODUCTION_URL = 'https://fish-x.com';

/**
 * Get the base URL for shareable links.
 * Uses production URL in production, otherwise falls back to current origin.
 */
export function getShareBaseUrl(): string {
  // In production or when we have a custom domain, use the production URL
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // If we're on the production domain or a lovable.app preview, use production URL for shares
    if (origin.includes('fish-x.com') || origin.includes('lovable.app')) {
      return PRODUCTION_URL;
    }
    // For local development, use the current origin
    return origin;
  }
  return PRODUCTION_URL;
}
