import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fish } from "lucide-react";

interface Props { teamId: string; memberUserIds: string[]; }

export default function TeamCatchesTab({ teamId, memberUserIds }: Props) {
  const { data: catches = [], isLoading } = useQuery({
    queryKey: ["team-catches", teamId, memberUserIds.join(",")],
    queryFn: async () => {
      if (memberUserIds.length === 0) return [];
      const [tRes, cRes, chRes] = await Promise.all([
        supabase.from("tournament_participants").select("tournament_id").eq("team_id", teamId),
        supabase.from("challenge_participants").select("challenge_id").eq("team_id", teamId),
        supabase.from("championship_teams").select("championship_id").eq("team_id", teamId),
      ]);
      const tournamentIds = (tRes.data || []).map((r: any) => r.tournament_id).filter(Boolean);
      const challengeIds = Array.from(new Set([
        ...(cRes.data || []).map((r: any) => r.challenge_id),
        ...(chRes.data || []).map((r: any) => r.championship_id),
      ].filter(Boolean)));
      if (!tournamentIds.length && !challengeIds.length) return [];
      const orParts: string[] = [];
      if (tournamentIds.length) orParts.push(`tournament_id.in.(${tournamentIds.join(",")})`);
      if (challengeIds.length) orParts.push(`challenge_id.in.(${challengeIds.join(",")})`);
      const { data } = await supabase
        .from("catches")
        .select("id, user_id, species_name, weight_lbs, length_inches, photo_url, caught_at, approval_status, challenge_id, tournament_id")
        .in("user_id", memberUserIds)
        .or(orParts.join(","))
        .order("caught_at", { ascending: false })
        .limit(60);
      const rows = data || [];
      const ids = Array.from(new Set(rows.map((r: any) => r.user_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles_safe").select("id, display_name, photos").in("id", ids)
        : { data: [] as any[] };
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p; });
      return rows.map((r: any) => ({ ...r, angler: map[r.user_id] }));
    },
    enabled: memberUserIds.length > 0,
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading catches…</p>;
  if (!catches.length) {
    return (
      <Card className="p-8 text-center">
        <Fish className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="font-semibold">No competition catches yet</p>
        <p className="text-sm text-muted-foreground">Catches logged by members in challenges, championships and tournaments will show here.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {catches.map((c: any) => (
        <Card key={c.id} className="overflow-hidden">
          {c.photo_url ? (
            <img src={c.photo_url} alt={`${c.species_name || "Catch"} by ${c.angler?.display_name || "team member"}`} className="w-full h-40 object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-40 bg-muted grid place-items-center"><Fish className="h-8 w-8 text-muted-foreground" /></div>
          )}
          <div className="p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm truncate">{c.species_name || "Unknown species"}</p>
              <Badge variant={c.approval_status === "approved" ? "default" : c.approval_status === "rejected" ? "destructive" : "secondary"} className="text-[10px] capitalize">
                {c.approval_status || "pending"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {c.weight_lbs ? `${c.weight_lbs} lbs` : null}
              {c.weight_lbs && c.length_inches ? " · " : null}
              {c.length_inches ? `${c.length_inches} in` : null}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {c.angler?.display_name || "Team member"}
              {c.caught_at ? ` · ${new Date(c.caught_at).toLocaleDateString()}` : ""}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
