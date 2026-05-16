import { Outlet } from "react-router-dom";

/**
 * Wraps scoreboard hub pages (leaderboard, species, challenges,
 * photo-challenges, tournaments, teams) in the dark blue `scoreboard-hub`
 * theme scope. Inside this scope shadcn semantic tokens are remapped to
 * the sb-* palette, so any `bg-card`, `text-muted-foreground`, `border`,
 * `bg-primary`, etc. picks up the blue theme automatically.
 */
export default function ScoreboardHubLayout() {
  return (
    <div className="scoreboard-hub min-h-screen">
      <Outlet />
    </div>
  );
}
