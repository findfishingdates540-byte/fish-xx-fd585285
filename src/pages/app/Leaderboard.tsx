import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, ChevronRight, Fish, Flame, Star, Trophy, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Species {
  id: string;
  name: string;
  image_url: string | null;
}

interface LeaderboardEntry {
  id: string;
  user_id: string;
  species_id: string;
  species_name: string;
  total_caught: number;
  total_released: number;
  total_harvested: number;
  largest_weight_lbs: number | null;
  largest_length_in: number | null;
  largest_catch_id: string | null;
  rank_by_weight: number | null;
  rank_by_count: number | null;
}

interface ProfileInfo {
  id: string;
  display_name: string | null;
  photos: string[] | null;
}

interface TournamentRow {
  id: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string | null;
  scoring_method: string;
}

interface ChallengeRow {
  id: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
  target_species_name: string | null;
}

interface LatestCatch {
  id: string;
  species_name: string | null;
  user_id: string;
  caught_at: string | null;
  created_at: string;
}

export default function Leaderboard() {
  const navigate = useNavigate();

  const { data: speciesList = [], isLoading: speciesLoading } = useQuery({
    queryKey: ["leaderboard-species"],
    queryFn: async () => {
      const { data } = await supabase.from("fish_species").select("id, name, image_url").order("name");
      return (data || []) as Species[];
    },
  });

  const { data: topEntries = [] } = useQuery({
    queryKey: ["leaderboard-top-overview"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leaderboard_entries")
        .select("*")
        .eq("rank_by_weight", 1)
        .order("largest_weight_lbs", { ascending: false, nullsFirst: false })
        .limit(20);
      return (data || []) as LeaderboardEntry[];
    },
  });

  const topUserIds = topEntries.map((e) => e.user_id);
  const { data: topProfilesMap = {} } = useQuery({
    queryKey: ["leaderboard-top-profiles", topUserIds.join(",")],
    queryFn: async () => {
      if (topUserIds.length === 0) return {};
      const { data } = await supabase.from("profiles_safe").select("id, display_name, photos").in("id", topUserIds);
      const map: Record<string, ProfileInfo> = {};
      (data || []).forEach((p) => { map[p.id] = p as ProfileInfo; });
      return map;
    },
    enabled: topUserIds.length > 0,
  });

  const { data: ongoingTournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["scoreboard-ongoing-tournaments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("id,title,status,start_date,end_date,scoring_method")
        .eq("status", "in_progress")
        .order("start_date", { ascending: true })
        .limit(8);
      return (data || []) as TournamentRow[];
    },
  });

  const tournamentIds = ongoingTournaments.map((t) => t.id);
  const { data: tournamentCounts = {} } = useQuery({
    queryKey: ["scoreboard-tournament-counts", tournamentIds.join(",")],
    queryFn: async () => {
      if (tournamentIds.length === 0) return {};
      const { data } = await supabase
        .from("tournament_participants")
        .select("tournament_id")
        .in("tournament_id", tournamentIds);
      const map: Record<string, number> = {};
      (data || []).forEach((p: any) => {
        map[p.tournament_id] = (map[p.tournament_id] || 0) + 1;
      });
      return map;
    },
    enabled: tournamentIds.length > 0,
  });

  const { data: ongoingChallenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ["scoreboard-ongoing-challenges"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("fishing_challenges")
        .select("id,title,status,start_date,end_date,target_species_name")
        .lte("start_date", today)
        .gte("end_date", today)
        .neq("status", "completed")
        .order("end_date", { ascending: true })
        .limit(8);
      return (data || []) as ChallengeRow[];
    },
  });

  const challengeIds = ongoingChallenges.map((c) => c.id);
  const { data: challengeCounts = {} } = useQuery({
    queryKey: ["scoreboard-challenge-counts", challengeIds.join(",")],
    queryFn: async () => {
      if (challengeIds.length === 0) return {};
      const { data } = await supabase
        .from("challenge_participants")
        .select("challenge_id")
        .in("challenge_id", challengeIds);
      const map: Record<string, number> = {};
      (data || []).forEach((p: any) => {
        map[p.challenge_id] = (map[p.challenge_id] || 0) + 1;
      });
      return map;
    },
    enabled: challengeIds.length > 0,
  });

  const { data: latestCatches = [] } = useQuery({
    queryKey: ["scoreboard-latest-catches-feed"],
    queryFn: async () => {
      const { data } = await supabase
        .from("catches")
        .select("id,species_name,user_id,caught_at,created_at")
        .eq("approval_status", "approved")
        .eq("is_private", false)
        .order("created_at", { ascending: false })
        .limit(12);
      return (data || []) as LatestCatch[];
    },
  });

  const latestUserIds = useMemo(() => [...new Set(latestCatches.map((c) => c.user_id).filter(Boolean))], [latestCatches]);
  const { data: latestProfiles = {} } = useQuery({
    queryKey: ["scoreboard-latest-profiles", latestUserIds.join(",")],
    queryFn: async () => {
      if (latestUserIds.length === 0) return {};
      const { data } = await supabase.from("profiles_safe").select("id, display_name, photos").in("id", latestUserIds);
      const map: Record<string, ProfileInfo> = {};
      (data || []).forEach((p) => { map[p.id] = p as ProfileInfo; });
      return map;
    },
    enabled: latestUserIds.length > 0,
  });

  const featuredSpecies = topEntries.slice(0, 2).map((entry) => {
    const sp = speciesList.find((s) => s.id === entry.species_id);
    const profile = topProfilesMap[entry.user_id];
    return { entry, species: sp, profile };
  });

  const featuredRows = topEntries.slice(0, 8).map((entry) => {
    const species = speciesList.find((s) => s.id === entry.species_id);
    const profile = topProfilesMap[entry.user_id];
    return { entry, species, profile };
  });

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const scoringLabel = (value: string) => {
    if (value === "biggest_catch") return "Biggest catch";
    if (value === "total_weight") return "Total length";
    if (value === "most_catches") return "Most catches";
    return value.replace(/_/g, " ");
  };

  return (
    <div className="scoreboard-hub min-h-screen -mx-4 md:-mx-0">
      {/* Live activity marquee */}
      <div className="border-b sb-border bg-[hsl(var(--sb-surface))] overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 py-2 text-xs">
          <span className="shrink-0 inline-flex items-center gap-1.5 font-semibold sb-cyan uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--sb-cyan))] animate-pulse" />
            Live
          </span>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <div className="sb-marquee-track">
              {[0, 1].map((dup) => (
                <span key={dup} className="inline-flex items-center gap-8 pr-8 sb-text-muted">
                  {latestCatches.length > 0 ? latestCatches.map((catchItem) => (
                    <span key={`${dup}-${catchItem.id}`}>
                      <span className="sb-cyan font-medium">Catch Logged:</span>{" "}
                      {latestProfiles[catchItem.user_id]?.display_name || "Angler"} landed {catchItem.species_name || "a catch"}
                    </span>
                  )) : <span>Recent catches will appear here as anglers log them.</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 pb-24">
      {/* Header + Stats */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Featured Species</h1>
          <p className="sb-text-muted mt-1 text-sm">Ongoing tournaments, active fishing challenges, and species records.</p>
        </div>
      </div>

      <div className="space-y-8">
          {/* Featured Species */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Star className="h-5 w-5 sb-cyan fill-[hsl(var(--sb-cyan))]" />
                Featured Species
              </h2>
              <button onClick={() => navigate("/app/species")} className="text-xs sb-cyan hover:underline font-medium">View All Species →</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {speciesLoading ? (
                <><Skeleton className="h-48 rounded-xl bg-[hsl(var(--sb-surface-2))]" /><Skeleton className="h-48 rounded-xl bg-[hsl(var(--sb-surface-2))]" /></>
              ) : featuredSpecies.length > 0 ? (
                featuredSpecies.map(({ entry, species, profile }) => (
                  <button key={entry.id} onClick={() => entry.largest_catch_id ? navigate(`/app/catches/${entry.largest_catch_id}`) : navigate(`/app/leaderboard/species/${entry.species_id}`)} className="sb-card overflow-hidden hover:border-[hsl(var(--sb-cyan))] transition-colors text-left group">
                    <div className="h-36 bg-muted relative overflow-hidden">
                      {species?.image_url ? <img src={species.image_url} alt={species.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center"><Fish className="h-12 w-12 sb-text-muted" /></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sb-surface))] via-transparent to-transparent" />
                      <Badge className="absolute top-3 left-3 sb-bg-cyan border-0 text-[10px] uppercase tracking-wider font-bold">{entry.species_name}</Badge>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-7 w-7"><AvatarImage src={profile?.photos?.[0] || ""} /><AvatarFallback className="text-xs">{(profile?.display_name || "?")[0]}</AvatarFallback></Avatar>
                        <div className="min-w-0"><p className="text-[10px] sb-text-muted uppercase tracking-wider">Current #1</p><p className="text-sm font-semibold truncate">{profile?.display_name || "Angler"}</p></div>
                      </div>
                      <div className="text-right shrink-0"><p className="text-[10px] sb-text-muted uppercase tracking-wider">Record</p><p className="text-lg font-bold sb-cyan">{entry.largest_weight_lbs ? `${entry.largest_weight_lbs} lbs` : `${entry.total_caught}`}</p></div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-2 sb-card p-8 text-center"><Fish className="h-10 w-10 mx-auto sb-text-muted mb-2" /><p className="sb-text-muted">No catches logged yet. Be the first!</p></div>
              )}
            </div>
          </section>

          {/* Tables */}
          <section>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <DataTable
                title="Ongoing Tournaments"
                icon={<Trophy className="h-5 w-5 sb-gold" />}
                loading={tournamentsLoading}
                empty="No tournaments are live right now."
                actionLabel="View tournaments"
                onAction={() => navigate("/app/tournaments")}
              >
                {ongoingTournaments.map((t) => (
                  <button key={t.id} onClick={() => navigate(`/app/tournaments/${t.id}`)} className="w-full grid grid-cols-[1fr_auto] gap-3 px-4 py-3 border-t sb-border text-left hover:bg-[hsl(var(--sb-surface-2))] transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{t.title}</p>
                      <p className="text-xs sb-text-muted truncate">{scoringLabel(t.scoring_method)} · {tournamentCounts[t.id] || 0} teams</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] sb-text-muted uppercase tracking-wider">Ends</p>
                      <p className="text-xs font-bold sb-cyan">{formatDate(t.end_date)}</p>
                    </div>
                  </button>
                ))}
              </DataTable>

              <DataTable
                title="Ongoing Fishing Challenges"
                icon={<Flame className="h-5 w-5 sb-cyan" />}
                loading={challengesLoading}
                empty="No fishing challenges are live right now."
                actionLabel="View challenges"
                onAction={() => navigate("/app/challenges")}
              >
                {ongoingChallenges.map((c) => (
                  <button key={c.id} onClick={() => navigate(`/app/challenges/${c.id}`)} className="w-full grid grid-cols-[1fr_auto] gap-3 px-4 py-3 border-t sb-border text-left hover:bg-[hsl(var(--sb-surface-2))] transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.title}</p>
                      <p className="text-xs sb-text-muted truncate">{c.target_species_name || "Any species"} · {challengeCounts[c.id] || 0} anglers</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] sb-text-muted uppercase tracking-wider">Ends</p>
                      <p className="text-xs font-bold sb-cyan">{formatDate(c.end_date)}</p>
                    </div>
                  </button>
                ))}
              </DataTable>

              <DataTable
                title="Featured Species"
                icon={<Star className="h-5 w-5 sb-cyan fill-[hsl(var(--sb-cyan))]" />}
                loading={speciesLoading}
                empty="No species records yet."
                actionLabel="View species"
                onAction={() => navigate("/app/species")}
              >
                {featuredRows.map(({ entry, species, profile }) => (
                  <button key={entry.id} onClick={() => navigate(`/app/leaderboard/species/${entry.species_id}`)} className="w-full grid grid-cols-[1fr_auto] gap-3 px-4 py-3 border-t sb-border text-left hover:bg-[hsl(var(--sb-surface-2))] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-[hsl(var(--sb-surface-2))] overflow-hidden flex items-center justify-center shrink-0">
                        {species?.image_url ? <img src={species.image_url} alt={species.name} className="h-full w-full object-cover" /> : <Fish className="h-5 w-5 sb-text-muted" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{species?.name || entry.species_name}</p>
                        <p className="text-xs sb-text-muted truncate">Top angler: {profile?.display_name || "Angler"}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] sb-text-muted uppercase tracking-wider">Record</p>
                      <p className="text-xs font-bold sb-cyan">{entry.largest_weight_lbs ? `${entry.largest_weight_lbs} lbs` : `${entry.total_caught} caught`}</p>
                    </div>
                  </button>
                ))}
              </DataTable>
            </div>
          </section>
      </div>
      </div>
    </div>
  );
}

function DataTable({
  title,
  icon,
  loading,
  empty,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  loading: boolean;
  empty: string;
  actionLabel: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  const hasRows = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="sb-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[hsl(var(--sb-surface-2))]">
        <h3 className="font-bold text-sm flex items-center gap-2 min-w-0">
          {icon}
          <span className="truncate">{title}</span>
        </h3>
        <button onClick={onAction} className="text-[10px] font-semibold uppercase tracking-wider sb-cyan hover:underline shrink-0">
          {actionLabel}
        </button>
      </div>
      {loading ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg bg-[hsl(var(--sb-surface-2))]" />
          ))}
        </div>
      ) : hasRows ? (
        <div>{children}</div>
      ) : (
        <div className="p-8 text-center">
          <CalendarDays className="h-8 w-8 mx-auto sb-text-muted opacity-50 mb-2" />
          <p className="text-sm sb-text-muted">{empty}</p>
        </div>
      )}
    </div>
  );
}
