import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Search,
  Fish,
  Scale,
  Hash,
  ChevronRight,
  Crown,
  Medal,
  Award,
  Users,
  Sparkles,
  TrendingUp,
  Shield,
  Globe,
  MapPin,
  Info,
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

interface TeamInfo {
  id: string;
  name: string;
  skill_level: string;
  captain_id: string;
  logo_url: string | null;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [teamSkillFilter, setTeamSkillFilter] = useState("pro");

  // Fetch all species
  const { data: speciesList = [], isLoading: speciesLoading } = useQuery({
    queryKey: ["leaderboard-species"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fish_species")
        .select("id, name, image_url")
        .order("name");
      return (data || []) as Species[];
    },
  });

  // Fetch top entries (rank #1 per species, sorted by largest weight)
  const { data: topEntries = [] } = useQuery({
    queryKey: ["leaderboard-top-overview"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leaderboard_entries")
        .select("*")
        .eq("rank_by_weight", 1)
        .order("largest_weight_lbs", { ascending: false })
        .limit(20);
      return (data || []) as LeaderboardEntry[];
    },
  });

  // Fetch profiles for top entries
  const topUserIds = topEntries.map((e) => e.user_id);
  const { data: topProfilesMap = {} } = useQuery({
    queryKey: ["leaderboard-top-profiles", topUserIds.join(",")],
    queryFn: async () => {
      if (topUserIds.length === 0) return {};
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, photos")
        .in("id", topUserIds);
      const map: Record<string, ProfileInfo> = {};
      (data || []).forEach((p) => { map[p.id] = p as ProfileInfo; });
      return map;
    },
    enabled: topUserIds.length > 0,
  });

  // Global top anglers (by total catches across all species)
  const { data: globalTopAnglers = [] } = useQuery({
    queryKey: ["global-top-anglers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leaderboard_entries")
        .select("user_id, total_caught")
        .order("total_caught", { ascending: false })
        .limit(50);
      if (!data) return [];
      // Aggregate by user
      const userMap: Record<string, number> = {};
      data.forEach((e) => {
        userMap[e.user_id] = (userMap[e.user_id] || 0) + e.total_caught;
      });
      return Object.entries(userMap)
        .map(([user_id, total]) => ({ user_id, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);
    },
  });

  const globalAnglerIds = globalTopAnglers.map((a) => a.user_id);
  const { data: globalAnglerProfiles = {} } = useQuery({
    queryKey: ["global-angler-profiles", globalAnglerIds.join(",")],
    queryFn: async () => {
      if (globalAnglerIds.length === 0) return {};
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, photos")
        .in("id", globalAnglerIds);
      const map: Record<string, ProfileInfo> = {};
      (data || []).forEach((p) => { map[p.id] = p as ProfileInfo; });
      return map;
    },
    enabled: globalAnglerIds.length > 0,
  });

  // Total catches count
  const { data: totalCatchesToday = 0 } = useQuery({
    queryKey: ["catches-today-count"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("catches")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());
      return count || 0;
    },
  });

  // Active challenges count
  const { data: activeChallenges = 0 } = useQuery({
    queryKey: ["active-challenges-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("fishing_challenges")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      return count || 0;
    },
  });

  // Teams
  const { data: teams = [] } = useQuery({
    queryKey: ["teams-rankings", teamSkillFilter],
    queryFn: async () => {
      const skillMap: Record<string, "advanced" | "intermediate" | "beginner"> = { pro: "advanced", intermediate: "intermediate", beginner: "beginner" };
      const level = skillMap[teamSkillFilter] || "advanced";
      const { data } = await supabase
        .from("fishing_teams")
        .select("*")
        .eq("skill_level", level)
        .limit(10);
      return (data || []) as TeamInfo[];
    },
  });

  // Team member counts
  const teamIds = teams.map((t) => t.id);
  const { data: teamMemberCounts = {} } = useQuery({
    queryKey: ["team-member-counts", teamIds.join(",")],
    queryFn: async () => {
      if (teamIds.length === 0) return {};
      const { data } = await supabase
        .from("team_members")
        .select("team_id");
      const counts: Record<string, number> = {};
      (data || []).forEach((m) => {
        counts[m.team_id] = (counts[m.team_id] || 0) + 1;
      });
      return counts;
    },
    enabled: teamIds.length > 0,
  });

