import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FishXIcon, type FishXIconName } from '@/components/ui/fishx-icon';

interface ScoreboardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const scoreboardLinks: Array<{ to: string; label: string; description: string; icon: FishXIconName; child?: boolean }> = [
  { to: "/app/leaderboard", label: "Scoreboards Hub", description: "Overall rankings and top anglers", icon: "leaderboard" },
  { to: "/app/species", label: "Species Explorer", description: "Browse species directory and records", icon: "species" },
  { to: "/app/challenges", label: "Fishing Challenges", description: "Compete in live and upcoming events", icon: "tournament" },
  { to: "/app/photo-challenges", label: "Photo Challenges", description: "Submit photos, vote & win prizes", icon: "photo" },
  { to: "/app/tournaments", label: "Tournaments", description: "Bracket-style head-to-head competitions", icon: "tournament" },
  { to: "/app/championships", label: "Championships", description: "Season-long championship series", icon: "tournament" },
  { to: "/app/teams", label: "Teams", description: "Create or join a fishing team", icon: "team2" },
  { to: "/app/scoring-rules", label: "Scoring Rules", description: "How points, multipliers & trophies work", icon: "leaderboard" },
  { to: "/app/scoring-examples", label: "Scoring Examples", description: "Walk through real catches and how points add up", icon: "leaderboard", child: true },
];

export function ScoreboardSheet({ open, onOpenChange }: ScoreboardSheetProps) {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-2 max-h-[85dvh]">
        <SheetHeader className="pb-2 shrink-0">
          <SheetTitle className="text-center">Scoreboard Hub</SheetTitle>
        </SheetHeader>
        <div className="grid gap-1 overflow-y-auto">
          {scoreboardLinks.map((link) => (
            <button
              key={link.to}
              onClick={() => {
                onOpenChange(false);
                navigate(link.to);
              }}
              className={`flex items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent ${link.child ? "ml-6 border-l-2 border-border/60 pl-3" : ""}`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <FishXIcon name={link.icon} size={36} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{link.label}</p>
                <p className="text-xs text-muted-foreground truncate">{link.description}</p>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
