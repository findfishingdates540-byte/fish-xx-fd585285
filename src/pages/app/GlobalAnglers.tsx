import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Trophy, Medal, Fish, Scale, Crown, X } from "lucide-react";

interface AnglerRow {
  user_id: string;
  total_caught: number;
  total_released: number;
  species_count: number;
  largest_weight_lbs: number | null;
  points: number;
}

interface ProfileInfo {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  location_name: string | null;
  id_verified: boolean | null;
  live_verified: boolean | null;
}

const PAGE_SIZE = 50;

const GlobalAnglers = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"points" | "catches" | "biggest" | "species">("points");
  const [speciesId, setSpeciesId] = useState<string | "all">("all");
  const [speciesQuery, setSpeciesQuery] = useState("");

  // Load species list for the filter
  const { data: speciesList = [] } = useQuery({
    queryKey: ["global-anglers-species-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fish_species")
        .select("id, name, image_url")
        .order("name", { ascending: true })
        .limit(1000);
      return (data || []) as { id: string; name: string; image_url: string | null }[];
    },
  });
  const selectedSpecies = useMemo(
    () => speciesList.find((s) => s.id === speciesId) || null,
    [speciesList, speciesId],
  );

  // Aggregate every angler from leaderboard_entries (one row per user/species).
  const { data: anglers = [], isLoading } = useQuery({
    queryKey: ["global-anglers-full", speciesId],
    queryFn: async () => {
      let q = supabase
        .from("leaderboard_entries")
        .select("user_id, species_id, total_caught, total_released, largest_weight_lbs")
        .limit(5000);
      if (speciesId !== "all") q = q.eq("species_id", speciesId);
      const { data, error } = await q;
      if (error) throw error;
      const map = new Map<string, AnglerRow>();
      (data || []).forEach((e: any) => {
        const cur = map.get(e.user_id) || {
          user_id: e.user_id,
          total_caught: 0,
          total_released: 0,
          species_count: 0,
          largest_weight_lbs: null,
          points: 0,
        };
        cur.total_caught += e.total_caught || 0;
        cur.total_released += e.total_released || 0;
        cur.species_count += e.species_id ? 1 : 0;
        if (e.largest_weight_lbs != null && (cur.largest_weight_lbs == null || e.largest_weight_lbs > cur.largest_weight_lbs)) {
          cur.largest_weight_lbs = e.largest_weight_lbs;
        }
        map.set(e.user_id, cur);
      });
      const rows = Array.from(map.values());
      // Layer in real points from verified catches
      const userIds = rows.map((r) => r.user_id);
      if (userIds.length > 0) {
        let sq = supabase
          .from("catches")
          .select("user_id, computed_score, species_id")
          .in("user_id", userIds)
          .not("computed_score", "is", null)
          .limit(5000);
        if (speciesId !== "all") sq = sq.eq("species_id", speciesId);
        const { data: scored } = await sq;
        const pts = new Map<string, number>();
        (scored || []).forEach((c: any) => {
          pts.set(c.user_id, (pts.get(c.user_id) || 0) + (Number(c.computed_score) || 0));
        });
        rows.forEach((r) => { r.points = pts.get(r.user_id) || 0; });
      }
      return rows;
    },
  });

  const ids = useMemo(() => anglers.map((a) => a.user_id), [anglers]);

  const { data: profiles = {} } = useQuery({
    queryKey: ["global-anglers-profiles", ids.length],
    queryFn: async () => {
      if (ids.length === 0) return {};
      const map: Record<string, ProfileInfo> = {};
      // chunk in 500s to respect URL/row caps
      for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        const { data } = await supabase
          .from("profiles_safe")
          .select("id, display_name, photos, location_name, id_verified, live_verified")
          .in("id", chunk);
        (data || []).forEach((p: any) => { map[p.id] = p; });
      }
      return map;
    },
    enabled: ids.length > 0,
  });

  const ranked = useMemo(() => {
    const enriched = anglers.map((a) => ({
      ...a,
      points: Number(a.points || 0),
      profile: profiles[a.user_id],
    }));
    const filtered = search
      ? enriched.filter((a) =>
          (a.profile?.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (a.profile?.location_name || "").toLowerCase().includes(search.toLowerCase()),
        )
      : enriched;
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "catches": return b.total_caught - a.total_caught;
        case "biggest": return (b.largest_weight_lbs || 0) - (a.largest_weight_lbs || 0);
        case "species": return b.species_count - a.species_count;
        default: return b.points - a.points;
      }
    });
    return sorted.slice(0, PAGE_SIZE * 4);
  }, [anglers, profiles, search, sort]);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="scoreboard-hub min-h-screen -mx-4 md:-mx-0 pb-24">
      <div className="sticky top-0 z-10 backdrop-blur bg-[hsl(var(--sb-surface)/0.85)] border-b sb-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back" className="hover:bg-[hsl(var(--sb-surface-2))]">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-bold flex items-center gap-2">
              <Trophy className="h-4 w-4 sb-cyan" />
              Global Angler Rankings
            </h1>
            <p className="text-[11px] sb-text-muted">All-time leaderboard across every species</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Species filter */}
        <div className="sb-card p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider sb-text-muted flex items-center gap-1.5">
              <Fish className="h-3.5 w-3.5 sb-cyan" />
              Filter by species
            </p>
            {selectedSpecies && (
              <button
                onClick={() => { setSpeciesId("all"); setSpeciesQuery(""); }}
                className="inline-flex items-center gap-1 text-[11px] sb-text-muted hover:text-foreground"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          {selectedSpecies ? (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--sb-surface-2))]">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[hsl(var(--sb-surface))] flex items-center justify-center shrink-0">
                {selectedSpecies.image_url ? (
                  <img src={selectedSpecies.image_url} alt={selectedSpecies.name} className="w-full h-full object-cover" />
                ) : (
                  <Fish className="h-4 w-4 sb-text-muted" />
                )}
              </div>
              <p className="text-sm font-semibold flex-1 truncate">{selectedSpecies.name}</p>
              <Badge className="sb-bg-cyan border-0 text-[hsl(var(--sb-surface))] text-[10px]">Active</Badge>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sb-text-muted" />
                <Input
                  value={speciesQuery}
                  onChange={(e) => setSpeciesQuery(e.target.value)}
                  placeholder="Search species…"
                  className="pl-9 h-9 text-sm sb-card border-0 bg-[hsl(var(--sb-surface-2))] focus-visible:ring-[hsl(var(--sb-cyan))]"
                />
              </div>
              {speciesQuery && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {speciesList
                    .filter((s) => s.name.toLowerCase().includes(speciesQuery.toLowerCase()))
                    .slice(0, 12)
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setSpeciesId(s.id); setSpeciesQuery(""); }}
                        className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-[hsl(var(--sb-surface-2))] text-left"
                      >
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-[hsl(var(--sb-surface-2))] flex items-center justify-center shrink-0">
                          {s.image_url ? (
                            <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                          ) : (
                            <Fish className="h-3 w-3 sb-text-muted" />
                          )}
                        </div>
                        <span className="text-xs">{s.name}</span>
                      </button>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sb-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search anglers or locations…"
              className="pl-9 sb-card border-0 bg-[hsl(var(--sb-surface))] focus-visible:ring-[hsl(var(--sb-cyan))]"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
            {([
              { k: "points", label: "Points" },
              { k: "catches", label: "Catches" },
              { k: "biggest", label: "Biggest" },
              { k: "species", label: "Species" },
            ] as const).map((opt) => (
              <button
                key={opt.k}
                onClick={() => setSort(opt.k)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border sb-border whitespace-nowrap transition-colors ${
                  sort === opt.k
                    ? "sb-bg-cyan text-[hsl(var(--sb-surface))] border-transparent"
                    : "bg-[hsl(var(--sb-surface))] sb-text-muted hover:bg-[hsl(var(--sb-surface-2))] hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl bg-[hsl(var(--sb-surface-2))]" />)}
          </div>
        ) : ranked.length === 0 ? (
          <div className="sb-card p-10 text-center text-sm sb-text-muted">
            No anglers match your filters yet.
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[top3[1], top3[0], top3[2]].filter(Boolean).map((a, idx) => {
                  const realRank = a === top3[0] ? 1 : a === top3[1] ? 2 : 3;
                  const heightClass = realRank === 1 ? "pt-2" : realRank === 2 ? "pt-6" : "pt-8";
                  const medalColor = realRank === 1 ? "sb-gold" : realRank === 2 ? "text-slate-300" : "text-amber-700";
                  return (
                    <button
                      key={a.user_id}
                      onClick={() => navigate(`/app/u/${a.user_id}`)}
                      className={`${heightClass} sb-card p-3 text-center hover:border-[hsl(var(--sb-cyan))] transition-colors`}
                    >
                      <Medal className={`h-5 w-5 mx-auto mb-1 ${medalColor}`} />
                      <Avatar className={`mx-auto mb-2 ${realRank === 1 ? "h-16 w-16" : "h-12 w-12"} ring-2 ring-[hsl(var(--sb-border))]`}>
                        <AvatarImage src={a.profile?.photos?.[0] || ""} />
                        <AvatarFallback className="bg-[hsl(var(--sb-surface-2))]">{(a.profile?.display_name || "?")[0]}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-semibold truncate">{a.profile?.display_name || "Angler"}</p>
                      <p className="text-[11px] sb-text-muted">#{realRank} · <span className="sb-cyan font-semibold">{a.points.toLocaleString()}</span> pts</p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* List */}
            <div className="sb-card divide-y divide-[hsl(var(--sb-border))] overflow-hidden">
              {rest.map((a, i) => (
                <button
                  key={a.user_id}
                  onClick={() => navigate(`/app/u/${a.user_id}`)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[hsl(var(--sb-surface-2))] transition-colors text-left"
                >
                  <span className="w-7 text-center text-sm font-bold sb-text-muted">{i + 4}</span>
                  <Avatar className="h-10 w-10 ring-1 ring-[hsl(var(--sb-border))]">
                    <AvatarImage src={a.profile?.photos?.[0] || ""} />
                    <AvatarFallback className="bg-[hsl(var(--sb-surface-2))]">{(a.profile?.display_name || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm truncate">{a.profile?.display_name || "Angler"}</p>
                      {a.profile?.id_verified && <Badge className="h-4 px-1 text-[9px] sb-bg-cyan border-0 text-[hsl(var(--sb-surface))]">ID</Badge>}
                    </div>
                    <p className="text-[11px] sb-text-muted truncate">
                      {a.profile?.location_name || "Unknown"}
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-xs gap-0.5">
                    <span className="flex items-center gap-1 sb-text-muted"><Fish className="h-3 w-3" />{a.total_caught}</span>
                    {a.largest_weight_lbs != null && (
                      <span className="flex items-center gap-1 sb-text-muted"><Scale className="h-3 w-3" />{a.largest_weight_lbs} lb</span>
                    )}
                    <span className="flex items-center gap-1 sb-text-muted"><Crown className="h-3 w-3" />{a.species_count} spp.</span>
                  </div>
                  <div className="text-right shrink-0 min-w-[64px]">
                    <p className="text-sm font-bold sb-cyan">{a.points.toLocaleString()}</p>
                    <p className="text-[10px] sb-text-muted uppercase tracking-wider">pts</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GlobalAnglers;