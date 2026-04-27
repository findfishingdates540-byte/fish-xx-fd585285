import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Fish,
  Plus,
  ChevronDown,
  Flame,
  TrendingUp,
  Users,
  Trophy,
  Target,
} from "lucide-react";

type FilterTab = "all" | "freshwater" | "saltwater" | "big_game" | "panfish" | "trending";
type SortOption = "popularity" | "name" | "record";

const FILTER_TABS: { value: FilterTab; label: string; icon?: React.ReactNode }[] = [
  { value: "all", label: "All Species" },
  { value: "freshwater", label: "Freshwater" },
  { value: "saltwater", label: "Saltwater" },
  { value: "big_game", label: "Big Game" },
  { value: "panfish", label: "Panfish" },
  { value: "trending", label: "Trending", icon: <Flame className="h-3.5 w-3.5" /> },
];

// Species category mapping for filters
const FRESHWATER_KEYWORDS = ["bass", "trout", "catfish", "crappie", "walleye", "pike", "perch", "bluegill", "sunfish", "carp", "muskie", "gar", "bowfin", "sturgeon", "salmon"];
const SALTWATER_KEYWORDS = ["tuna", "mahi", "marlin", "grouper", "snapper", "barracuda", "tarpon", "shark", "sailfish", "swordfish", "wahoo", "cobia", "amberjack", "kingfish", "permit", "bonefish", "redfish", "flounder", "halibut", "cod", "snook", "sea bass", "striped bass"];
const BIG_GAME_KEYWORDS = ["tuna", "marlin", "sailfish", "swordfish", "shark", "tarpon", "mahi", "wahoo", "barracuda", "grouper"];
const PANFISH_KEYWORDS = ["bluegill", "crappie", "sunfish", "perch", "pumpkinseed", "rock bass", "warmouth"];

function categorizeSpecies(name: string): string[] {
  const lower = name.toLowerCase();
  const cats: string[] = [];
  if (FRESHWATER_KEYWORDS.some((k) => lower.includes(k))) cats.push("freshwater");
  if (SALTWATER_KEYWORDS.some((k) => lower.includes(k))) cats.push("saltwater");
  if (BIG_GAME_KEYWORDS.some((k) => lower.includes(k))) cats.push("big_game");
  if (PANFISH_KEYWORDS.some((k) => lower.includes(k))) cats.push("panfish");
  return cats;
}

interface SpeciesCardData {
  id: string;
  name: string;
  scientific_name: string | null;
  image_url: string | null;
  categories: string[];
  totalLogs: number;
  worldRecord: number | null;
  recordHolder: { name: string; avatar: string | null } | null;
  isTrending: boolean;
}