  // Latest verified catch
  const { data: latestVerified } = useQuery({
    queryKey: ["latest-verified-catch"],
    queryFn: async () => {
      const { data } = await supabase
        .from("catches")
        .select("*, user:profiles!catches_user_id_fkey(id, display_name, photos)")
        .eq("is_verified", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const filteredSpecies = speciesList.filter(
    (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Featured species = top 2 entries with largest weights
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
          <p className="text-muted-foreground mt-1">
            Track current leaders, top teams, and record catches across all species.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border bg-background px-5 py-3 text-center min-w-[120px]">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Catches Today</p>
            <p className="text-2xl font-bold text-primary">{totalCatchesToday.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border bg-background px-5 py-3 text-center min-w-[120px]">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Contests</p>
            <p className="text-2xl font-bold text-primary">{activeChallenges}</p>
          </div>
        </div>
      </div>

      {/* Main layout: left content + right sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Featured Species */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Featured Species
              </h2>
              <button
                onClick={() => setSearchQuery("")}
                className="text-sm text-primary hover:underline"
              >
                View All Species
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {speciesLoading ? (
                <>
                  <Skeleton className="h-48 rounded-xl" />
                  <Skeleton className="h-48 rounded-xl" />
                </>
              ) : featuredSpecies.length > 0 ? (
                featuredSpecies.map(({ entry, species, profile }) => (
                  <button
                    key={entry.id}
                    onClick={() => navigate(`/app/leaderboard/species/${entry.species_id}`)}
                    className="relative rounded-xl border overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors text-left group"
                  >
                    {/* Species image */}
                    <div className="h-36 bg-muted relative overflow-hidden">
                      {species?.image_url ? (
                        <img src={species.image_url} alt={species.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Fish className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                      <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground border-0 text-xs">
                        {entry.species_name}
                      </Badge>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={profile?.photos?.[0] || ""} />
                          <AvatarFallback className="text-xs">
                            {(profile?.display_name || "?")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Current #1</p>
                          <p className="text-sm font-medium truncate">
                            {profile?.display_name || "Angler"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground uppercase">Record</p>
                        <p className="text-lg font-bold text-primary">
                          {entry.largest_weight_lbs ? `${entry.largest_weight_lbs} lbs` : `${entry.total_caught}`}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-2 rounded-xl border bg-muted/20 p-8 text-center">
                  <Fish className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No catches logged yet. Be the first!</p>
                </div>
              )}
            </div>
          </section>

          {/* All Species Search */}
          <section>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search species or anglers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
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
                      <button
                        key={sp.id}
                        onClick={() => navigate(`/app/leaderboard/species/${sp.id}`)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {sp.image_url ? (
                            <img src={sp.image_url} alt={sp.name} className="w-full h-full object-cover" />
                          ) : (
                            <Fish className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{sp.name}</p>
                          {topEntry && topProfile ? (
                            <p className="text-xs text-muted-foreground">
                              #1 {topProfile.display_name} — {topEntry.largest_weight_lbs ? `${topEntry.largest_weight_lbs} lbs` : `${topEntry.total_caught} caught`}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">No entries yet</p>
                          )}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                Team Rankings
              </h2>
              <div className="flex rounded-lg overflow-hidden border border-border">
                {["pro", "intermediate", "beginner"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setTeamSkillFilter(level)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                      teamSkillFilter === level
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {level === "pro" ? "Pro" : level === "intermediate" ? "Intermediate" : "Beginner"}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[60px_1fr_100px_120px_100px] gap-2 px-4 py-2.5 bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide font-medium">
                <span>Rank</span>
                <span>Team Name</span>
                <span>Anglers</span>
                <span>Season Points</span>
                <span className="text-right">Last 7 Days</span>
              </div>

              {teams.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No teams in this skill level yet.
                </div>
              ) : (
                teams.map((team, i) => (
                  <div
                    key={team.id}
                    className="grid grid-cols-[60px_1fr_100px_120px_100px] gap-2 px-4 py-3 border-t border-border items-center hover:bg-muted/30 transition-colors"
                  >
                    <span className="font-bold text-primary text-sm">#{i + 1}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                        {team.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm truncate">{team.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {teamMemberCounts[team.id] || 0} Members
                    </span>
                    <span className="text-sm font-medium">—</span>
                    <span className="text-sm text-muted-foreground text-right">—</span>
                  </div>
                ))
              )}

              {teams.length > 0 && (
                <div className="p-3 text-center border-t border-border">
                  <button className="text-sm text-primary hover:underline">
                    View Full Team Standings
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* Global Top Anglers */}
          <div className="rounded-xl border bg-background p-5">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-primary" />
              Global Top Anglers
            </h3>

            {globalTopAnglers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3">
                {globalTopAnglers.map((angler, i) => {
                  const profile = globalAnglerProfiles[angler.user_id];
                  return (
                    <button
                      key={angler.user_id}
                      onClick={() => navigate(`/app/u/${angler.user_id}`)}
                      className="w-full flex items-center gap-3 hover:bg-muted/50 rounded-lg p-1.5 -mx-1.5 transition-colors text-left"
                    >
                      <div className="relative">
                        {i === 0 && (
                          <span className="absolute -top-2 -left-1 text-yellow-500 text-xs">🏆</span>
                        )}
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile?.photos?.[0] || ""} />
                          <AvatarFallback className="text-xs">
                            {(profile?.display_name || "?")[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {profile?.display_name || "Angler"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {angler.total} Verified Catches
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-primary">{(angler.total * 10).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Points</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full mt-4"
              size="sm"
              onClick={() => setSearchQuery("")}
            >
              View Full Rankings
            </Button>
          </div>

          {/* Latest Verification */}
          {latestVerified && (
            <div className="rounded-xl border bg-primary/5 overflow-hidden">
              <div className="p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
                  Latest Verification
                </p>
                <div className="flex items-start gap-3">
                  {latestVerified.cover_photo_url && (
                    <img
                      src={latestVerified.cover_photo_url}
                      alt="Verified catch"
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{latestVerified.species_name || "Unknown"}</p>
                    {latestVerified.length_in && (
                      <p className="text-lg font-bold">{latestVerified.length_in}"</p>
                    )}
                    {latestVerified.weight_lbs && (
                      <p className="text-lg font-bold">{latestVerified.weight_lbs} lbs</p>
                    )}
                    <Badge className="mt-1 bg-emerald-600/20 text-emerald-600 border-0 text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>
                    By{" "}
                    <span className="text-primary font-medium">
                      {(latestVerified.user as any)?.display_name || "Angler"}
                    </span>
                  </span>
                  <span>
                    {new Date(latestVerified.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Hotspots teaser */}
          <div className="rounded-xl border bg-primary/10 p-5 text-center">
            <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">Hotspots</h3>
            <p className="text-xs text-muted-foreground mb-3">
              See where the top catches are happening
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/app/spots")}
            >
              View Live Map
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


  sortBy: "weight" | "count";
  setSortBy: (s: "weight" | "count") => void;
  entries: LeaderboardEntry[];
  profiles: Record<string, ProfileInfo>;
  loading: boolean;
  onBack: () => void;
  navigate: ReturnType<typeof useNavigate>;
}

function SpeciesLeaderboard({
  speciesId,
  speciesName,
  speciesImageUrl,
  sortBy,
  setSortBy,
  entries,
  profiles,
  loading,
  onBack,
  navigate,
}: SpeciesLeaderboardProps) {
  const [searchAngler, setSearchAngler] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Fetch species details (scientific_name, description)
  const { data: speciesDetail } = useQuery({
    queryKey: ["species-detail", speciesId],
    queryFn: async () => {
      const { data } = await supabase
        .from("fish_species")
        .select("*")
        .eq("id", speciesId)
        .maybeSingle();
      return data;
    },
  });

  // Fetch catch details for entries (date, location)
  const catchIds = entries
    .map((e) => e.largest_catch_id)
    .filter(Boolean) as string[];
  const { data: catchDetails = {} } = useQuery({
    queryKey: ["species-catch-details", catchIds.join(",")],
    queryFn: async () => {
      if (catchIds.length === 0) return {};
      const { data } = await supabase
        .from("catches")
        .select("id, caught_at, general_location, created_at")
        .in("id", catchIds);
      const map: Record<string, { caught_at: string | null; general_location: string | null; created_at: string }> = {};
      (data || []).forEach((c) => { map[c.id] = c; });
      return map;
    },
    enabled: catchIds.length > 0,
  });

  // Season record (max weight for this species)
  const seasonRecord = useMemo(() => {
    if (entries.length === 0) return null;
    const maxWeight = Math.max(...entries.map((e) => e.largest_weight_lbs || 0));
    return maxWeight > 0 ? maxWeight : null;
  }, [entries]);

  // Active anglers count
  const activeAnglers = entries.length;

  // Recent logs for this species
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["species-recent-logs", speciesId],
    queryFn: async () => {
      const { data } = await supabase
        .from("catches")
        .select("id, weight_lbs, length_in, created_at, user_id, species_name")
        .eq("species_id", speciesId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!data || data.length === 0) return [];
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      const profMap: Record<string, string> = {};
      (profs || []).forEach((p) => { profMap[p.id] = p.display_name || "Angler"; });
      return data.map((c) => ({
        ...c,
        display_name: profMap[c.user_id] || "Angler",
      }));
    },
  });

  // Filter & paginate
  const filtered = useMemo(() => {
    if (!searchAngler) return entries;
    return entries.filter((e) => {
      const p = profiles[e.user_id];
      return p?.display_name?.toLowerCase().includes(searchAngler.toLowerCase());
    });
  }, [entries, profiles, searchAngler]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} minutes ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  return (
    <div className="pb-24">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-6 mx-4 md:mx-6">
        <div className="h-56 md:h-64 bg-muted relative">
          {speciesImageUrl ? (
            <img src={speciesImageUrl} alt={speciesName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Fish className="h-20 w-20 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              Species Spotlight
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">{speciesName}</h1>
            {speciesDetail?.description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-lg line-clamp-2">
                {speciesDetail.description}
              </p>
            )}
          </div>
          <div className="flex gap-3 shrink-0">
            {seasonRecord && (
              <div className="rounded-xl border bg-background/80 backdrop-blur-sm px-4 py-2.5 text-center min-w-[110px]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Season Record</p>
                <p className="text-xl font-bold text-primary">{seasonRecord.toLocaleString()} lbs</p>
              </div>
            )}
            <div className="rounded-xl border bg-background/80 backdrop-blur-sm px-4 py-2.5 text-center min-w-[110px]">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active Anglers</p>
              <p className="text-xl font-bold text-primary">{activeAnglers.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6">
        {/* LEFT: Table */}
        <div className="flex-1 min-w-0">
          {/* Back link */}
          <button onClick={onBack} className="text-sm text-primary hover:underline mb-4 flex items-center gap-1">
            ← Back to Scoreboards
          </button>

          {/* Tabs + Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <Tabs value={sortBy} onValueChange={(v) => { setSortBy(v as "weight" | "count"); setCurrentPage(1); }}>
              <TabsList>
                <TabsTrigger value="weight" className="text-xs px-4">Largest Fish</TabsTrigger>
                <TabsTrigger value="count" className="text-xs px-4">Most Caught</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search anglers..."
                value={searchAngler}
                onChange={(e) => { setSearchAngler(e.target.value); setCurrentPage(1); }}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[50px_1fr_120px_100px_130px] gap-2 px-4 py-2.5 bg-muted/50 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              <span>Rank</span>
              <span>Angler</span>
              <span>Measurement</span>
              <span>Date</span>
              <span>Location</span>
            </div>

            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-3 border-t border-border">
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              ))
            ) : paginated.length === 0 ? (
              <div className="p-12 text-center">
                <Fish className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchAngler ? "No anglers match your search" : "No catches logged for this species yet"}
                </p>
              </div>
            ) : (
              paginated.map((entry, idx) => {
                const profile = profiles[entry.user_id];
                const rank = sortBy === "weight" ? entry.rank_by_weight : entry.rank_by_count;
                const globalIdx = (currentPage - 1) * perPage + idx;
                const catchInfo = entry.largest_catch_id ? catchDetails[entry.largest_catch_id] : null;
                const isTop3 = (rank || 99) <= 3;

                return (
                  <button
                    key={entry.id}
                    onClick={() => navigate(`/app/u/${entry.user_id}`)}
                    className={`w-full grid grid-cols-[50px_1fr_120px_100px_130px] gap-2 px-4 py-3 border-t border-border items-center text-left transition-colors hover:bg-muted/30 ${
                      isTop3 ? "bg-primary/[0.03]" : ""
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center gap-1">
                      <span className={`font-bold text-sm ${
                        rank === 1 ? "text-amber-500" : rank === 2 ? "text-muted-foreground" : rank === 3 ? "text-amber-700" : "text-muted-foreground"
                      }`}>
                        {rank ? String(rank).padStart(2, "0") : "—"}
                      </span>
                      {rank === 1 && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                    </div>

                    {/* Angler */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={profile?.photos?.[0] || ""} />
                        <AvatarFallback className="text-xs bg-muted">
                          {(profile?.display_name || "?")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{profile?.display_name || "Angler"}</p>
                      </div>
                    </div>

                    {/* Measurement */}
                    <div>
                      {sortBy === "weight" ? (
                        entry.largest_weight_lbs ? (
                          <span className="text-sm">
                            <span className="font-bold">{entry.largest_weight_lbs.toLocaleString()}</span>
                            <span className="text-muted-foreground ml-1">lbs</span>
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )
                      ) : (
                        <span className="text-sm">
                          <span className="font-bold">{entry.total_caught.toLocaleString()}</span>
                          <span className="text-muted-foreground ml-1">caught</span>
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(catchInfo?.caught_at || catchInfo?.created_at)}
                    </span>

                    {/* Location */}
                    <div className="flex items-center gap-1 min-w-0">
                      {catchInfo?.general_location ? (
                        <>
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">{catchInfo.general_location}</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer: count + pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, filtered.length)} of {filtered.length} catches
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 rounded-md border flex items-center justify-center text-sm disabled:opacity-40 hover:bg-muted/50 transition-colors"
                  >
                    ‹
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                          page === currentPage
                            ? "bg-primary text-primary-foreground"
                            : "border hover:bg-muted/50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 rounded-md border flex items-center justify-center text-sm disabled:opacity-40 hover:bg-muted/50 transition-colors"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* Species Profile */}
          <div className="rounded-xl border bg-background p-5">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 text-primary" />
              Species Profile
            </h3>

            {speciesDetail?.scientific_name && (
              <div className="mb-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Scientific Name</p>
                <p className="text-sm font-medium italic">{speciesDetail.scientific_name}</p>
              </div>
            )}

            {/* Max weight/length from leaderboard */}
            {entries.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {seasonRecord && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Max Weight</p>
                    <p className="text-sm font-bold">{seasonRecord.toLocaleString()}+ lbs</p>
                  </div>
                )}
                {(() => {
                  const maxLen = Math.max(...entries.map((e) => e.largest_length_in || 0));
                  return maxLen > 0 ? (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Max Length</p>
                      <p className="text-sm font-bold">{maxLen} in</p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {speciesDetail?.description && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 mb-3">
                {speciesDetail.description}
              </p>
            )}
          </div>

          {/* Species Explorer */}
          <div className="rounded-xl overflow-hidden bg-primary text-primary-foreground p-5 text-center">
            <Globe className="h-6 w-6 mx-auto mb-2 opacity-80" />
            <h3 className="font-bold text-sm mb-1">Species Explorer</h3>
            <p className="text-xs opacity-80 mb-3">
              Discover the best fishing spots globally with our interactive heatmaps and seasonal charts.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => navigate("/app/spots")}
            >
              Launch Global Map
            </Button>
          </div>

          {/* Recent Logs */}
          {recentLogs.length > 0 && (
            <div className="rounded-xl border bg-background p-5">
              <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
                Recent Logs
              </h3>
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">
                        <span className="font-medium text-primary">{log.display_name}</span>
                        {" caught "}
                        {log.weight_lbs ? `${log.weight_lbs}lb` : log.length_in ? `${log.length_in}in` : "a fish"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
