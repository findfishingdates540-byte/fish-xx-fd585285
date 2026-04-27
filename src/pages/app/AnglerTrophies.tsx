import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin, Plus, Settings as SettingsIcon, Trophy, Award, Star, Fish,
  Lock, Share2, Heart, BarChart3, Users, PlusCircle, ChevronRight, Map as MapIcon,
} from "lucide-react";

export default function AnglerTrophies() {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const { data: catchStats } = useQuery({
    queryKey: ["angler-trophies-catches", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, count } = await supabase
        .from("catches")
        .select("id, species, weight_lbs, location_name, photo_url, caught_at, created_at", {
          count: "exact",
        })
        .eq("user_id", user.id)
        .order("caught_at", { ascending: false, nullsFirst: false })
        .limit(6);
      const list = data || [];
      const heaviest = list.reduce<{ w: number; sp: string }>(
        (acc, c: any) => (c.weight_lbs && c.weight_lbs > acc.w ? { w: c.weight_lbs, sp: c.species || "" } : acc),
        { w: 0, sp: "" }
      );
      return { count: count || 0, recent: list, heaviest };
    },
    enabled: !!user,
  });

  const displayName = profile?.display_name || "Angler";
  const initials = displayName.charAt(0).toUpperCase();
  const avatarUrl = profile?.photos?.[0];
  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "—";
  const location = [profile?.city, profile?.state].filter(Boolean).join(", ") || "Location not set";
  const isPro = false;

  const totalCatches = catchStats?.count ?? 0;
  const heaviest = catchStats?.heaviest;
  const recent = catchStats?.recent ?? [];

  const trophies = [
    { icon: Trophy, label: "1st Place", sub: "Bass Masters 2023", tone: "gold" },
    { icon: Award, label: "2nd Place", sub: "Salmon Run Open", tone: "silver" },
    { icon: Star, label: "Master Angler", sub: "500+ Logs Species", tone: "cyan" },
    { icon: Fish, label: "Conservationist", sub: "Catch & Release Pro", tone: "cyan" },
    { icon: Lock, label: "Locked", sub: "Reach 2000 Catches", tone: "muted" },
  ];

  const standings = [
    { species: "Largemouth Bass", rank: "#14 Global", note: "Top 1% of all registered bass anglers" },
    { species: "King Salmon", rank: "#108 Global", note: "Top 5% of salmon hunters this season" },
    { species: "Walleye", rank: "#412 Global", note: "Competitive standing in mid-range tier" },
  ];

  return (
    <div className="scoreboard-hub min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero / identity */}
        <section className="sb-card rounded-2xl overflow-hidden">
          <div
            className="h-32 sm:h-40 w-full"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--sb-surface-2)) 0%, hsl(var(--sb-cyan) / 0.25) 50%, hsl(var(--sb-surface)) 100%)",
            }}
          />
          <div className="px-4 sm:px-8 pb-6 -mt-12 sm:-mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 ring-2 ring-[hsl(var(--sb-cyan)/0.6)]" style={{ borderColor: "hsl(var(--sb-bg))" }}>
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-[hsl(var(--sb-surface-2))] text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{displayName}</h1>
                  {isPro && (
                    <span className="sb-bg-cyan text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                      Pro
                    </span>
                  )}
                </div>
                <p className="sb-text-muted text-sm mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 sb-cyan" />
                  {location} • Joined {joined}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/app/catches/new")}
                  className="sb-bg-cyan font-bold uppercase tracking-wider text-xs px-4 py-2.5 rounded-md flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Log Catch
                </button>
                <button
                  onClick={() => navigate("/app/settings")}
                  className="sb-card-soft p-2.5 rounded-md hover:border-[hsl(var(--sb-cyan))] transition-colors"
                  aria-label="Settings"
                >
                  <SettingsIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Catches", value: totalCatches.toLocaleString(), sub: "+12 this week", subTone: "cyan" },
            {
              label: "Record Weight",
              value: heaviest?.w ? `${heaviest.w}lb` : "—",
              sub: (heaviest?.sp || "Log your first").toUpperCase(),
              subTone: "gold",
            },
            { label: "Tourney Wins", value: "14", sub: "Top 3 Finishes: 28", subTone: "muted" },
            { label: "Global Rank", value: "#242", sub: "Elite Tier", subTone: "cyan" },
          ].map((s) => (
            <div key={s.label} className="sb-card rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-widest sb-text-muted font-semibold">{s.label}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1.5 tracking-tight">{s.value}</p>
              <p
                className={`text-[10px] uppercase tracking-widest font-bold mt-2 ${
                  s.subTone === "gold" ? "sb-gold" : s.subTone === "cyan" ? "sb-cyan" : "sb-text-muted"
                }`}
              >
                {s.sub}
              </p>
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
            <button className="text-xs sb-cyan font-bold uppercase tracking-wider hover:underline">
              View All 32 Badges
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {trophies.map((t, i) => {
              const Icon = t.icon;
              const tone =
                t.tone === "gold"
                  ? "sb-gold"
                  : t.tone === "silver"
                  ? "text-slate-300"
                  : t.tone === "cyan"
                  ? "sb-cyan"
                  : "sb-text-muted";
              return (
                <div
                  key={i}
                  className="sb-card-soft rounded-xl p-4 flex flex-col items-center text-center hover:border-[hsl(var(--sb-cyan))] transition-colors"
                >
                  <div className="h-12 w-12 rounded-full flex items-center justify-center mb-2 bg-[hsl(var(--sb-bg))]">
                    <Icon className={`h-6 w-6 ${tone}`} />
                  </div>
                  <p className="text-sm font-bold">{t.label}</p>
                  <p className="text-[10px] sb-text-muted uppercase tracking-wider mt-1">{t.sub}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Two column: recent + standings */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold uppercase tracking-wider">Recent Catches</h2>
              <span className="sb-text-muted text-xs">• Rankings • Teams • Activity</span>
            </div>
            <div className="space-y-3">
              {recent.length === 0 && (
                <div className="sb-card rounded-xl p-6 text-center sb-text-muted text-sm">
                  No catches logged yet.
                </div>
              )}
              {recent.map((c: any) => (
                <div key={c.id} className="sb-card rounded-xl overflow-hidden flex flex-col sm:flex-row">
                  {c.photo_url ? (
                    <img src={c.photo_url} alt={c.species} className="w-full sm:w-44 h-40 sm:h-auto object-cover" />
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
                        <p className="font-bold mt-0.5">{c.species || "Unknown species"}</p>
                      </div>
                      <span className="text-[10px] sb-text-muted uppercase tracking-widest">
                        {new Date(c.caught_at || c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs sb-text-muted mt-2">{c.location_name || "Unknown location"}</p>
                    <div className="flex items-center gap-4 mt-auto pt-3 text-xs sb-text-muted">
                      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> 12 likes</span>
                      <span className="flex items-center gap-1"><Share2 className="h-3.5 w-3.5" /> share</span>
                    </div>
                  </div>
                </div>
              ))}
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
              <button
                onClick={() => navigate("/app/leaderboard")}
                className="mt-4 w-full sb-bg-cyan font-bold uppercase text-xs tracking-wider py-2.5 rounded-md"
              >
                Compare with Rivals
              </button>
            </div>

            <div
              className="sb-card rounded-2xl p-5"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--sb-surface)) 0%, hsl(var(--sb-cyan) / 0.15) 100%)",
              }}
            >
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
                <button
                  onClick={() => navigate("/app/teams")}
                  className="sb-card-soft px-3 py-1.5 rounded-md text-xs uppercase font-bold tracking-wider flex items-center gap-1 hover:border-[hsl(var(--sb-cyan))]"
                >
                  View <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate("/app/teams")}
              className="sb-card w-full rounded-2xl p-4 flex items-center gap-3 hover:border-[hsl(var(--sb-cyan))] transition-colors text-left"
            >
              <PlusCircle className="h-6 w-6 sb-cyan" />
              <div className="flex-1">
                <p className="font-bold text-sm">Join Another Team</p>
                <p className="text-xs sb-text-muted">Expand your network and competition</p>
              </div>
              <ChevronRight className="h-4 w-4 sb-text-muted" />
            </button>

            <button
              onClick={() => navigate("/app/spots")}
              className="sb-card w-full rounded-2xl p-4 flex items-center gap-3 hover:border-[hsl(var(--sb-cyan))] transition-colors text-left"
            >
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
    </div>
  );
}