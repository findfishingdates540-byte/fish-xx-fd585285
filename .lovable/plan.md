## Why Orca shows catches with no team challenges

On the team profile, the "team catches / weight / top species" stats are built by querying every catch logged by any team member — personal or otherwise:

```ts
// src/pages/app/TeamProfile.tsx
supabase.from("catches").select("...").in("user_id", memberUserIds)
```

So any personal catch logged through the regular Log a Catch flow by a member counts toward the team. That's why Orca shows totals even though the team hasn't entered any team challenge or tournament yet.

## How catches are actually attributed today

The `catches` table has `challenge_id` and `tournament_id` but no `team_id`. A catch becomes "team-related" only when:
- it was logged inside a tournament whose `tournament_participants` row links the user's team, or
- it was logged inside a challenge where `challenge_participants.team_id` matches the team.

There is no team-specific "Log a Catch" entry point — team contribution is always derived from team-affiliated challenge/tournament participation.

## Proposed fix

Change team stats to only count catches that are actually tied to that team's competition activity.

1. **Update the `team-stats` query in `src/pages/app/TeamProfile.tsx`** to:
   - Pull tournament ids where this team is a participant (`tournament_participants.team_id = teamId`).
   - Pull challenge ids where this team is registered (`challenge_participants.team_id = teamId`).
   - Query `catches` for member `user_id`s AND (`tournament_id IN (...)` OR `challenge_id IN (...)`).
   - If both lists are empty, return zeros immediately.
2. **Add a small helper label** under the stats block: "Counts catches logged inside team tournaments and challenges." So users understand the rule.
3. **Add a red info notice on TeamProfile** (matching the red banner pattern just added to ChallengeDetail / TournamentDetail) explaining: personal Log-a-Catch entries do not count toward the team; to contribute, log catches inside a tournament or challenge the team is registered for.

No schema changes, no migrations. Frontend-only.

## Out of scope (call out, don't build)

- Adding a dedicated "Log catch for team" flow outside of challenges/tournaments — current product model attributes team contribution via team-entered competitions only. Happy to design that as a follow-up if you want a standalone team logbook.
