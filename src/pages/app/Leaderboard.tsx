import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Search,
  Fish,
  Scale,
  Hash,
  ChevronRight,
  MapPin,
  Calendar,
  Medal,
  Crown,
  Award,
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
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"weight" | "count">("weight");

  // Fetch all species that have leaderboard entries
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

  // Fetch leaderboard entries for selected species
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["leaderboard-entries", selectedSpeciesId, sortBy],
    queryFn: async () => {
      if (!selectedSpeciesId) return [];
      const { data } = await supabase
        .from("leaderboard_entries")
        .select("*")
        .eq("species_id", selectedSpeciesId)
        .order(sortBy === "weight" ? "rank_by_weight" : "rank_by_count", { ascending: true })
        .limit(50);
      return (data || []) as LeaderboardEntry[];
    },
    enabled: !!selectedSpeciesId,
  });

  // Fetch profiles for leaderboard users
  const userIds = leaderboardData?.map((e) => e.user_id) || [];
  const { data: profiles = {} } = useQuery({
    queryKey: ["leaderboard-profiles", userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, photos")
        .in("id", userIds);
      const map: Record<string, ProfileInfo> = {};
      (data || []).forEach((p) => { map[p.id] = p as ProfileInfo; });
      return map;
    },
    enabled: userIds.length > 0,
  });

  // Fetch top 3 per species for overview (when no species selected)
  const { data: topEntries = [], isLoading: topLoading } = useQuery({
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
    enabled: !selectedSpeciesId,
  });

  const topProfiles = useQuery({
    queryKey: ["leaderboard-top-profiles", topEntries.map(e => e.user_id).join(",")],
    queryFn: async () => {
      const ids = topEntries.map(e => e.user_id);
      if (ids.length === 0) return {};
      const { data } = await supabase.from("profiles").select("id, display_name, photos").in("id", ids);
      const map: Record<string, ProfileInfo> = {};
      (data || []).forEach((p) => { map[p.id] = p as ProfileInfo; });
      return map;
    },
    enabled: topEntries.length > 0,
  });

  const filteredSpecies = speciesList.filter(
    (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{rank}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-7 w-7 text-yellow-500" />
          <h1 className="text-2xl font-bold">Leaderboard</h1>
        </div>
        <p className="text-muted-foreground">
          See who's catching the biggest fish and the most of each species
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search species..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {selectedSpeciesId ? (
        // Species-specific leaderboard
        <SpeciesLeaderboard
          speciesId={selectedSpeciesId}
          speciesName={speciesList.find(s => s.id === selectedSpeciesId)?.name || ""}
          sortBy={sortBy}
          setSortBy={setSortBy}
          entries={leaderboardData || []}
          profiles={profiles}
          loading={leaderboardLoading}
          onBack={() => setSelectedSpeciesId(null)}
          navigate={navigate}
        />
      ) : (
        // Species overview grid
        <div className="space-y-4">
          {speciesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          ) : filteredSpecies.length === 0 ? (
            <div className="text-center py-16">
              <Fish className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No species found</p>
            </div>
          ) : (
            filteredSpecies.map((sp) => {
              const topEntry = topEntries.find(e => e.species_id === sp.id);
              const topProfile = topEntry ? topProfiles.data?.[topEntry.user_id] : null;

              return (
                <button
                  key={sp.id}
                  onClick={() => setSelectedSpeciesId(sp.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border bg-background hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {sp.image_url ? (
                      <img src={sp.image_url} alt={sp.name} className="w-full h-full object-cover" />
                    ) : (
                      <Fish className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{sp.name}</h3>
                    {topEntry && topProfile ? (
                      <p className="text-sm text-muted-foreground truncate">
                        👑 {topProfile.display_name || "Angler"} — {topEntry.largest_weight_lbs ? `${topEntry.largest_weight_lbs} lbs` : `${topEntry.total_caught} caught`}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No entries yet</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// Species-specific leaderboard component
interface SpeciesLeaderboardProps {
  speciesId: string;
  speciesName: string;
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
  sortBy,
  setSortBy,
  entries,
  profiles,
  loading,
  onBack,
  navigate,
}: SpeciesLeaderboardProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{rank}</span>;
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
      >
        ← All Species
      </button>

      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        {speciesName}
      </h2>

      <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as "weight" | "count")} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="weight" className="flex-1">
            <Scale className="h-4 w-4 mr-2" />
            Largest Catch
          </TabsTrigger>
          <TabsTrigger value="count" className="flex-1">
            <Hash className="h-4 w-4 mr-2" />
            Most Caught
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg mb-2" />
        ))
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <Fish className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No catches logged for this species yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const profile = profiles[entry.user_id];
            const rank = sortBy === "weight" ? entry.rank_by_weight : entry.rank_by_count;

            return (
              <button
                key={entry.id}
                onClick={() => navigate(`/app/u/${entry.user_id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-8 flex items-center justify-center">
                  {getRankIcon(rank || 99)}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.photos?.[0] || ""} />
                  <AvatarFallback>{(profile?.display_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{profile?.display_name || "Angler"}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {entry.largest_weight_lbs && (
                      <span className="flex items-center gap-1">
                        <Scale className="h-3 w-3" />
                        {entry.largest_weight_lbs} lbs
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Fish className="h-3 w-3" />
                      {entry.total_caught} caught
                    </span>
                    <span className="text-emerald-600">{entry.total_released} released</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {sortBy === "weight" && entry.largest_weight_lbs && (
                    <p className="font-bold text-primary">{entry.largest_weight_lbs} lbs</p>
                  )}
                  {sortBy === "count" && (
                    <p className="font-bold text-primary">{entry.total_caught}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
