

# Input Validation & Rate Limiting Security Plan

## Current State Assessment

**Input Validation Gaps:**
- Only 1 form uses Zod schemas (Admin AdDialog). Auth page has basic Zod for email/password but most forms rely on ad-hoc `.trim()` checks with no length limits, no sanitization, and no character restrictions.
- Contact/support ticket form sends raw user input to edge function with minimal server-side validation (no length limits, no sanitization). User-provided `name` and `message` are interpolated directly into HTML email templates -- **XSS risk via email injection**.
- Onboarding, ProfileEdit, TripPlanner, Catches, AddSpot, BuddyChat all lack structured validation schemas.
- No input length limits enforced client-side or server-side on most text fields (bio, messages, names, etc.).

**Rate Limiting Gaps:**
- Zero rate limiting anywhere -- no client-side throttling, no edge function rate limiting.
- 8 edge functions have `verify_jwt = false` (public endpoints): `submit-support-ticket`, `geocode-address`, `get-weather`, `get-mapbox-token`, `get-stripe-config`, `send-verification-reminder`, `process-trip-reminders`, `delete-account`. These are fully open to abuse.
- Auth endpoints rely solely on Supabase's built-in rate limiting (which may not be sufficient for brute force protection).

---

## Plan

### 1. Reusable Rate Limiting Utility for Edge Functions

Create a shared rate limiting helper using Supabase's database as the store:

- **New migration**: Create a `rate_limits` table with columns: `key` (text), `window_start` (timestamptz), `request_count` (int), with a TTL-based cleanup.
- **New DB function**: `check_rate_limit(key text, max_requests int, window_seconds int)` -- returns boolean, increments counter atomically using `INSERT ... ON CONFLICT DO UPDATE`.
- Apply rate limiting in every public edge function (`verify_jwt = false`):
  - `submit-support-ticket`: 5 requests per IP per 15 minutes
  - `geocode-address`: 30 requests per IP per minute
  - `get-weather`: 30 requests per IP per minute
  - `delete-account`: 3 requests per user per hour
  - `send-verification-reminder`: 3 requests per IP per hour
  - `get-mapbox-token` / `get-stripe-config`: 60 requests per IP per minute

### 2. Server-Side Input Validation in Edge Functions

Update `submit-support-ticket` and other public edge functions:

- Add **length limits**: name (100 chars), email (255), subject (200), message (5000)
- **Sanitize HTML** in user inputs before interpolating into email templates (escape `<`, `>`, `&`, `"`, `'`)
- Add the same validation pattern to `geocode-address` (limit query length)

### 3. Client-Side Zod Validation Schemas

Create a shared validation library (`src/lib/validation.ts`) with reusable schemas:

- `profileSchema` -- display_name (2-50 chars, alphanumeric + spaces), bio (20-500 chars), city/state/zip with length limits
- `messageSchema` -- content (1-2000 chars)
- `tripSchema` -- title (1-100 chars), notes (0-1000 chars)
- `catchSchema` -- species_name, weight, length with bounds
- `contactSchema` -- name, email, subject, message with limits matching server-side

Apply these schemas in: `ProfileEdit`, `Onboarding`, `TripPlanner`, `Catches`, `Contact`, `BuddyChat`, `Chat`.

### 4. Client-Side Rate Limiting / Throttling

Create a `src/lib/rate-limit.ts` utility:

- Debounce/throttle for search inputs (location search in ProfileEdit already has 300ms debounce -- good)
- Prevent rapid-fire message sending (disable send button for 1s after send)
- Prevent rapid form submissions (already partially done with `isSubmitting` states)

### 5. Auth Hardening

- Add client-side rate limiting on login attempts: after 5 failed attempts, show a cooldown timer (30s, then 60s, exponential backoff)
- Add password strength validation beyond just length (require uppercase, lowercase, number)

---

## Technical Details

**Rate limit table schema:**
```sql
CREATE TABLE public.rate_limits (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

-- Cleanup function for old entries
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT, p_max_requests INTEGER, p_window_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMPTZ;
BEGIN
  window_start_time := date_trunc('second', now()) 
    - (EXTRACT(EPOCH FROM now())::INTEGER % p_window_seconds) * INTERVAL '1 second';
  
  INSERT INTO rate_limits (key, window_start, request_count)
  VALUES (p_key, window_start_time, 1)
  ON CONFLICT (key, window_start) DO UPDATE
  SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO current_count;
  
  -- Cleanup old windows
  DELETE FROM rate_limits WHERE window_start < now() - INTERVAL '1 hour';
  
  RETURN current_count <= p_max_requests;
END;
$$;
```

**Edge function rate limit usage pattern:**
```typescript
// Get client IP from request headers
const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
const allowed = await supabase.rpc('check_rate_limit', {
  p_key: `submit-ticket:${ip}`,
  p_max_requests: 5,
  p_window_seconds: 900
});
if (!allowed) return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 });
```

**HTML sanitization helper for edge functions:**
```typescript
function escapeHtml(str: string): string {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
```

---

## Priority Order
1. Server-side rate limiting on public edge functions (highest risk)
2. HTML sanitization in email templates (XSS via email)
3. Server-side input length validation in edge functions
4. Client-side Zod schemas for forms
5. Auth brute-force protection
6. Client-side throttling refinements

