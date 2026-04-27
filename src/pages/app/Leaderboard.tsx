import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Search,
  Fish,
  ChevronRight,
  Users,
  Sparkles,
  Shield,
  Globe,
  MapPin,
  Trophy,
  Medal,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
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


export default function Leaderboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [teamCategoryFilter, setTeamCategoryFilter] = useState("all");

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
      const { data } = await supabase.from("leaderboard_entries").select("*").eq("rank_by_weight", 1).order("largest_weight_lbs", { ascending: false }).limit(20);
      return (data || []) as LeaderboardEntry[];
    },
  });

  const topUserIds = topEntries.map((e) => e.user_id);
  const { data: topProfilesMap = {} } = useQuery({
    queryKey: ["leaderboard-top-profiles", topUserIds.join(",")],
    queryFn: async () => {
      if (topUserIds.length === 0) return {};
      const { data } = await supabase.from("profiles").select("id, display_name, photos").in("id", topUserIds);
      const map: Record<string, ProfileInfo> = {};
      (data || []).forEach((p) => { map[p.id] = p as ProfileInfo; });
      return map;
    },
    enabled: topUserIds.length > 0,
  });

  const { data: globalTopAnglers = [] } = useQuery({
    queryKey: ["global-top-anglers"],
    queryFn: async () => {
      const { data } = await supabase.from("leaderboard_entries").select("user_id, total_caught").order("total_caught", { ascending: false }).limit(50);
      if (!data) return [];
      const userMap: Record<string, number> = {};
      data.forEach((e) => { userMap[e.user_id] = (userMap[e.user_id] || 0) + e.total_caught; });
      return Object.entries(userMap).map(([user_id, total]) => ({ user_id, total })).sort((a, b) => b.total - a.total).slice(0, 3);
    },
  });

  const globalAnglerIds = globalTopAnglers.map((a) => a.user_id);
  const { data: globalAnglerProfiles = {} } = useQuery({
    queryKey: ["global-angler-profiles", globalAnglerIds.join(",")],
    queryFn: async () => {
      if (globalAnglerIds.length === 0) return {};
      const { data } = await supabase.from("profiles").select("id, display_name, photos").in("id", globalAnglerIds);
      const map: Record<string, ProfileInfo> = {};
      (data || []).forEach((p) => { map[p.id] = p as ProfileInfo; });
      return map;
    },
    enabled: globalAnglerIds.length > 0,
  });

  const { data: totalCatchesToday = 0 } = useQuery({
    queryKey: ["catches-today-count"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { count } = await supabase.from("catches").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString());
      return count || 0;
    },
  });

  const { data: activeChallenges = 0 } = useQuery({
    queryKey: ["active-challenges-count"],
    queryFn: async () => {
      const { count } = await supabase.from("fishing_challenges").select("*", { count: "exact", head: true }).eq("status", "active");
      return count || 0;
    },
  });

  const { data: teamScores = [] } = useQuery({
    queryKey: ["teams-rankings", teamCategoryFilter],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_team_scores", { p_category: teamCategoryFilter === "all" ? undefined : teamCategoryFilter } as any);
      return (data || []) as { team_id: string; team_name: string; logo_url: string | null; captain_id: string; member_count: number; season_points: number; last_7_days_catches: number }[];
    },
  });

  const { data: latestVerified } = useQuery({
    queryKey: ["latest-verified-catch"],
    queryFn: async () => {
      const { data } = await supabase.from("catches").select("*, user:profiles!catches_user_id_fkey(id, display_name, photos)").eq("is_verified", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const filteredSpecies = speciesList.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const featuredSpecies = topEntries.slice(0, 2).map((entry) => {
    const sp = speciesList.find((s) => s.id === entry.species_id);
    const profile = topProfilesMap[entry.user_id];
    return { entry, species: sp, profile };
  });

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
                  <span><span className="sb-cyan font-medium">Catch Verified:</span> JakeR landed a 42.5" Striped Bass in Maine</span>
                  <span><span className="sb-cyan font-medium">Catch Verified:</span> RiverMaster landed a 12.2lb Largemouth in Florida</span>
                  <span><span className="sb-cyan font-medium">Catch Verified:</span> SandyHook landed a 31" Bluefish in NJ</span>
                  <span><span className="sb-cyan font-medium">Catch Verified:</span> DeepSeaDiva landed a 110lb Yellowfin in Cabo</span>
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Scoreboards Hub</h1>
          <p className="sb-text-muted mt-1 text-sm">Track current leaders, top teams, and record catches across all species.</p>
        </div>
        <div className="flex gap-3">
          <div className="sb-card px-5 py-3 text-center min-w-[140px]">
            <p className="text-[10px] sb-text-muted uppercase tracking-widest">Catches Today</p>
            <p className="text-2xl font-bold sb-cyan">{totalCatchesToday.toLocaleString()}</p>
          </div>
          <button onClick={() => navigate("/app/challenges")} className="sb-card px-5 py-3 text-center min-w-[140px] hover:bg-[hsl(var(--sb-surface-2))] transition-colors">
            <p className="text-[10px] sb-text-muted uppercase tracking-widest">Active Contests</p>
            <p className="text-2xl font-bold sb-cyan">{activeChallenges}</p>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-8">
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

          {/* Species Search */}
          <section>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sb-text-muted z-10" />
              <Input placeholder="Search species or anglers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 sb-input" />
            </div>
            {searchQuery && (
              <div className="space-y-2">
                {filteredSpecies.length === 0 ? (
                  <p className="text-sm sb-text-muted text-center py-6">No species match your search.</p>
                ) : (
                  filteredSpecies.slice(0, 8).map((sp) => {
                    const topEntry = topEntries.find((e) => e.species_id === sp.id);
                    const topProfile = topEntry ? topProfilesMap[topEntry.user_id] : null;
                    return (
                      <button key={sp.id} onClick={() => navigate(`/app/leaderboard/species/${sp.id}`)} className="w-full flex items-center gap-3 p-3 sb-card-soft hover:border-[hsl(var(--sb-cyan))] transition-colors text-left">
                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--sb-surface))] flex items-center justify-center shrink-0 overflow-hidden">
                          {sp.image_url ? <img src={sp.image_url} alt={sp.name} className="w-full h-full object-cover" /> : <Fish className="h-5 w-5 sb-text-muted" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{sp.name}</p>
                          {topEntry && topProfile ? <p className="text-xs sb-text-muted">#1 {topProfile.display_name} — {topEntry.largest_weight_lbs ? `${topEntry.largest_weight_lbs} lbs` : `${topEntry.total_caught} caught`}</p> : <p className="text-xs sb-text-muted">No entries yet</p>}
                        </div>
                        <ChevronRight className="h-4 w-4 sb-text-muted" />
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </section>

          {/* Team Rankings */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5 sb-cyan" />Team Rankings</h2>
              <div className="grid grid-cols-4 rounded-lg overflow-hidden sb-card-soft p-0.5 gap-0.5">
                {[
                  { key: "all", label: "All" },
                  { key: "teams", label: "Teams" },
                  { key: "lady_angler", label: "Women" },
                  { key: "junior_angler", label: "Jr. Anglers" },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => setTeamCategoryFilter(key)} className={`py-1.5 px-3 text-xs font-medium text-center rounded-md transition-colors ${teamCategoryFilter === key ? "sb-bg-cyan font-semibold" : "sb-text-muted hover:text-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="sb-card overflow-hidden">
              {/* Desktop header */}
              <div className="hidden sm:grid grid-cols-[60px_1fr_100px_120px_120px] gap-2 px-4 py-2.5 bg-[hsl(var(--sb-surface-2))] text-[10px] sb-text-muted uppercase tracking-widest font-semibold">
                <span>Rank</span><span>Team Name</span><span>Anglers</span><span>Season Points</span><span className="text-right">Last 7 Days</span>
              </div>
              {teamScores.length === 0 ? (
                <div className="p-8 text-center sb-text-muted text-sm">No teams in this category yet.</div>
              ) : (
                teamScores.map((team, i) => {
                  const trendUp = team.last_7_days_catches > 5;
                  const trendFlat = team.last_7_days_catches === 0;
                  const rankColor = i === 0 ? "sb-gold" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-700" : "sb-text-muted";
                  return (
                    <div key={team.team_id} className="border-t sb-border hover:bg-[hsl(var(--sb-surface-2))] transition-colors">
                      {/* Desktop row */}
                      <div className="hidden sm:grid grid-cols-[60px_1fr_100px_120px_120px] gap-2 px-4 py-3 items-center">
                        <span className={`font-bold text-base ${rankColor}`}>#{i + 1}</span>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-[hsl(var(--sb-cyan)/0.15)] border sb-border flex items-center justify-center shrink-0 text-xs font-bold sb-cyan">{team.team_name.slice(0, 2).toUpperCase()}</div>
                          <span className="font-semibold text-sm truncate">{team.team_name}</span>
                        </div>
                        <span className="text-sm sb-text-muted">{team.member_count} Members</span>
                        <span className="text-sm font-semibold sb-cyan">{Number(team.season_points).toLocaleString()} pts</span>
                        <span className="text-right inline-flex items-center justify-end gap-1 text-xs font-medium">
                          {trendFlat ? <Minus className="h-3.5 w-3.5 sb-text-muted" /> : trendUp ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : <TrendingDown className="h-3.5 w-3.5 text-rose-400" />}
                          <span className={trendFlat ? "sb-text-muted" : trendUp ? "text-emerald-400" : "text-rose-400"}>{team.last_7_days_catches} catches</span>
                        </span>
                      </div>
                      {/* Mobile row */}
                      <div className="flex sm:hidden items-center gap-3 px-4 py-3">
                        <span className={`font-bold text-sm w-7 shrink-0 ${rankColor}`}>#{i + 1}</span>
                        <div className="w-9 h-9 rounded-full bg-[hsl(var(--sb-cyan)/0.15)] border sb-border flex items-center justify-center shrink-0 text-xs font-bold sb-cyan">{team.team_name.slice(0, 2).toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{team.team_name}</p>
                          <p className="text-xs sb-text-muted">{team.member_count} Members · {team.last_7_days_catches} catches</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold sb-cyan">{Number(team.season_points).toLocaleString()}</p>
                          <p className="text-[10px] sb-text-muted uppercase tracking-wider">pts</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button onClick={() => navigate("/app/teams")} className="mt-3 text-xs sb-cyan hover:underline font-medium">View Full Team Standings →</button>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="sb-card p-5">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-4"><Trophy className="h-4 w-4 sb-gold" />Global Top Anglers</h3>
            {globalTopAnglers.length === 0 ? (
              <p className="text-sm sb-text-muted text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3">
                {globalTopAnglers.map((angler, i) => {
                  const profile = globalAnglerProfiles[angler.user_id];
                  const medalColor = i === 0 ? "sb-gold" : i === 1 ? "text-slate-300" : "text-amber-700";
                  return (
                    <button key={angler.user_id} onClick={() => navigate(`/app/u/${angler.user_id}`)} className="w-full flex items-center gap-3 hover:bg-[hsl(var(--sb-surface-2))] rounded-lg p-1.5 -mx-1.5 transition-colors text-left">
                      <div className="relative shrink-0">
                        <Medal className={`absolute -top-1.5 -left-1.5 h-4 w-4 ${medalColor} drop-shadow`} />
                        <Avatar className="h-9 w-9 ring-2 ring-[hsl(var(--sb-border))]"><AvatarImage src={profile?.photos?.[0] || ""} /><AvatarFallback className="text-xs bg-[hsl(var(--sb-surface-2))]">{(profile?.display_name || "?")[0]}</AvatarFallback></Avatar>
                      </div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{profile?.display_name || "Angler"}</p><p className="text-xs sb-text-muted">{angler.total} Verified Catches</p></div>
                      <div className="text-right shrink-0"><p className="text-sm font-bold sb-cyan">{(angler.total * 10).toLocaleString()}</p><p className="text-[10px] sb-text-muted uppercase tracking-wider">Points</p></div>
                    </button>
                  );
                })}
              </div>
            )}
            <button onClick={() => setSearchQuery("")} className="w-full mt-4 py-2 rounded-lg border sb-border text-xs font-semibold sb-cyan hover:bg-[hsl(var(--sb-surface-2))] transition-colors">View Full Rankings</button>
          </div>

          {latestVerified && (
            <button onClick={() => navigate(`/app/catches/${latestVerified.id}`)} className="w-full sb-card overflow-hidden text-left hover:border-[hsl(var(--sb-cyan))] transition-colors">
              <div className="p-4">
                <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold mb-3">Latest Verification</p>
                <div className="flex items-start gap-3">
                  {latestVerified.cover_photo_url && <img src={latestVerified.cover_photo_url} alt="Verified catch" className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{latestVerified.species_name || "Unknown"}</p>
                    {latestVerified.weight_lbs && <p className="text-lg font-bold sb-cyan">{latestVerified.weight_lbs} lbs</p>}
                    <Badge className="mt-1 bg-emerald-500/15 text-emerald-400 border-0 text-[10px] uppercase tracking-wider"><Shield className="h-3 w-3 mr-1" />Verified</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs sb-text-muted">
                  <span>By <span className="sb-cyan font-medium">{(latestVerified.user as any)?.display_name || "Angler"}</span></span>
                  <span>{new Date(latestVerified.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] sb-cyan mt-2 font-medium">View catch details →</p>
              </div>
            </button>
          )}

          <div className="sb-card p-5 text-center bg-gradient-to-br from-[hsl(var(--sb-surface))] to-[hsl(var(--sb-cyan)/0.1)]">
            <MapPin className="h-6 w-6 sb-cyan mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">Hotspots</h3>
            <p className="text-xs sb-text-muted mb-3">See where the top catches are happening</p>
            <button onClick={() => navigate("/app/spots")} className="sb-bg-cyan text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">View Live Map</button>
          </div>

          {/* Quick Links */}
          <div className="sb-card p-5 space-y-2">
            <h3 className="font-bold text-sm mb-3">Quick Links</h3>
            <button onClick={() => navigate("/app/challenges")} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[hsl(var(--sb-surface-2))] transition-colors text-left">
              <div className="h-8 w-8 rounded-md bg-rose-500/15 flex items-center justify-center shrink-0"><Sparkles className="h-4 w-4 text-rose-400" /></div>
              <div><p className="text-sm font-medium">Fishing Challenges</p><p className="text-[10px] sb-text-muted">Compete in live events</p></div>
              <ChevronRight className="h-4 w-4 sb-text-muted ml-auto" />
            </button>
            <button onClick={() => navigate("/app/species")} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[hsl(var(--sb-surface-2))] transition-colors text-left">
              <div className="h-8 w-8 rounded-md bg-[hsl(var(--sb-cyan)/0.15)] flex items-center justify-center shrink-0"><Fish className="h-4 w-4 sb-cyan" /></div>
              <div><p className="text-sm font-medium">Species Explorer</p><p className="text-[10px] sb-text-muted">Browse species & records</p></div>
              <ChevronRight className="h-4 w-4 sb-text-muted ml-auto" />
            </button>
            <button onClick={() => navigate("/app/catches")} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[hsl(var(--sb-surface-2))] transition-colors text-left">
              <div className="h-8 w-8 rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0"><Fish className="h-4 w-4 text-emerald-400" /></div>
              <div><p className="text-sm font-medium">Log a Catch</p><p className="text-[10px] sb-text-muted">Submit & climb ranks</p></div>
              <ChevronRight className="h-4 w-4 sb-text-muted ml-auto" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
