import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Fish,
  Search,
  Crown,
  MapPin,
  Sparkles,
  Globe,
  Info,
  Star,
  ArrowRight,
  PlusCircle,
} from "lucide-react";

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

export default function SpeciesLeaderboardPage() {
  const { speciesId } = useParams<{ speciesId: string }>();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"weight" | "count">("weight");
  const [searchAngler, setSearchAngler] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Fetch species info
  const { data: species, isLoading: speciesLoading } = useQuery({
    queryKey: ["species-detail", speciesId],
    queryFn: async () => {
      const { data } = await supabase
        .from("fish_species")
        .select("*")
        .eq("id", speciesId!)
        .maybeSingle();
      return data;
    },
    enabled: !!speciesId,
  });

  // Fetch leaderboard entries
  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["species-leaderboard-entries", speciesId, sortBy],
    queryFn: async () => {
      const { data } = await supabase
        .from("leaderboard_entries")
        .select("*")
        .eq("species_id", speciesId!)
        .order(sortBy === "weight" ? "rank_by_weight" : "rank_by_count", { ascending: true })
        .limit(100);
      return (data || []) as LeaderboardEntry[];
    },
    enabled: !!speciesId,
  });

  // Fetch profiles for entries
  const userIds = entries.map((e) => e.user_id);
  const { data: profiles = {} } = useQuery({
    queryKey: ["species-lb-profiles", userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos")
        .in("id", userIds);
      const map: Record<string, ProfileInfo> = {};
      (data || []).forEach((p) => { map[p.id] = p as ProfileInfo; });
      return map;
    },
    enabled: userIds.length > 0,
  });

  // Fetch catch details (date, location)
  const catchIds = entries.map((e) => e.largest_catch_id).filter(Boolean) as string[];
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

  // Recent logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["species-recent-logs", speciesId],
    queryFn: async () => {
      const { data } = await supabase
        .from("catches")
        .select("id, weight_lbs, length_in, created_at, user_id, species_name")
        .eq("species_id", speciesId!)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!data || data.length === 0) return [];
      const uids = [...new Set(data.map((c) => c.user_id))];
      const { data: profs } = await supabase.from("profiles_safe").select("id, display_name").in("id", uids);
      const profMap: Record<string, string> = {};
      (profs || []).forEach((p) => { profMap[p.id] = p.display_name || "Angler"; });
      return data.map((c) => ({ ...c, display_name: profMap[c.user_id] || "Angler" }));
    },
    enabled: !!speciesId,
  });

  const seasonRecord = useMemo(() => {
    if (entries.length === 0) return null;
    const maxWeight = Math.max(...entries.map((e) => e.largest_weight_lbs || 0));
    return maxWeight > 0 ? maxWeight : null;
  }, [entries]);

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

  const loading = speciesLoading || entriesLoading;

  return (
    <div className="scoreboard-hub min-h-screen pb-24">
      {/* Hero Banner */}
      <div className="relative overflow-hidden mb-6 mx-4 md:mx-6 mt-4 sb-card">
        <div className="h-56 md:h-72 bg-[hsl(var(--sb-surface-2))] relative">
          {species?.image_url ? (
            <img src={species.image_url} alt={species.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--sb-cyan)/0.2)] to-[hsl(var(--sb-surface))] flex items-center justify-center">
              <Fish className="h-20 w-20 sb-text-muted opacity-30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sb-bg))] via-[hsl(var(--sb-bg)/0.7)] to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold sb-cyan uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Star className="h-3.5 w-3.5 fill-[hsl(var(--sb-cyan))]" />
              Species Spotlight
            </p>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{species?.name || "Loading..."}</h1>
            {species?.description && (
              <p className="text-sm sb-text-muted mt-2 max-w-lg line-clamp-2">
                {species.description}
              </p>
            )}
          </div>
          <div className="flex gap-3 shrink-0">
            {seasonRecord && (
              <div className="sb-card-soft backdrop-blur-sm px-4 py-2.5 text-center min-w-[120px] bg-[hsl(var(--sb-surface)/0.85)]">
                <p className="text-[10px] sb-text-muted uppercase tracking-widest">Season Record</p>
                <p className="text-xl font-bold sb-cyan">{seasonRecord.toLocaleString()} lbs</p>
              </div>
            )}
            <div className="sb-card-soft backdrop-blur-sm px-4 py-2.5 text-center min-w-[120px] bg-[hsl(var(--sb-surface)/0.85)]">
              <p className="text-[10px] sb-text-muted uppercase tracking-widest">Active Anglers</p>
              <p className="text-xl font-bold sb-cyan">{entries.length.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6">
        {/* LEFT: Table */}
        <div className="flex-1 min-w-0">
          <button onClick={() => navigate("/app/leaderboard")} className="text-sm sb-cyan hover:underline mb-4 flex items-center gap-1 font-medium">
            ← Back to Scoreboards
          </button>

          {/* Tabs + Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="grid grid-cols-2 sb-card-soft p-0.5 gap-0.5">
              {[
                { key: "weight", label: "Largest Fish" },
                { key: "count", label: "Most Caught" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setSortBy(key as "weight" | "count"); setCurrentPage(1); }}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    sortBy === key ? "sb-bg-cyan font-semibold" : "sb-text-muted hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sb-text-muted z-10" />
              <Input
                placeholder="Search anglers..."
                value={searchAngler}
                onChange={(e) => { setSearchAngler(e.target.value); setCurrentPage(1); }}
                className="pl-9 h-9 text-sm sb-input"
              />
            </div>
          </div>

          {/* Table */}
          <div className="sb-card overflow-hidden">
            <div className="grid grid-cols-[60px_1fr_120px_100px_140px] gap-2 px-4 py-2.5 bg-[hsl(var(--sb-surface-2))] text-[10px] sb-text-muted uppercase tracking-widest font-semibold">
              <span>Rank</span>
              <span>Angler</span>
              <span>Measurement</span>
              <span>Date</span>
              <span>Location</span>
            </div>

            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-4 py-3 border-t sb-border">
                  <Skeleton className="h-12 w-full rounded-lg bg-[hsl(var(--sb-surface-2))]" />
                </div>
              ))
            ) : paginated.length === 0 ? (
              <div className="p-12 text-center">
                <Fish className="h-10 w-10 mx-auto sb-text-muted mb-2" />
                <p className="text-sm sb-text-muted">
                  {searchAngler ? "No anglers match your search" : "No catches logged for this species yet"}
                </p>
              </div>
            ) : (
              paginated.map((entry) => {
                const profile = profiles[entry.user_id];
                const rank = sortBy === "weight" ? entry.rank_by_weight : entry.rank_by_count;
                const catchInfo = entry.largest_catch_id ? catchDetails[entry.largest_catch_id] : null;
                const isTop3 = (rank || 99) <= 3;

                return (
                  <button
                    key={entry.id}
                    onClick={() =>
                      entry.largest_catch_id
                        ? navigate(`/app/catches/${entry.largest_catch_id}`)
                        : navigate(`/app/u/${entry.user_id}`)
                    }
                    className={`w-full grid grid-cols-[60px_1fr_120px_100px_140px] gap-2 px-4 py-3 border-t sb-border items-center text-left transition-colors hover:bg-[hsl(var(--sb-surface-2))] ${
                      isTop3 ? "bg-[hsl(var(--sb-cyan)/0.04)]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-base ${
                        rank === 1 ? "sb-gold" : rank === 2 ? "text-slate-300" : rank === 3 ? "text-amber-700" : "sb-text-muted"
                      }`}>
                        {rank ? String(rank).padStart(2, "0") : "—"}
                      </span>
                      {rank === 1 && <Crown className="h-3.5 w-3.5 sb-gold fill-[hsl(var(--sb-gold))]" />}
                    </div>

                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0 ring-2 ring-[hsl(var(--sb-border))]">
                        <AvatarImage src={profile?.photos?.[0] || ""} />
                        <AvatarFallback className="text-xs bg-[hsl(var(--sb-surface-2))]">
                          {(profile?.display_name || "?")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{profile?.display_name || "Angler"}</p>
                        {isTop3 && (
                          <p className="text-[9px] sb-cyan uppercase tracking-widest font-bold">
                            {rank === 1 ? "Pro Team" : "Amateur"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      {sortBy === "weight" ? (
                        entry.largest_weight_lbs ? (
                          <span className="text-sm">
                            <span className="font-bold sb-cyan">{entry.largest_weight_lbs.toLocaleString()}</span>
                            <span className="sb-text-muted ml-1">lbs</span>
                          </span>
                        ) : (
                          <span className="text-sm sb-text-muted">—</span>
                        )
                      ) : (
                        <span className="text-sm">
                          <span className="font-bold sb-cyan">{entry.total_caught.toLocaleString()}</span>
                          <span className="sb-text-muted ml-1">caught</span>
                        </span>
                      )}
                    </div>

                    <span className="text-xs sb-text-muted">
                      {formatDate(catchInfo?.caught_at || catchInfo?.created_at)}
                    </span>

                    <div className="flex items-center gap-1 min-w-0">
                      {catchInfo?.general_location ? (
                        <>
                          <MapPin className="h-3 w-3 sb-cyan shrink-0" />
                          <span className="text-xs sb-text-muted truncate">{catchInfo.general_location}</span>
                        </>
                      ) : (
                        <span className="text-xs sb-text-muted">—</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs sb-text-muted">
                Showing {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, filtered.length)} of {filtered.length} catches
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 rounded-md sb-card-soft flex items-center justify-center text-sm disabled:opacity-40 hover:bg-[hsl(var(--sb-surface-2))] transition-colors"
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
                            ? "sb-bg-cyan font-semibold"
                            : "sb-card-soft sb-text-muted hover:text-white"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 rounded-md sb-card-soft flex items-center justify-center text-sm disabled:opacity-40 hover:bg-[hsl(var(--sb-surface-2))] transition-colors"
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
          <div className="sb-card p-5">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
              <Info className="h-4 w-4 sb-cyan" />
              Species Profile
            </h3>

            {species?.scientific_name && (
              <div className="mb-4">
                <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">Scientific Name</p>
                <p className="text-sm font-medium italic mt-0.5">{species.scientific_name}</p>
              </div>
            )}

            {entries.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b sb-border">
                {seasonRecord && (
                  <div>
                    <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">Max Weight</p>
                    <p className="text-base font-bold sb-cyan mt-0.5">{seasonRecord.toLocaleString()}+ lbs</p>
                  </div>
                )}
                {(() => {
                  const maxLen = Math.max(...entries.map((e) => e.largest_length_in || 0));
                  return maxLen > 0 ? (
                    <div>
                      <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">Max Length</p>
                      <p className="text-base font-bold sb-cyan mt-0.5">{maxLen} in</p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {species?.description && (
              <p className="text-xs sb-text-muted leading-relaxed line-clamp-5 mb-3">
                {species.description}
              </p>
            )}

            <button onClick={() => navigate("/app/species")} className="text-[11px] sb-cyan font-bold uppercase tracking-widest hover:underline inline-flex items-center gap-1">
              Learn More <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Species Explorer */}
          <div className="sb-card p-5 text-center bg-gradient-to-br from-[hsl(var(--sb-surface))] to-[hsl(var(--sb-cyan)/0.12)]">
            <Globe className="h-6 w-6 sb-cyan mx-auto mb-2" />
            <h3 className="font-bold text-sm mb-1">Species Explorer</h3>
            <p className="text-xs sb-text-muted mb-3">
              Discover the best fishing spots globally with our interactive heatmaps and seasonal charts.
            </p>
            <button
              onClick={() => navigate("/app/spots")}
              className="w-full sb-bg-cyan text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Launch Global Map
            </button>
          </div>

          {/* Recent Logs */}
          {recentLogs.length > 0 && (
            <div className="sb-card p-5">
              <h3 className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold mb-3">
                Recent Logs
              </h3>
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3">
                    <PlusCircle className="h-4 w-4 sb-cyan shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">
                        <span className="font-semibold sb-cyan">{log.display_name}</span>
                        {" caught "}
                        <span className="font-semibold">{log.weight_lbs ? `${log.weight_lbs}lb` : log.length_in ? `${log.length_in}in` : "a fish"}</span>
                      </p>
                      <p className="text-[10px] sb-text-muted">{timeAgo(log.created_at)}</p>
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
