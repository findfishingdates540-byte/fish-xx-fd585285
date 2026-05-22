import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BarChart3, Fish, Info, Target, Trophy, Calendar, MapPin, Lock } from "lucide-react";

interface Props {
  team: any;
  memberUserIds: string[];
  memberCount: number;
}

export function TeamAboutPanel({ team, memberUserIds, memberCount }: Props) {
  const navigate = useNavigate();

  const { data: teamStats = { totalCatches: 0, totalWeight: 0, topSpecies: null as string | null } } = useQuery({
    queryKey: ["team-stats", team.id, memberUserIds.join(",")],
    enabled: memberUserIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("catches")
        .select("id, weight_lbs, species_name")
        .in("user_id", memberUserIds);
      const catches = data || [];
      const totalWeight = catches.reduce((sum, c: any) => sum + (Number(c.weight_lbs) || 0), 0);
      const speciesCounts: Record<string, number> = {};
      catches.forEach((c: any) => { if (c.species_name) speciesCounts[c.species_name] = (speciesCounts[c.species_name] || 0) + 1; });
      const topSpecies = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      return { totalCatches: catches.length, totalWeight: Math.round(totalWeight * 10) / 10, topSpecies };
    },
  });

  return (
    <div className="space-y-6">
      {/* Description / meta */}
      <section className="rounded-xl border bg-card p-5">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" /> About this team
        </h3>
        {team.description ? (
          <p className="text-sm text-foreground/90 mb-4 whitespace-pre-wrap">{team.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic mb-4">No description yet.</p>
        )}
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{team.team_type === "private" ? "Private" : "Public"}</span>
          </li>
          {team.location && (
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              <span>{team.location}</span>
            </li>
          )}
          <li className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>Established {new Date(team.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
          </li>
        </ul>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Fish className="h-4 w-4 text-primary" />
          </div>
          <p className="text-lg font-bold">{teamStats.totalCatches}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Catches</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <p className="text-lg font-bold">{teamStats.totalWeight} lbs</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Weight</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <p className="text-lg font-bold truncate text-sm">{teamStats.topSpecies || "—"}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Species</p>
        </div>
      </div>

      <div className="rounded-xl border bg-primary/5 p-5 text-center">
        <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
        <h3 className="font-bold text-sm mb-1">Team Rankings</h3>
        <p className="text-xs text-muted-foreground mb-3">See how your team stacks up against the competition · {memberCount} members</p>
        <Button variant="default" size="sm" onClick={() => navigate("/app/leaderboard")}>View Scoreboard</Button>
      </div>
    </div>
  );
}