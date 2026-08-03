import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApprovalBadge } from "@/components/competition/ApprovalBadge";
import { Fish } from "lucide-react";

type Status = "pending" | "approved" | "rejected";

export function ChampionshipCatchesPanel({ championshipId }: { championshipId: string }) {
  const [tab, setTab] = useState<Status>("approved");

  const { data: catches = [], isLoading } = useQuery({
    queryKey: ["championship-catches", championshipId, tab],
    enabled: !!championshipId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catches")
        .select(
          "id, species_name, species_id, weight_lbs, length_in, cover_photo_url, caught_at, created_at, approval_status, approval_notes, user:profiles!catches_user_id_fkey(id, display_name, photos)",
        )
        .eq("challenge_id", championshipId)
        .eq("approval_status", tab)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as any[]) || [];
    },
    refetchInterval: 60_000,
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["championship-catches-tiers", championshipId],
    enabled: !!championshipId,
    queryFn: async () => {
      const { data } = await supabase
        .from("championship_species_tiers")
        .select("species_id, species_name, tier, points")
        .eq("championship_id", championshipId);
      return data || [];
    },
  });

  const pointsFor = useMemo(() => {
    const byId = new Map<string, number>();
    const byName = new Map<string, number>();
    (tiers as any[]).forEach((t) => {
      if (t.species_id) byId.set(t.species_id, Number(t.points) || 0);
      if (t.species_name) byName.set(String(t.species_name).toLowerCase(), Number(t.points) || 0);
    });
    return (c: any) => {
      if (c.species_id && byId.has(c.species_id)) return byId.get(c.species_id)!;
      if (c.species_name && byName.has(String(c.species_name).toLowerCase()))
        return byName.get(String(c.species_name).toLowerCase())!;
      return null;
    };
  }, [tiers]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h2 className="font-semibold flex items-center gap-2">
          <Fish className="w-4 h-4 text-cyan-400" /> Catch submissions
        </h2>
        <span className="text-xs text-muted-foreground">See how points are earned</span>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList className="mb-3">
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="pending">Pending review</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading catches…</p>
          ) : catches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tab === "approved"
                ? "No approved catches yet."
                : tab === "pending"
                  ? "No catches waiting on review."
                  : "No rejected catches."}
            </p>
          ) : (
            <div className="space-y-2">
              {catches.map((c: any) => {
                const pts = pointsFor(c);
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-2 rounded-md border border-border/60 bg-muted/20"
                  >
                    {c.cover_photo_url ? (
                      <img src={c.cover_photo_url} alt={c.species_name || "Catch"} className="w-14 h-14 rounded-md object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center">
                        <Fish className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{c.species_name || "Unknown species"}</div>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-2">
                        {c.weight_lbs ? <span>{Number(c.weight_lbs)} lbs</span> : null}
                        {c.length_in ? <span>{Number(c.length_in)} in</span> : null}
                        <span>{new Date(c.caught_at || c.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="w-4 h-4">
                          <AvatarImage src={c.user?.photos?.[0]} alt="" />
                          <AvatarFallback className="text-[8px]">
                            {(c.user?.display_name || "A").slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {c.user?.display_name || "Angler"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <ApprovalBadge status={c.approval_status} notes={c.approval_notes} />
                      {pts !== null && (
                        <Badge variant="outline" className="text-[10px] border-cyan-500/40 text-cyan-300">
                          {c.approval_status === "approved" ? `+${pts} pts` : `${pts} pts if approved`}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}