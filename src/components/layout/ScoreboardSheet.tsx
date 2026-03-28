import { useNavigate } from 'react-router-dom';
import { BarChart3, Fish, Swords, Camera, Trophy } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface ScoreboardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const scoreboardLinks = [
  { to: "/app/leaderboard", label: "Scoreboards Hub", description: "Overall rankings and top anglers", icon: BarChart3 },
  { to: "/app/species", label: "Species Explorer", description: "Browse species directory and records", icon: Fish },
  { to: "/app/challenges", label: "Fishing Challenges", description: "Compete in live and upcoming events", icon: Swords },
  { to: "/app/photo-challenges", label: "Photo Challenges", description: "Submit photos, vote & win prizes", icon: Camera },
  { to: "/app/teams", label: "Teams", description: "Create or join a fishing team", icon: Trophy },
];

export function ScoreboardSheet({ open, onOpenChange }: ScoreboardSheetProps) {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-2">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-center">Scoreboard Hub</SheetTitle>
        </SheetHeader>
        <div className="grid gap-1">
          {scoreboardLinks.map((link) => (
            <button
              key={link.to}
              onClick={() => {
                onOpenChange(false);
                navigate(link.to);
              }}
              className="flex items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <link.icon className="h-5 w-5 text-foreground" />
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
