## Problem

In the admin Photo Challenges table, the status column renders a `Select` for every row. Completed challenges (winner finalized, payouts created) still show an editable status dropdown, so an admin can accidentally flip a finished challenge back to `upcoming`/`voting` — which would corrupt prize state.

## Fix

In `src/pages/admin/AdminPhotoChallenges.tsx` (the Status cell, ~line 487):

- When `c.status === "completed"`, render a static `Badge` (same styling as the trigger currently uses) instead of the `Select`. No dropdown, no `onValueChange`.
- All other statuses keep the existing `Select` behavior unchanged.

That's the entire change — purely a UI guard. The list of allowed transitions for non-completed rows, the mutation, and the rest of the row stay as-is.

## Out of scope

- No DB-level guard / trigger preventing status regression (can add later if wanted).
- No changes to the auto-completion cron in `update-challenge-statuses`.
- No changes to fishing challenges or tournaments admin screens (ask if you want the same treatment there).
