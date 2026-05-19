import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsPremium } from "@/hooks/use-is-premium";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ShareSheet } from "@/components/feed/ShareSheet";
import { getShareBaseUrl } from "@/lib/config";
import { useState, useMemo } from "react";
import {
  MapPin, Plus, Settings as SettingsIcon, Trophy, Award, Star, Fish,
  Lock, Share2, Heart, BarChart3, Users, PlusCircle, ChevronRight, Map as MapIcon, Loader2,
} from "lucide-react";

const PAGE_SIZE = 6;

type CatchRow = {
  id: string;
  species_name: string | null;
  weight_lbs: number | null;
  location_name: string | null;
  cover_photo_url: string | null;
  photos: string[] | null;
  caught_at: string | null;
  created_at: string;
};

type Badge = {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string | null;
  earned_at: string;
  metadata: any;
  species_id: string | null;
};

const badgeIconFor = (type: string) => {
  switch ((type || "").toLowerCase()) {
    case "tournament": case "first_place": return Trophy;
    case "second_place": case "third_place": return Award;
    case "master": case "milestone": return Star;
    case "conservation": case "release": return Fish;
    default: return Trophy;
  }
};

const badgeToneFor = (idx: number, type: string) => {
  const t = (type || "").toLowerCase();
  if (t.includes("first") || t.includes("gold") || t === "tournament") return "sb-gold";
  if (t.includes("second") || t.includes("silver")) return "text-slate-300";
  if (t.includes("conservation") || t.includes("master")) return "sb-cyan";
  return idx % 2 === 0 ? "sb-cyan" : "sb-gold";
};

