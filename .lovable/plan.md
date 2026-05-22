# App-Wide Broadcast Messaging System

A new admin tool to compose a message (title + body) and deliver it through any combination of three channels: **Email**, **In-App Notification**, and **Bottom Popup Banner**.

## 1. Database (new migration)

**`admin_broadcasts`** — the composed message + send metadata
- `id`, `title`, `body`, `channels text[]` (`email` | `in_app` | `popup`)
- `audience text` (`all` for now; future: by mode/role)
- `popup_variant text` (`info` | `success` | `warning`), `popup_cta_label`, `popup_cta_url` (optional)
- `status text` (`draft` | `sending` | `sent` | `failed`), `recipient_count int`, `sent_count int`
- `created_by uuid`, `created_at`, `sent_at`
- RLS: admins full access; authenticated users `SELECT` only rows where `'popup' = ANY(channels)` AND `status = 'sent'` (needed for popup display)

**`admin_broadcast_dismissals`** — tracks which popups a user has dismissed
- `id`, `broadcast_id`, `user_id`, `dismissed_at`
- Unique `(broadcast_id, user_id)`
- RLS: user can insert/select own rows

## 2. Edge Function: `send-admin-broadcast`

Triggered when admin clicks Send. Admin-gated (verify `has_role('admin')`).
- Inserts row into `admin_broadcasts` with `status='sending'`
- If `in_app` selected → bulk insert into `notifications` (type `admin_broadcast`) for every active profile
- If `email` selected → reuse pattern from `send-event-announcement-email` (paginate profiles, send via existing email infra, dedup by email)
- If `popup` selected → no fan-out needed; the broadcast row itself drives the popup
- Updates row to `status='sent'` with counts

## 3. Admin UI: `src/pages/admin/AdminBroadcasts.tsx`

- Form: Title, Body (textarea), channel checkboxes (Email / In-App / Popup), popup variant + optional CTA fields (shown only when Popup is checked)
- Preview pane
- "Send Now" button → confirm dialog → calls edge function
- History table below: past broadcasts with channels, recipient count, sent timestamp
- Register route in admin router + nav link
- Add export to `src/pages/admin/index.ts`

## 4. Frontend: Bottom Popup Banner

New component `src/components/broadcasts/BroadcastPopup.tsx`, mounted once in the authenticated app shell (e.g. `AppLayout`).
- Query: most recent `admin_broadcasts` where `'popup' = ANY(channels)` AND `status='sent'` AND not in user's dismissals, ordered by `sent_at DESC`, limit 1
- Fixed-position bottom card matching dark theme (Outfit font, primary `#1454AE`), slide-up animation, dismiss "×" button → inserts dismissal row
- Optional CTA button if `popup_cta_url` set
- Realtime subscription to `admin_broadcasts` so new popups appear without refresh

## 5. In-App Notification Rendering

The existing notifications system already surfaces inserted rows. Add a small icon/label mapping for `type='admin_broadcast'` in the existing notifications list component so they render with a megaphone icon and the admin title/body.

## Technical Notes

- Email reuses existing `send-event-announcement-email` pattern (Resend via gateway, all-users blast, no opt-in filter — consistent with prior decision).
- All sends performed server-side in the edge function (admin role enforced).
- Audience is `all` in v1; schema leaves room for future targeting (mode, role, country).
- No changes to existing notification triggers — `admin_broadcast` is just a new `type` value.

## Out of Scope (v1)

- Scheduling (send later) — easy follow-up via `scheduled_for` column + cron
- Per-segment audiences
- Rich text / images in body
- Push notifications (can be added as a 4th channel later)