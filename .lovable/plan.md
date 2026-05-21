## Competition Catch Verification

### What gets built

1. **Catches get a competition context**
   - Add three columns to `catches`: `challenge_id`, `tournament_id`, `approval_status` (enum: `pending` / `approved` / `rejected`), plus `approval_notes`, `approved_by`, `approved_at`.
   - Regular (non-competition) catches stay untouched — `approval_status` defaults to `approved` for them so existing data keeps working.
   - Competition catches default to `pending` and are excluded from the species leaderboard until approved.

2. **Participant: Log a catch for a competition**
   - New "Log catch" button on `ChallengeDetail` and `TournamentDetail`, only visible while the comp is active and the user is a paid/registered participant.
   - Opens the existing catch logger pre-tagged with `challenge_id` / `tournament_id`. Photo + species + weight + length + spot are required.
   - After submit, the catch shows a yellow "Pending review" badge until an admin approves it.

3. **Admin: Competition catch queue**
   - New page `Admin → Competition Catches` with two tabs: **Challenge submissions** and **Tournament submissions**, each grouped by the parent comp with counts of pending entries.
   - Each row shows: photo, angler, species, weight, length, location, watermark/verification signals, "Approve" and "Reject" buttons. Rejection asks for a short reason that gets surfaced to the angler.
   - Approving sets `approval_status = approved` AND `is_verified = true` so the catch flows into the species leaderboard automatically (via the existing `refresh_leaderboard_entries` trigger on `is_verified`).

4. **Display surfaces**
   - Competition catches that are approved render an "Approved" badge (green) on the catch card; pending ones show a yellow "Pending" badge; rejected show a red "Rejected" badge with the reason on the owner's own view only.
   - `ChallengeDetail` and `TournamentDetail` leaderboards only count approved competition entries.
   - The regular species leaderboard receives approved entries automatically — no extra logic required.

5. **Notifications**
   - Angler gets a notification when their competition catch is approved or rejected.

### Technical notes

- **Migration**: add columns + enum, default `approval_status` to `'approved'` for existing rows. Update `refresh_leaderboard_entries` to additionally require `approval_status = 'approved'` (no-op for legacy rows due to backfill).
- **RLS**: participants can `INSERT` a catch with their own `user_id` AND a `challenge_id` they're paid into OR a `tournament_id` they're registered in. Admins can `UPDATE` `approval_status` (already covered by the existing "Admins can update any catch" policy).
- **Helper functions**: `is_challenge_participant(_user, _challenge)` and `is_tournament_participant(_user, _tournament)` as `SECURITY DEFINER` for clean RLS.
- **Edge function**: none needed — pure DB + frontend.
- **Files touched**:
  - Migration (new).
  - `src/pages/app/ChallengeDetail.tsx`, `src/pages/app/TournamentDetail.tsx` — Log catch CTA + pending badge.
  - New `src/components/competition/LogCompetitionCatchModal.tsx`.
  - New `src/pages/admin/AdminCompetitionCatches.tsx` + route + sidebar entry.
  - `src/pages/app/CatchDetail.tsx` and catch card — render approval badge.

### Out of scope (ask if you want it later)

- Auto-DQ rules (min weight, species mismatch, time window) — for now everything is manual review.
- Allowing anglers to edit a rejected submission and resubmit — for now they'd log a new one.
