# Broadcasts v2 — Scheduling + Rich Content

Add the two deferred items from v1.

## 1. Scheduling (send later)

### Database (migration)
- Add columns to `admin_broadcasts`:
  - `scheduled_for timestamptz null`
  - `dispatch_attempts int default 0`
  - `last_dispatch_error text null`
- New status value: `scheduled` (in addition to existing `draft`/`sending`/`sent`/`failed`)
- Index: `(status, scheduled_for)` for cron lookups

### Edge function changes
- `send-admin-broadcast` accepts `scheduled_for` in the body.
  - If absent → behaves like v1 (send now).
  - If present → inserts row with `status='scheduled'`, returns immediately, **does not** fan out.
- New edge function `dispatch-scheduled-broadcasts`:
  - Internal use only (called by cron, no JWT required; protected by checking a CRON_SECRET header).
  - Finds broadcasts where `status='scheduled' AND scheduled_for <= now()`, claims one at a time by flipping to `sending`, then runs the same in-app/email fan-out logic as v1.
  - Refactor v1 fan-out into a shared helper inside the function file.

### Cron
- Use `supabase--insert` (NOT migration — contains project URL + anon key) to schedule via `pg_cron` + `pg_net`, polling every minute and invoking `dispatch-scheduled-broadcasts` with the `CRON_SECRET` header.
- Add `CRON_SECRET` via `secrets--add_secret`.

### Admin UI
- Add a "Schedule for later" toggle to `AdminBroadcasts.tsx`. When on, show a datetime-local picker (must be future).
- Send button label switches: "Send Now" ↔ "Schedule".
- History table: show scheduled rows with their `scheduled_for` time + a "Cancel" action (admins delete the row while `status='scheduled'`).

## 2. Rich Text / Images

### Editor
- Use **TipTap** (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`) — lightweight, headless, plays well with Tailwind.
- New component `src/components/broadcasts/RichTextEditor.tsx` with toolbar: Bold, Italic, Bulleted list, Link, Image upload.
- Image upload: posts to Supabase Storage bucket `broadcast-media/{admin_user_id}/{uuid}.{ext}`, inserts the public URL into the editor.

### Storage
- Migration: create public bucket `broadcast-media` with RLS — admins INSERT, anyone SELECT (since the URLs are embedded in emails/popups).

### Database
- Replace usage of `body` (plain text) with `body_html` (sanitized HTML).
  - Add `body_html text` column to `admin_broadcasts`. Keep existing `body` as plain-text fallback for old rows and for places where HTML is undesirable (e.g. in-app notification preview).
  - On send, store both: a sanitized HTML version and a plain-text excerpt (auto-derived).

### Edge function
- Use a small DOM sanitizer (e.g. `npm:isomorphic-dompurify`) to scrub the HTML server-side before storing/sending — strips `<script>`, event handlers, disallowed tags. Allowlist: `p, br, strong, em, u, a, ul, ol, li, img, h2, h3, blockquote`.
- Email: drop the rich HTML directly into the existing email template body slot (replaces the current `escape(body)` block). Keep the dark navy header + CTA chrome.
- In-app notification: store plain-text excerpt (first 200 chars stripped of tags) in `notifications.body`, full `body_html` in `notifications.data.body_html` so the notifications panel can later render the rich version.

### Popup
- `BroadcastPopup.tsx`: render `body_html` via `dangerouslySetInnerHTML` inside a styled prose container (Tailwind `prose-invert prose-sm` with image max-height cap). Plain-text fallback if `body_html` missing.

### Admin UI
- Replace `<Textarea>` with the new `RichTextEditor`.
- Show a live preview card (popup + email-style) so admin can see formatting/images before sending.

## Out of scope (v3 candidates)

- Recurring schedules
- Per-segment audience targeting
- Tracked open/click analytics
- A/B subject lines