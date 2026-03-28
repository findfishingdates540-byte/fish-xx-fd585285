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
    <div className="max-w-7xl mx-auto p-4 md:p-6 pb-24">
      {/* Header + Stats */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Scoreboards Hub</h1>
          <p className="text-muted-foreground mt-1">Track current leaders, top teams, and record catches across all species.</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border bg-background px-5 py-3 text-center min-w-[120px]">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Catches Today</p>
            <p className="text-2xl font-bold text-primary">{totalCatchesToday.toLocaleString()}</p>
          </div>
          <button onClick={() => navigate("/app/challenges")} className="rounded-xl border bg-background px-5 py-3 text-center min-w-[120px] hover:bg-muted/50 transition-colors">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Contests</p>
            <p className="text-2xl font-bold text-primary">{activeChallenges}</p>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-8">
          {/* Featured Species */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Featured Species
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {speciesLoading ? (
                <><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></>
              ) : featuredSpecies.length > 0 ? (
                featuredSpecies.map(({ entry, species, profile }) => (
                  <button key={entry.id} onClick={() => navigate(`/app/leaderboard/species/${entry.species_id}`)} className="relative rounded-xl border overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors text-left group">
                    <div className="h-36 bg-muted relative overflow-hidden">
                      {species?.image_url ? <img src={species.image_url} alt={species.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center"><Fish className="h-12 w-12 text-muted-foreground" /></div>}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                      <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground border-0 text-xs">{entry.species_name}</Badge>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-7 w-7"><AvatarImage src={profile?.photos?.[0] || ""} /><AvatarFallback className="text-xs">{(profile?.display_name || "?")[0]}</AvatarFallback></Avatar>
                        <div className="min-w-0"><p className="text-xs text-muted-foreground">Current #1</p><p className="text-sm font-medium truncate">{profile?.display_name || "Angler"}</p></div>
                      </div>
                      <div className="text-right shrink-0"><p className="text-xs text-muted-foreground uppercase">Record</p><p className="text-lg font-bold text-primary">{entry.largest_weight_lbs ? `${entry.largest_weight_lbs} lbs` : `${entry.total_caught}`}</p></div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-2 rounded-xl border bg-muted/20 p-8 text-center"><Fish className="h-10 w-10 mx-auto text-muted-foreground mb-2" /><p className="text-muted-foreground">No catches logged yet. Be the first!</p></div>
              )}
            </div>
          </section>

          {/* Species Search */}
          <section>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search species or anglers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            {searchQuery && (
              <div className="space-y-2">
                {filteredSpecies.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No species match your search.</p>
                ) : (
                  filteredSpecies.slice(0, 8).map((sp) => {
                    const topEntry = topEntries.find((e) => e.species_id === sp.id);
                    const topProfile = topEntry ? topProfilesMap[topEntry.user_id] : null;
                    return (
                      <button key={sp.id} onClick={() => navigate(`/app/leaderboard/species/${sp.id}`)} className="w-full flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors text-left">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {sp.image_url ? <img src={sp.image_url} alt={sp.name} className="w-full h-full object-cover" /> : <Fish className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{sp.name}</p>
                          {topEntry && topProfile ? <p className="text-xs text-muted-foreground">#1 {topProfile.display_name} — {topEntry.largest_weight_lbs ? `${topEntry.largest_weight_lbs} lbs` : `${topEntry.total_caught} caught`}</p> : <p className="text-xs text-muted-foreground">No entries yet</p>}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
              <h2 className="text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5 text-muted-foreground" />Team Rankings</h2>
              <div className="flex rounded-lg overflow-hidden border border-border">
                {[
                  { key: "all", label: "All" },
                  { key: "teams", label: "Teams" },
                  { key: "lady_angler", label: "Women" },
                  { key: "junior_angler", label: "Jr. Anglers" },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => setTeamCategoryFilter(key)} className={`px-3 py-1.5 text-xs font-medium transition-colors ${teamCategoryFilter === key ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border overflow-hidden">
              {/* Desktop header */}
              <div className="hidden sm:grid grid-cols-[60px_1fr_100px_120px_100px] gap-2 px-4 py-2.5 bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide font-medium">
                <span>Rank</span><span>Team Name</span><span>Anglers</span><span>Season Points</span><span className="text-right">Last 7 Days</span>
              </div>
              {teamScores.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No teams in this category yet.</div>
              ) : (
                teamScores.map((team, i) => (
                  <div key={team.team_id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    {/* Desktop row */}
                    <div className="hidden sm:grid grid-cols-[60px_1fr_100px_120px_100px] gap-2 px-4 py-3 items-center">
                      <span className="font-bold text-primary text-sm">#{i + 1}</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">{team.team_name.slice(0, 2).toUpperCase()}</div>
                        <span className="font-medium text-sm truncate">{team.team_name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{team.member_count} Members</span>
                      <span className="text-sm font-medium">{Number(team.season_points).toLocaleString()} pts</span>
                      <span className="text-sm text-muted-foreground text-right">{team.last_7_days_catches} catches</span>
                    </div>
                    {/* Mobile row */}
                    <div className="flex sm:hidden items-center gap-3 px-4 py-3">
                      <span className="font-bold text-primary text-sm w-7 shrink-0">#{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">{team.team_name.slice(0, 2).toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{team.team_name}</p>
                        <p className="text-xs text-muted-foreground">{team.member_count} Members · {team.last_7_days_catches} catches</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{Number(team.season_points).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">pts</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="rounded-xl border bg-background p-5">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-4"><Globe className="h-4 w-4 text-primary" />Global Top Anglers</h3>
            {globalTopAnglers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3">
                {globalTopAnglers.map((angler, i) => {
                  const profile = globalAnglerProfiles[angler.user_id];
                  return (
                    <button key={angler.user_id} onClick={() => navigate(`/app/u/${angler.user_id}`)} className="w-full flex items-center gap-3 hover:bg-muted/50 rounded-lg p-1.5 -mx-1.5 transition-colors text-left">
                      <div className="relative">
                        {i === 0 && <span className="absolute -top-2 -left-1 text-xs">🏆</span>}
                        <Avatar className="h-9 w-9"><AvatarImage src={profile?.photos?.[0] || ""} /><AvatarFallback className="text-xs">{(profile?.display_name || "?")[0]}</AvatarFallback></Avatar>
                      </div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{profile?.display_name || "Angler"}</p><p className="text-xs text-muted-foreground">{angler.total} Verified Catches</p></div>
                      <div className="text-right shrink-0"><p className="text-sm font-bold text-primary">{(angler.total * 10).toLocaleString()}</p><p className="text-[10px] text-muted-foreground uppercase">Points</p></div>
                    </button>
                  );
                })}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" size="sm" onClick={() => setSearchQuery("")}>View Full Rankings</Button>
          </div>

          {latestVerified && (
            <div className="rounded-xl border bg-primary/5 overflow-hidden">
              <div className="p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">Latest Verification</p>
                <div className="flex items-start gap-3">
                  {latestVerified.cover_photo_url && <img src={latestVerified.cover_photo_url} alt="Verified catch" className="w-16 h-16 rounded-lg object-cover shrink-0" />}
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{latestVerified.species_name || "Unknown"}</p>
                    {latestVerified.weight_lbs && <p className="text-lg font-bold">{latestVerified.weight_lbs} lbs</p>}
                    <Badge className="mt-1 bg-emerald-600/20 text-emerald-600 border-0 text-xs"><Shield className="h-3 w-3 mr-1" />Verified</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>By <span className="text-primary font-medium">{(latestVerified.user as any)?.display_name || "Angler"}</span></span>
                  <span>{new Date(latestVerified.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-primary/10 p-5 text-center">
            <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">Hotspots</h3>
            <p className="text-xs text-muted-foreground mb-3">See where the top catches are happening</p>
            <Button variant="default" size="sm" onClick={() => navigate("/app/spots")}>View Live Map</Button>
          </div>

          {/* Quick Links */}
          <div className="rounded-xl border bg-card p-5 space-y-2">
            <h3 className="font-bold text-sm mb-3">Quick Links</h3>
            <button onClick={() => navigate("/app/challenges")} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div className="h-8 w-8 rounded-md bg-destructive/10 flex items-center justify-center shrink-0"><Sparkles className="h-4 w-4 text-destructive" /></div>
              <div><p className="text-sm font-medium">Fishing Challenges</p><p className="text-[10px] text-muted-foreground">Compete in live events</p></div>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </button>
            <button onClick={() => navigate("/app/species")} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0"><Fish className="h-4 w-4 text-primary" /></div>
              <div><p className="text-sm font-medium">Species Explorer</p><p className="text-[10px] text-muted-foreground">Browse species & records</p></div>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </button>
            <button onClick={() => navigate("/app/catches")} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0"><Fish className="h-4 w-4 text-emerald-500" /></div>
              <div><p className="text-sm font-medium">Log a Catch</p><p className="text-[10px] text-muted-foreground">Submit & climb ranks</p></div>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