export default function SpeciesExplorer() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  const [showAll, setShowAll] = useState(false);

  // Fetch all species
  const { data: species = [], isLoading: speciesLoading } = useQuery({
    queryKey: ["species-explorer-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fish_species")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch leaderboard stats per species
  const { data: leaderboardStats = {} } = useQuery({
    queryKey: ["species-explorer-lb-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leaderboard_entries")
        .select("species_id, user_id, total_caught, largest_weight_lbs");
      if (!data) return {};
      const map: Record<string, { totalLogs: number; worldRecord: number | null; topUserId: string | null }> = {};
      for (const e of data) {
        if (!e.species_id) continue;
        if (!map[e.species_id]) {
          map[e.species_id] = { totalLogs: 0, worldRecord: null, topUserId: null };
        }
        map[e.species_id].totalLogs += e.total_caught;
        if (e.largest_weight_lbs && (!map[e.species_id].worldRecord || e.largest_weight_lbs > map[e.species_id].worldRecord!)) {
          map[e.species_id].worldRecord = e.largest_weight_lbs;
          map[e.species_id].topUserId = e.user_id;
        }
      }
      return map;
    },
  });

  // Fetch catch counts per species for trending
  const { data: recentCatchCounts = {} } = useQuery({
    queryKey: ["species-explorer-recent-catches"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("catches")
        .select("species_id")
        .gte("created_at", thirtyDaysAgo);
      if (!data) return {};
      const map: Record<string, number> = {};
      for (const c of data) {
        if (c.species_id) map[c.species_id] = (map[c.species_id] || 0) + 1;
      }
      return map;
    },
  });

  // Collect record holder user IDs
  const recordHolderIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(leaderboardStats).forEach((s) => {
      if (s.topUserId) ids.add(s.topUserId);
    });
    return [...ids];
  }, [leaderboardStats]);

  const { data: recordProfiles = {} } = useQuery({
    queryKey: ["species-explorer-record-profiles", recordHolderIds.join(",")],
    queryFn: async () => {
      if (recordHolderIds.length === 0) return {};
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, photos")
        .in("id", recordHolderIds);
      const map: Record<string, { name: string; avatar: string | null }> = {};
      (data || []).forEach((p) => {
        map[p.id] = { name: p.display_name || "Angler", avatar: p.photos?.[0] || null };
      });
      return map;
    },
    enabled: recordHolderIds.length > 0,
  });

  // Build card data
  const cardsData: SpeciesCardData[] = useMemo(() => {
    const trendingThreshold = 3;
    return species.map((sp) => {
      const stats = leaderboardStats[sp.id];
      const recentCount = recentCatchCounts[sp.id] || 0;
      const topUserId = stats?.topUserId;
      return {
        id: sp.id,
        name: sp.name,
        scientific_name: sp.scientific_name,
        image_url: sp.image_url,
        categories: categorizeSpecies(sp.name),
        totalLogs: stats?.totalLogs || 0,
        worldRecord: stats?.worldRecord || null,
        recordHolder: topUserId && recordProfiles[topUserId] ? recordProfiles[topUserId] : null,
        isTrending: recentCount >= trendingThreshold,
      };
    });
  }, [species, leaderboardStats, recentCatchCounts, recordProfiles]);

  // Filter & sort
  const filtered = useMemo(() => {
    let list = cardsData;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.scientific_name?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (activeFilter !== "all") {
      if (activeFilter === "trending") {
        list = list.filter((s) => s.isTrending);
      } else {
        list = list.filter((s) => s.categories.includes(activeFilter));
      }
    }

    // Sort
    if (sortBy === "popularity") {
      list = [...list].sort((a, b) => b.totalLogs - a.totalLogs);
    } else if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "record") {
      list = [...list].sort((a, b) => (b.worldRecord || 0) - (a.worldRecord || 0));
    }

    return list;
  }, [cardsData, searchQuery, activeFilter, sortBy]);

  const displayedCards = showAll ? filtered : filtered.slice(0, 6);
  const remainingCount = filtered.length - 6;

  // Global stats
  const globalStats = useMemo(() => {
    const totalSpecies = species.length;
    const totalLogs = Object.values(leaderboardStats).reduce((sum, s) => sum + s.totalLogs, 0);
    const activeAnglers = new Set(Object.values(leaderboardStats).map((s) => s.topUserId).filter(Boolean)).size;
    const newRecords = Object.values(recentCatchCounts).filter((c) => c > 0).length;
    return { totalSpecies, totalLogs, activeAnglers, newRecords };
  }, [species, leaderboardStats, recentCatchCounts]);

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
    return n.toLocaleString();
  };

  const categoryBadgeColor = (cat: string) => {
    switch (cat) {
      case "freshwater": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "saltwater": return "bg-[hsl(var(--sb-cyan)/0.2)] text-[hsl(var(--sb-cyan))] border-[hsl(var(--sb-cyan)/0.4)]";
      case "big_game": return "bg-[hsl(var(--sb-gold)/0.2)] text-[hsl(var(--sb-gold))] border-[hsl(var(--sb-gold)/0.4)]";
      case "panfish": return "bg-violet-500/20 text-violet-300 border-violet-500/40";
      default: return "bg-[hsl(var(--sb-surface-2))] sb-text-muted";
    }
  };

  return (
    <div className="scoreboard-hub pb-24 min-h-screen">
      {/* Hero Section */}
      <div className="text-center pt-10 pb-6 px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
          Discover Your Next Challenge
        </h1>
        <p className="text-sm sb-text-muted max-w-xl mx-auto leading-relaxed">
          Search through {species.length > 0 ? `over ${formatNumber(species.length)}` : ""} freshwater and saltwater species.
          Track records, view hot spots, and log your championship catches.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 max-w-xl mx-auto px-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sb-text-muted z-10" />
          <Input
            placeholder="Search species (e.g. Largemouth Bass, Yellowfin Tuna...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 sb-input"
          />
        </div>
        <button className="h-11 px-6 sb-bg-cyan font-bold text-sm uppercase tracking-wider rounded-md hover:opacity-90 transition-opacity">
          Search
        </button>
      </div>

      {/* Filter Tabs + Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 mb-6">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveFilter(tab.value); setShowAll(false); }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors border ${
                activeFilter === tab.value
                  ? "sb-bg-cyan border-[hsl(var(--sb-cyan))]"
                  : "bg-[hsl(var(--sb-surface))] sb-text-muted border-[hsl(var(--sb-border))] hover:text-white hover:border-[hsl(var(--sb-cyan)/0.5)]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[200px] h-9 text-xs sb-input">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Sort by: Popularity</SelectItem>
            <SelectItem value="name">Sort by: Name</SelectItem>
            <SelectItem value="record">Sort by: Record</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Species Cards Grid */}
      <div className="px-4 md:px-6">
        {speciesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[340px] rounded-xl bg-[hsl(var(--sb-surface-2))]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Fish className="h-12 w-12 mx-auto sb-text-muted opacity-40 mb-3" />
            <p className="sb-text-muted">No species found matching your search.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => navigate(`/app/leaderboard/species/${card.id}`)}
                  className="group sb-card overflow-hidden text-left transition-all hover:shadow-lg hover:border-[hsl(var(--sb-cyan))] hover:-translate-y-0.5"
                >
                  {/* Image */}
                  <div className="relative h-44 bg-[hsl(var(--sb-surface-2))] overflow-hidden">
                    {card.image_url ? (
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(var(--sb-surface-2))] to-[hsl(var(--sb-surface))]">
                        <Fish className="h-16 w-16 sb-text-muted opacity-20" />
                      </div>
                    )}
                    {/* Category badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {card.categories.slice(0, 2).map((cat) => (
                        <span
                          key={cat}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border backdrop-blur-sm ${categoryBadgeColor(cat)}`}
                        >
                          {cat.replace("_", " ")}
                        </span>
                      ))}
                      {card.isTrending && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border bg-rose-500/20 text-rose-300 border-rose-500/40 backdrop-blur-sm">
                          <Flame className="h-3 w-3" /> Trending
                        </span>
                      )}
                    </div>
                    {/* Gradient overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[hsl(var(--sb-surface))] to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-bold text-base uppercase tracking-wide text-white">
                        {card.name}
                      </h3>
                      {card.scientific_name && (
                        <p className="text-[11px] sb-text-muted italic">
                          {card.scientific_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="rounded-lg bg-[hsl(var(--sb-surface-2))] border sb-border px-3 py-2">
                        <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">
                          Global Logs
                        </p>
                        <p className="text-sm font-bold sb-cyan">
                          {formatNumber(card.totalLogs)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-[hsl(var(--sb-surface-2))] border sb-border px-3 py-2">
                        <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">
                          World Record
                        </p>
                        <p className="text-sm font-bold sb-cyan">
                          {card.worldRecord ? `${card.worldRecord.toLocaleString()} lbs` : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Record Holder */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-8 w-8 ring-2 ring-[hsl(var(--sb-border))]">
                          <AvatarImage src={card.recordHolder?.avatar || ""} />
                          <AvatarFallback className="text-[10px] bg-[hsl(var(--sb-surface-2))]">
                            {card.recordHolder ? card.recordHolder.name[0] : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[10px] sb-text-muted uppercase tracking-wider">Record Holder</p>
                          <p className="text-xs font-semibold truncate">
                            {card.recordHolder?.name || "No record yet"}
                          </p>
                        </div>
                      </div>
                      <div className="h-9 w-9 rounded-full sb-bg-cyan flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* View More Button */}
            {!showAll && remainingCount > 0 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowAll(true)}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-lg sb-card hover:border-[hsl(var(--sb-cyan))] sb-cyan font-semibold text-sm transition-colors"
                >
                  View {remainingCount} More Species
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cross-links */}
      <div className="mt-10 px-4 md:px-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={() => navigate("/app/challenges")} className="sb-card p-5 text-left hover:border-[hsl(var(--sb-cyan))] transition-colors flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0"><Target className="h-5 w-5 text-rose-400" /></div>
          <div><p className="font-bold text-sm">Fishing Challenges</p><p className="text-xs sb-text-muted">Compete for prizes with these species</p></div>
        </button>
        <button onClick={() => navigate("/app/leaderboard")} className="sb-card p-5 text-left hover:border-[hsl(var(--sb-cyan))] transition-colors flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[hsl(var(--sb-gold)/0.15)] flex items-center justify-center shrink-0"><Trophy className="h-5 w-5 sb-gold" /></div>
          <div><p className="font-bold text-sm">Scoreboards Hub</p><p className="text-xs sb-text-muted">View overall rankings & team standings</p></div>
        </button>
      </div>

      {/* Bottom Stats Bar */}
      <div className="mt-10 border-t sb-border pt-10 pb-6 px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto text-center">
          {[
            { value: formatNumber(globalStats.totalSpecies), label: "Tracked Species" },
            { value: formatNumber(globalStats.totalLogs), label: "Logged Catches" },
            { value: formatNumber(globalStats.activeAnglers), label: "Active Anglers" },
            { value: String(globalStats.newRecords), label: "New Records Today" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-bold sb-cyan tracking-tight">{s.value}</p>
              <p className="text-[11px] sb-text-muted uppercase tracking-widest font-semibold mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