export default function AnglerTrophies() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useIsPremium();

  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [shareCatch, setShareCatch] = useState<CatchRow | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["angler-trophies-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, photos, city, state, created_at")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Total catches + heaviest (lightweight aggregate)
  const { data: catchAgg } = useQuery({
    queryKey: ["angler-trophies-agg", user?.id],
    queryFn: async () => {
      if (!user) return { count: 0, heaviest: { w: 0, sp: "" } };
      const [{ count }, heaviestRes] = await Promise.all([
        supabase.from("catches").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("catches").select("weight_lbs, species_name").eq("user_id", user.id)
          .not("weight_lbs", "is", null).order("weight_lbs", { ascending: false }).limit(1).maybeSingle(),
      ]);
      return {
        count: count || 0,
        heaviest: { w: Number(heaviestRes.data?.weight_lbs || 0), sp: heaviestRes.data?.species_name || "" },
      };
    },
    enabled: !!user,
  });

  // Badges
  const { data: badges } = useQuery({
    queryKey: ["angler-trophies-badges", user?.id],
    queryFn: async () => {
      if (!user) return [] as Badge[];
      const { data } = await supabase
        .from("angler_badges")
        .select("id, badge_type, badge_name, badge_description, earned_at, metadata, species_id")
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });
      return (data || []) as Badge[];
    },
    enabled: !!user,
  });

  const totalBadges = badges?.length ?? 0;
  const visibleBadges = useMemo(() => (badges || []).slice(0, 4), [badges]);

  // Recent catches with infinite scroll
  const {
    data: catchesPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: catchesLoading,
  } = useInfiniteQuery({
    queryKey: ["angler-trophies-catches-infinite", user?.id],
    enabled: !!user,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (!user) return { rows: [] as CatchRow[], nextPage: null as number | null };
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data } = await supabase
        .from("catches")
        .select("id, species_name, weight_lbs, location_name, cover_photo_url, photos, caught_at, created_at")
        .eq("user_id", user.id)
        .order("caught_at", { ascending: false, nullsFirst: false })
        .range(from, to);
      const rows = (data || []) as CatchRow[];
      return { rows, nextPage: rows.length === PAGE_SIZE ? (pageParam as number) + 1 : null };
    },
    getNextPageParam: (last) => last.nextPage,
  });

  const recentCatches: CatchRow[] = useMemo(
    () => (catchesPages?.pages || []).flatMap((p) => p.rows),
    [catchesPages]
  );

  // Real like counts via feed_posts(catch_id) -> likes_count
  const { data: likeMap } = useQuery({
    queryKey: ["angler-trophies-catch-likes", recentCatches.map((c) => c.id)],
    enabled: recentCatches.length > 0,
    queryFn: async () => {
      const ids = recentCatches.map((c) => c.id);
      const { data } = await supabase
        .from("feed_posts")
        .select("catch_id, likes_count")
        .in("catch_id", ids);
      const map: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        if (row.catch_id) map[row.catch_id] = (map[row.catch_id] || 0) + (row.likes_count || 0);
      });
      return map;
    },
  });

  const displayName = profile?.display_name || "Angler";
  const initials = displayName.charAt(0).toUpperCase();
  const avatarUrl = profile?.photos?.[0];
  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "—";
  const location = [profile?.city, profile?.state].filter(Boolean).join(", ") || "Location not set";

  const totalCatches = catchAgg?.count ?? 0;
  const heaviest = catchAgg?.heaviest;

  // Locked teaser slot
  const lockedSlot = {
    icon: Lock,
    label: "Locked",
    sub: totalCatches >= 2000 ? "Unlocked!" : `Reach 2000 Catches (${totalCatches}/2000)`,
    tone: "muted" as const,
  };

  const standings = [
    { species: "Largemouth Bass", rank: "#14 Global", note: "Top 1% of all registered bass anglers" },
    { species: "King Salmon", rank: "#108 Global", note: "Top 5% of salmon hunters this season" },
    { species: "Walleye", rank: "#412 Global", note: "Competitive standing in mid-range tier" },
  ];

  const onShare = (c: CatchRow) => setShareCatch(c);

  return (
    <div className="scoreboard-hub min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero */}
        <section className="sb-card rounded-2xl overflow-hidden">
          <div className="h-32 sm:h-40 w-full" style={{
            background: "linear-gradient(135deg, hsl(var(--sb-surface-2)) 0%, hsl(var(--sb-cyan) / 0.25) 50%, hsl(var(--sb-surface)) 100%)",
          }}/>
          <div className="px-4 sm:px-8 pb-6 -mt-12 sm:-mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 ring-2 ring-[hsl(var(--sb-cyan)/0.6)]" style={{ borderColor: "hsl(var(--sb-bg))" }}>
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-[hsl(var(--sb-surface-2))] text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{displayName}</h1>
                  {isPremium && (
                    <span className="sb-bg-cyan text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">Pro</span>
                  )}
                </div>
                <p className="sb-text-muted text-sm mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 sb-cyan" />
                  {location} • Joined {joined}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate("/app/catches/new")}
                  className="sb-bg-cyan font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded-md flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Log Catch
                </button>
                <button onClick={() => navigate("/app/settings")}
                  className="sb-card-soft p-2.5 rounded-md hover:border-[hsl(var(--sb-cyan))] transition-colors" aria-label="Settings">
                  <SettingsIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Catches", value: totalCatches.toLocaleString(), sub: "All time", subTone: "cyan" },
            { label: "Record Weight", value: heaviest?.w ? `${heaviest.w}lb` : "—",
              sub: (heaviest?.sp || "Log your first").toUpperCase(), subTone: "gold" },
            { label: "Trophy Badges", value: String(totalBadges), sub: "Unlocked", subTone: "cyan" },
            { label: "Global Rank", value: "#242", sub: "Elite Tier", subTone: "cyan" },
          ].map((s) => (
            <div key={s.label} className="sb-card rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-widest sb-text-muted font-semibold">{s.label}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1.5 tracking-tight">{s.value}</p>
              <p className={`text-[10px] uppercase tracking-widest font-bold mt-2 ${
                s.subTone === "gold" ? "sb-gold" : s.subTone === "cyan" ? "sb-cyan" : "sb-text-muted"
              }`}>{s.sub}</p>
            </div>
          ))}
        </section>

        {/* Trophy room */}
        <section className="sb-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 sb-gold" />
              <h2 className="text-lg font-bold uppercase tracking-wider">Trophy Room</h2>
            </div>
            <span className="text-xs sb-cyan font-bold uppercase tracking-wider">
              {totalBadges > 0 ? `View All ${totalBadges} Badges` : "No badges yet"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {visibleBadges.map((b, i) => {
              const Icon = badgeIconFor(b.badge_type);
              const tone = badgeToneFor(i, b.badge_type);
              return (
                <button key={b.id} onClick={() => setSelectedBadge(b)}
                  className="sb-card-soft rounded-xl p-4 flex flex-col items-center text-center hover:border-[hsl(var(--sb-cyan))] transition-colors text-left">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center mb-2 bg-[hsl(var(--sb-bg))]">
                    <Icon className={`h-6 w-6 ${tone}`} />
                  </div>
                  <p className="text-sm font-bold line-clamp-1">{b.badge_name}</p>
                  <p className="text-[10px] sb-text-muted uppercase tracking-wider mt-1 line-clamp-1">
                    {new Date(b.earned_at).toLocaleDateString()}
                  </p>
                </button>
              );
            })}
            {visibleBadges.length < 5 && (
              <div className="sb-card-soft rounded-xl p-4 flex flex-col items-center text-center opacity-70">
                <div className="h-12 w-12 rounded-full flex items-center justify-center mb-2 bg-[hsl(var(--sb-bg))]">
                  <lockedSlot.icon className="h-6 w-6 sb-text-muted" />
                </div>
                <p className="text-sm font-bold">{lockedSlot.label}</p>
                <p className="text-[10px] sb-text-muted uppercase tracking-wider mt-1">{lockedSlot.sub}</p>
              </div>
            )}
          </div>
        </section>

        {/* Two column */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-wider">Recent Catches</h2>
            <div className="space-y-3">
              {!catchesLoading && recentCatches.length === 0 && (
                <div className="sb-card rounded-xl p-6 text-center sb-text-muted text-sm">
                  No catches logged yet.
                </div>
              )}
              {recentCatches.map((c) => {
                const photo = c.cover_photo_url || c.photos?.[0];
                const likes = likeMap?.[c.id] ?? 0;
                return (
                  <div key={c.id} className="sb-card rounded-xl overflow-hidden flex flex-col sm:flex-row">
                    {photo ? (
                      <img src={photo} alt={c.species_name || "Catch"} className="w-full sm:w-44 h-40 sm:h-auto object-cover" />
                    ) : (
                      <div className="w-full sm:w-44 h-40 sm:h-auto bg-[hsl(var(--sb-surface-2))] flex items-center justify-center">
                        <Fish className="h-8 w-8 sb-text-muted" />
                      </div>
                    )}
                    <div className="flex-1 p-4 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-2xl font-bold tracking-tight sb-cyan">
                            {c.weight_lbs ? `${c.weight_lbs} lbs` : "—"}
                          </p>
                          <p className="font-bold mt-0.5">{c.species_name || "Unknown species"}</p>
                        </div>
                        <span className="text-[10px] sb-text-muted uppercase tracking-widest">
                          {new Date(c.caught_at || c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs sb-text-muted mt-2">{c.location_name || "Unknown location"}</p>
                      <div className="flex items-center gap-4 mt-auto pt-3 text-xs">
                        <button
                          onClick={() => navigate(`/app/catches/${c.id}`)}
                          className="flex items-center gap-1 sb-text-muted hover:sb-cyan transition-colors"
                        >
                          <Heart className="h-3.5 w-3.5" /> {likes} {likes === 1 ? "like" : "likes"}
                        </button>
                        <button
                          onClick={() => onShare(c)}
                          className="flex items-center gap-1 sb-text-muted hover:sb-cyan transition-colors"
                        >
                          <Share2 className="h-3.5 w-3.5" /> Share
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full sb-card-soft rounded-xl py-3 text-sm font-bold uppercase tracking-wider hover:border-[hsl(var(--sb-cyan))] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isFetchingNextPage ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</> : "Load More Catches"}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="sb-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 sb-cyan" />
                <h3 className="font-bold uppercase tracking-wider text-sm">Species Standings</h3>
              </div>
              <div className="sb-divide">
                {standings.map((s) => (
                  <div key={s.species} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm">{s.species}</p>
                      <span className="text-xs sb-cyan font-bold">{s.rank}</span>
                    </div>
                    <p className="text-xs sb-text-muted mt-1">{s.note}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("/app/leaderboard")}
                className="mt-4 w-full sb-bg-cyan font-bold uppercase text-xs tracking-wider py-2.5 rounded-md">
                Compare with Rivals
              </button>
            </div>

            <div className="sb-card rounded-2xl p-5" style={{
              background: "linear-gradient(135deg, hsl(var(--sb-surface)) 0%, hsl(var(--sb-cyan) / 0.15) 100%)",
            }}>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 sb-cyan" />
                <h3 className="font-bold uppercase tracking-wider text-sm">Team Northwest Predators</h3>
              </div>
              <p className="text-xs sb-text-muted">Team Captain • 12 Members</p>
              <div className="flex items-end justify-between mt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest sb-text-muted">Team Rank</p>
                  <p className="text-3xl font-bold sb-gold">#3</p>
                </div>
                <button onClick={() => navigate("/app/teams")}
                  className="sb-card-soft px-3 py-1.5 rounded-md text-xs uppercase font-bold tracking-wider flex items-center gap-1 hover:border-[hsl(var(--sb-cyan))]">
                  View <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <button onClick={() => navigate("/app/teams")}
              className="sb-card w-full rounded-2xl p-4 flex items-center gap-3 hover:border-[hsl(var(--sb-cyan))] transition-colors text-left">
              <PlusCircle className="h-6 w-6 sb-cyan" />
              <div className="flex-1">
                <p className="font-bold text-sm">Join Another Team</p>
                <p className="text-xs sb-text-muted">Expand your network and competition</p>
              </div>
              <ChevronRight className="h-4 w-4 sb-text-muted" />
            </button>

            <button onClick={() => navigate("/app/spots")}
              className="sb-card w-full rounded-2xl p-4 flex items-center gap-3 hover:border-[hsl(var(--sb-cyan))] transition-colors text-left">
              <MapIcon className="h-6 w-6 sb-gold" />
              <div className="flex-1">
                <p className="font-bold text-sm">Explore Catch Map</p>
                <p className="text-xs sb-text-muted">See where the records are coming from</p>
              </div>
              <ChevronRight className="h-4 w-4 sb-text-muted" />
            </button>
          </div>
        </section>
      </div>

      {/* Badge details modal */}
      <BadgeDetailsModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} userId={user?.id} />

      {/* Share sheet */}
      {shareCatch && (
        <ShareSheet
          isOpen={!!shareCatch}
          onClose={() => setShareCatch(null)}
          shareUrl={`${getShareBaseUrl()}/app/catches/${shareCatch.id}`}
          shareTitle={`${shareCatch.species_name || "Catch"} • ${shareCatch.weight_lbs || "—"} lbs`}
          shareText={`Check out this catch on Fish-X`}
        />
      )}
    </div>
  );
}

function BadgeDetailsModal({
  badge, onClose, userId,
}: { badge: Badge | null; onClose: () => void; userId?: string }) {
  const open = !!badge;

  // Look up species name if linked
  const { data: speciesName } = useQuery({
    queryKey: ["badge-species", badge?.species_id],
    enabled: !!badge?.species_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("fish_species").select("name").eq("id", badge!.species_id!).maybeSingle();
      return data?.name || null;
    },
  });

  // Find catches that match this badge's species (proxy for "catches that unlocked it")
  const { data: relatedCatches } = useQuery({
    queryKey: ["badge-related-catches", badge?.id, userId],
    enabled: open && !!userId,
    queryFn: async () => {
      if (!userId || !badge) return [] as CatchRow[];
      let q = supabase.from("catches")
        .select("id, species_name, weight_lbs, location_name, cover_photo_url, photos, caught_at, created_at")
        .eq("user_id", userId)
        .lte("created_at", badge.earned_at)
        .order("caught_at", { ascending: false, nullsFirst: false })
        .limit(5);
      if (badge.species_id) q = q.eq("species_id", badge.species_id);
      const { data } = await q;
      return (data || []) as CatchRow[];
    },
  });

  if (!badge) return null;
  const Icon = badgeIconFor(badge.badge_type);
  const tone = badgeToneFor(0, badge.badge_type);
  const requirement = (badge.metadata && (badge.metadata.requirement || badge.metadata.criteria))
    || "Awarded for an outstanding milestone in your fishing journey.";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="scoreboard-hub max-w-lg bg-[hsl(var(--sb-bg))] border-[hsl(var(--sb-border))] text-[hsl(var(--sb-text))]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-[hsl(var(--sb-surface-2))] flex items-center justify-center">
              <Icon className={`h-7 w-7 ${tone}`} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{badge.badge_name}</DialogTitle>
              <DialogDescription className="sb-text-muted text-xs uppercase tracking-widest">
                {badge.badge_type.replace(/_/g, " ")} • Earned {new Date(badge.earned_at).toLocaleDateString()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest sb-cyan font-bold mb-1">Description</p>
            <p className="text-sm">{badge.badge_description || "No description provided."}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest sb-cyan font-bold mb-1">Requirements</p>
            <p className="text-sm sb-text-muted">{String(requirement)}</p>
            {speciesName && (
              <p className="text-xs sb-cyan mt-1 font-bold">Species: {speciesName}</p>
            )}
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest sb-cyan font-bold mb-2">Catches that unlocked it</p>
            {(!relatedCatches || relatedCatches.length === 0) ? (
              <p className="text-xs sb-text-muted">No matching catches found in your log.</p>
            ) : (
              <div className="space-y-2">
                {relatedCatches.map((c) => {
                  const photo = c.cover_photo_url || c.photos?.[0];
                  return (
                    <div key={c.id} className="sb-card-soft rounded-md p-2 flex items-center gap-3">
                      {photo ? (
                        <img src={photo} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-[hsl(var(--sb-bg))] flex items-center justify-center">
                          <Fish className="h-4 w-4 sb-text-muted" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{c.species_name || "Catch"}</p>
                        <p className="text-[10px] sb-text-muted truncate">
                          {c.weight_lbs ? `${c.weight_lbs} lbs • ` : ""}{c.location_name || "Unknown"}
                        </p>
                      </div>
                      <span className="text-[10px] sb-text-muted">
                        {new Date(c.caught_at || c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
