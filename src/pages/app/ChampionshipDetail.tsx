import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trophy, Calendar, Users, Sparkles, CheckCircle2, DollarSign, Crown } from "lucide-react";

export default function ChampionshipDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const { data: champ } = useQuery({
    queryKey: ["championship-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fishing_challenges")
        .select("*")
        .eq("id", id!)
        .eq("is_championship", true)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["championship-detail-tiers", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("championship_species_tiers")
        .select("*")
        .eq("championship_id", id!)
        .order("species_name");
      return data || [];
    },
  });

  const { data: standings = [] } = useQuery({
    queryKey: ["championship-standings", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("championship_teams")
        .select("id, team_id, total_points, qualifying_catches, distinct_species, calcutta_paid, final_placement, fishing_teams!championship_teams_team_id_fkey(id, name, logo_url)")
        .eq("championship_id", id!)
        .order("total_points", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30_000,
  });

  // Teams the current user captains (eligible for registration)
  const { data: myCaptainTeams = [] } = useQuery({
    queryKey: ["my-captain-teams", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("fishing_teams")
        .select("id, name, logo_url")
        .eq("captain_id", user!.id);
      return data || [];
    },
  });

  const myRegistration = standings.find((s: any) =>
    myCaptainTeams.some((t: any) => t.id === s.team_id)
  );

  useEffect(() => {
    if (params.get("payment") === "success") {
      toast.success("Calcutta payment received! Your team is in the side-pot.");
      qc.invalidateQueries({ queryKey: ["championship-standings", id] });
      setParams({}, { replace: true });
    } else if (params.get("payment") === "cancelled") {
      toast.info("Calcutta payment cancelled.");
      setParams({}, { replace: true });
    }
  }, [params, id, qc, setParams]);

  const register = useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error("Sign in to register");
      const { error } = await supabase.from("championship_teams").insert({
        championship_id: id!,
        team_id: teamId,
        registered_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Team registered for the championship");
      qc.invalidateQueries({ queryKey: ["championship-standings", id] });
    },
    onError: (e: any) => toast.error(e?.message || "Registration failed"),
  });

  const payCalcutta = useMutation({
    mutationFn: async (teamId: string) => {
      const { data, error } = await supabase.functions.invoke("championship-calcutta-checkout", {
        body: { championshipId: id, teamId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url as string;
        return;
      }
      throw new Error("No checkout URL returned");
    },
    onError: (e: any) => toast.error(e?.message || "Could not start checkout"),
  });

  if (!champ) {
    return <div className="p-6 text-sm text-muted-foreground">Loading championship…</div>;
  }

  const commonTiers = tiers.filter((t: any) => t.tier === "common");
  const premiumTiers = tiers.filter((t: any) => t.tier === "premium");
  const diversity = (champ.diversity_bonuses as any[]) || [];
  const paidCount = standings.filter((s: any) => s.calcutta_paid).length;
  const calcuttaPool = (Number(champ.calcutta_entry_fee) || 0) * paidCount;

  const teamsAvailableToRegister = myCaptainTeams.filter(
    (t: any) => !standings.some((s: any) => s.team_id === t.id),
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Banner */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800">
        {champ.banner_url ? (
          <img src={champ.banner_url} alt="" className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-slate-900 via-cyan-900/40 to-slate-900 flex items-center justify-center">
            <Trophy className="w-20 h-20 text-cyan-400/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="capitalize border-white/40 text-white">{champ.status}</Badge>
            <Badge variant="outline" className="border-cyan-400/60 text-cyan-200">Championship</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{champ.title}</h1>
          <div className="flex flex-wrap gap-3 text-xs mt-1 text-white/80">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {champ.start_date} → {champ.end_date}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {standings.length} teams</span>
            {Number(champ.calcutta_entry_fee) > 0 && (
              <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> ${calcuttaPool.toLocaleString()} Calcutta pool</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {champ.description && (
            <Card className="p-4">
              <h2 className="font-semibold mb-2">About</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{champ.description}</p>
            </Card>
          )}

          {/* Standings */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold flex items-center gap-2"><Trophy className="w-4 h-4 text-cyan-400" /> Team standings</h2>
              <span className="text-xs text-muted-foreground">Updates every 30s</span>
            </div>
            {standings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teams registered yet.</p>
            ) : (
              <div className="space-y-1">
                {standings.map((s: any, i: number) => {
                  const team = s.fishing_teams;
                  return (
                    <Link
                      to={`/app/teams/${s.team_id}`}
                      key={s.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800/60 transition"
                    >
                      <span className={`w-7 text-center text-sm font-semibold ${i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {i === 0 ? <Crown className="w-4 h-4 inline" /> : i + 1}
                      </span>
                      {team?.logo_url ? (
                        <img src={team.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm flex items-center gap-2">
                          {team?.name || "Team"}
                          {s.calcutta_paid && <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-300">Calcutta</Badge>}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {s.qualifying_catches || 0} catches · {s.distinct_species || 0} species
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-cyan-300">{Number(s.total_points || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-muted-foreground">points</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Scoring rules */}
          <Card className="p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-400" /> Scoring</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Common Sharks ({commonTiers.length})</h3>
                <div className="flex flex-wrap gap-1">
                  {commonTiers.map((t: any) => (
                    <Badge key={t.id} variant="outline" className="text-[11px]">{t.species_name} · {t.points}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Premium Sharks ({premiumTiers.length}) — 50 / 75 / 100</h3>
                <div className="flex flex-wrap gap-1">
                  {premiumTiers.map((t: any) => (
                    <Badge key={t.id} variant="outline" className="text-[11px] border-cyan-500/40 text-cyan-200">{t.species_name}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700/40">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Best {champ.best_n_catches} catches count · Diversity bonus</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {diversity.map((d: any, i: number) => (
                  <Badge key={i} variant="outline" className="text-[11px]">{d.species} species → +{d.bonus} pts</Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Registration sidebar */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-semibold mb-2">Enter your team</h2>
            {!user ? (
              <p className="text-sm text-muted-foreground">Sign in to register a team.</p>
            ) : myCaptainTeams.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Only team captains can register a team.</p>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link to="/app/teams/new">Create a team</Link>
                </Button>
              </div>
            ) : myRegistration ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registered: <strong>{(myRegistration as any).fishing_teams?.name}</strong></span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Score: {Number((myRegistration as any).total_points || 0).toLocaleString()} pts ·{" "}
                  {(myRegistration as any).qualifying_catches || 0} catches
                </div>
                {Number(champ.calcutta_entry_fee) > 0 && (
                  <div className="pt-3 border-t border-slate-700/40">
                    {(myRegistration as any).calcutta_paid ? (
                      <Badge variant="outline" className="text-emerald-300 border-emerald-500/40">Calcutta paid ✓</Badge>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mb-2">
                          Optional Team Calcutta — ${Number(champ.calcutta_entry_fee)} for the top-3 side-pot.
                        </p>
                        <Button
                          size="sm"
                          className="w-full bg-cyan-600 hover:bg-cyan-500"
                          disabled={payCalcutta.isPending}
                          onClick={() => payCalcutta.mutate((myRegistration as any).team_id)}
                        >
                          {payCalcutta.isPending ? "Starting checkout…" : `Pay $${Number(champ.calcutta_entry_fee)} Calcutta`}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : teamsAvailableToRegister.length === 0 ? (
              <p className="text-sm text-muted-foreground">All your teams are already registered.</p>
            ) : (
              <div className="space-y-2">
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger><SelectValue placeholder="Choose a team" /></SelectTrigger>
                  <SelectContent>
                    {teamsAvailableToRegister.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  disabled={!selectedTeamId || register.isPending}
                  onClick={() => register.mutate(selectedTeamId)}
                >
                  {register.isPending ? "Registering…" : "Register team (free)"}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  By registering you confirm you're the captain of this team. Members' approved catches will count automatically.
                </p>
              </div>
            )}
          </Card>

          {champ.prize_description && (
            <Card className="p-4">
              <h2 className="font-semibold mb-2 flex items-center gap-2"><Trophy className="w-4 h-4 text-cyan-400" /> Prizes</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{champ.prize_description}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}