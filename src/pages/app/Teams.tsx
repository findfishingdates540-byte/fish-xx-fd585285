import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Users,
  Crown,
  Shield,
  Anchor,
  Sparkles,
  Star,
  MapPin,
  UserPlus,
  Compass,
  Trophy,
  Fish,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeamWithCount {
  id: string;
  name: string;
  description: string | null;
  skill_level: string;
  captain_id: string;
  logo_url: string | null;
  created_at: string;
  category: string;
  memberCount: number;
  isMember: boolean;
  captainName?: string;
  captainPhoto?: string;
  catchCount?: number;
  totalScore?: number;
  rank?: number;
}

export default function Teams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [nearMeOnly, setNearMeOnly] = useState(false);
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"active" | "newest" | "members">("active");

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["all-teams"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fishing_teams")
        .select(
          "captain_id,category,cover_url,created_at,description,followers_count,group_description,id,location,logo_url,name,page_description,rules,skill_level,team_type,website"
        )
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const teamIds = teams.map((t) => t.id);
  const captainIds = teams.map((t) => t.captain_id);

  const { data: memberData = [] } = useQuery({
    queryKey: ["all-team-members", teamIds.join(",")],
    queryFn: async () => {
      if (teamIds.length === 0) return [];
      const { data } = await supabase
        .from("team_members")
        .select("team_id, user_id, status")
        .eq("status", "approved");
      return data || [];
    },
    enabled: teamIds.length > 0,
  });

  const { data: captainProfiles = {} } = useQuery({
    queryKey: ["captain-profiles", captainIds.join(",")],
    queryFn: async () => {
      if (captainIds.length === 0) return {};
      const uniqueIds = [...new Set(captainIds)];
      const { data } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos")
        .in("id", uniqueIds);
      const map: Record<string, any> = {};
      data?.forEach((p) => (map[p.id] = p));
      return map;
    },
    enabled: captainIds.length > 0,
  });

  const { data: teamScores = [] } = useQuery({
    queryKey: ["team-scores-all"],
    queryFn: async () => {
      const { data } = await (supabase.rpc as any)("get_team_scores", {});
      return (data || []) as Array<{
        team_id: string;
        catch_count: number;
        total_score: number;
        member_count: number;
      }>;
    },
  });

  const scoreMap: Record<string, { catchCount: number; totalScore: number; rank: number }> = {};
  [...teamScores]
    .sort((a, b) => Number(b.total_score) - Number(a.total_score))
    .forEach((row, idx) => {
      scoreMap[row.team_id] = {
        catchCount: Number(row.catch_count) || 0,
        totalScore: Number(row.total_score) || 0,
        rank: idx + 1,
      };
    });

  const enrichedTeams: TeamWithCount[] = teams.map((t: any) => {
    const members = memberData.filter((m) => m.team_id === t.id);
    const captain = captainProfiles[t.captain_id];
    const score = scoreMap[t.id];
    return {
      ...t,
      memberCount: members.length + 1,
      isMember:
        !!user && (t.captain_id === user.id || members.some((m) => m.user_id === user.id)),
      captainName: captain?.display_name || "Captain",
      captainPhoto: captain?.photos?.[0] || null,
      catchCount: score?.catchCount ?? 0,
      totalScore: score?.totalScore ?? 0,
      rank: score?.rank,
    };
  });

  const filtered = enrichedTeams.filter((t) => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (recruitingOnly && t.memberCount >= 10) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest")
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "members") return b.memberCount - a.memberCount;
    return (b.totalScore || 0) - (a.totalScore || 0);
  });

  const myTeams = enrichedTeams.filter((t) => t.isMember);

  const categoryConfig: Record<string, { label: string; icon: typeof Shield }> = {
    jr_anglers: { label: "Jr. Anglers", icon: Sparkles },
    junior_angler: { label: "Jr. Anglers", icon: Sparkles },
    lady_angler: { label: "Lady Angler", icon: Star },
    all_anglers: { label: "All Anglers", icon: Anchor },
    teams: { label: "Open", icon: Shield },
  };
  const getCategoryConfig = (c: string) => categoryConfig[c] || categoryConfig.teams;

  const categories = [
    { key: "all", label: "All" },
    { key: "teams", label: "Open" },
    { key: "lady_angler", label: "Lady Angler" },
    { key: "jr_anglers", label: "Jr. Anglers" },
  ];

  const sortLabel =
    sortBy === "newest" ? "Newest" : sortBy === "members" ? "Most members" : "Most active";

  return (
    <div className="scoreboard-hub min-h-[100dvh] -mx-4 md:-mx-0 pb-32">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-8">
        {/* Page heading */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6 sb-cyan" />
              Teams
            </h1>
            <p className="text-xs sb-text-muted mt-1">
              {enrichedTeams.length} teams competing
            </p>
          </div>
          <Button
            onClick={() => navigate("/app/teams/new")}
            className="sb-bg-cyan border-0 hover:opacity-90 gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" /> Create team
          </Button>
        </div>

        {/* Toolbar */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sb-text-muted" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 sb-card border-0 bg-[hsl(var(--sb-surface))] focus-visible:ring-[hsl(var(--sb-cyan))] h-11"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-2 overflow-x-auto scrollbar-none flex-1 min-w-0">
              {categories.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
                    categoryFilter === key
                      ? "sb-bg-cyan border-transparent"
                      : "bg-[hsl(var(--sb-surface))] sb-text-muted sb-border hover:bg-[hsl(var(--sb-surface-2))] hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setNearMeOnly((v) => !v)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors flex items-center gap-1 ${
                  nearMeOnly
                    ? "sb-bg-cyan border-transparent"
                    : "bg-[hsl(var(--sb-surface))] sb-text-muted sb-border hover:bg-[hsl(var(--sb-surface-2))] hover:text-foreground"
                }`}
              >
                <MapPin className="h-3 w-3" /> Near me
              </button>
              <button
                onClick={() => setRecruitingOnly((v) => !v)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors flex items-center gap-1 ${
                  recruitingOnly
                    ? "sb-bg-cyan border-transparent"
                    : "bg-[hsl(var(--sb-surface))] sb-text-muted sb-border hover:bg-[hsl(var(--sb-surface-2))] hover:text-foreground"
                }`}
              >
                <UserPlus className="h-3 w-3" /> Recruiting
              </button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs sb-text-muted hover:text-foreground hover:bg-[hsl(var(--sb-surface-2))] shrink-0"
                >
                  Sort: <span className="text-foreground font-medium">{sortLabel}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("active")}>
                  Most active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("members")}>
                  Most members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  Newest
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Left rail */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div>
              <h2 className="text-[11px] font-bold sb-text-muted uppercase tracking-[0.14em] mb-3 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 sb-gold" /> My Teams
              </h2>
              <div className="space-y-2">
                {myTeams.length === 0 ? (
                  <p className="text-xs sb-text-muted/80 leading-relaxed">
                    You haven't joined a team yet. Explore below and find your crew.
                  </p>
                ) : (
                  myTeams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => navigate(`/app/teams/${team.id}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--sb-surface-2))] transition-colors text-left group"
                    >
                      <div className="w-9 h-9 rounded-full bg-[hsl(var(--sb-surface-2))] flex items-center justify-center text-[11px] font-bold sb-cyan overflow-hidden shrink-0 ring-1 ring-[hsl(var(--sb-border))]">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                        ) : (
                          team.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate group-hover:sb-cyan transition-colors">
                          {team.name}
                        </p>
                        <p className="text-[10px] sb-text-muted">{team.memberCount} members</p>
                      </div>
                      {team.captain_id === user?.id && (
                        <Crown className="h-3.5 w-3.5 sb-gold shrink-0" aria-label="Captain" />
                      )}
                    </button>
                  ))
                )}
                <button
                  onClick={() => navigate("/app/teams/new")}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--sb-surface-2))] transition-colors text-left group"
                >
                  <div className="w-9 h-9 rounded-full border border-dashed sb-border flex items-center justify-center shrink-0 group-hover:border-[hsl(var(--sb-cyan))]">
                    <Plus className="h-4 w-4 sb-text-muted group-hover:sb-cyan" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">Join New</p>
                    <p className="text-[10px] sb-text-muted">Create or join a crew</p>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-[11px] font-bold sb-text-muted uppercase tracking-[0.14em] mb-3 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 sb-cyan" /> Discover Teams
              </h2>
              <div className="space-y-1">
                <button
                  onClick={() => setRecruitingOnly(true)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--sb-surface-2))] transition-colors text-left text-sm"
                >
                  <UserPlus className="h-4 w-4 sb-text-muted" /> Recruiting now
                </button>
                <button
                  onClick={() => setNearMeOnly(true)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--sb-surface-2))] transition-colors text-left text-sm"
                >
                  <MapPin className="h-4 w-4 sb-text-muted" /> Near me
                </button>
                <button
                  onClick={() => navigate("/app/leaderboard")}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--sb-surface-2))] transition-colors text-left text-sm"
                >
                  <Trophy className="h-4 w-4 sb-gold" /> Top ranked
                </button>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <section>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-56 rounded-2xl bg-[hsl(var(--sb-surface-2))]" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="sb-card p-10 text-center rounded-2xl">
                <Users className="h-10 w-10 mx-auto sb-text-muted/50 mb-3" />
                <p className="font-medium sb-text-muted">No teams found</p>
                <p className="text-xs sb-text-muted/70 mt-1">
                  Try a different search or create your own team
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sorted.map((team) => {
                  const config = getCategoryConfig(team.category);
                  const CategoryIcon = config.icon;
                  const isRecruiting = team.memberCount < 10;
                  const overflow = Math.max(0, team.memberCount - 1);
                  return (
                    <button
                      key={team.id}
                      onClick={() => navigate(`/app/teams/${team.id}`)}
                      className="sb-card p-5 text-left rounded-2xl hover:border-[hsl(var(--sb-cyan))] transition-colors group relative flex flex-col"
                    >
                      <span
                        className={`absolute top-4 right-4 text-[9px] font-bold tracking-[0.14em] px-2 py-1 rounded-full ${
                          isRecruiting
                            ? "bg-[hsl(var(--sb-cyan)/0.15)] sb-cyan"
                            : "bg-[hsl(var(--sb-surface-2))] sb-text-muted"
                        }`}
                      >
                        {isRecruiting ? "RECRUITING" : "STABLE"}
                      </span>

                      <div className="flex items-start gap-3 pr-20">
                        <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--sb-surface-2))] flex items-center justify-center text-sm font-bold sb-cyan overflow-hidden shrink-0 ring-1 ring-[hsl(var(--sb-border))]">
                          {team.logo_url ? (
                            <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                          ) : (
                            team.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold text-base leading-tight truncate group-hover:sb-cyan transition-colors">
                            {team.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded sb-text-muted bg-[hsl(var(--sb-surface-2))]">
                            <CategoryIcon className="h-2.5 w-2.5" /> {config.label}
                          </span>
                        </div>
                      </div>

                      {team.description && (
                        <p className="text-xs sb-text-muted line-clamp-2 mt-3 leading-relaxed">
                          {team.description}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t sb-border">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Fish className="h-3.5 w-3.5 sb-cyan shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold leading-none">{team.catchCount}</p>
                            <p className="text-[9px] sb-text-muted mt-0.5">Catches</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Users className="h-3.5 w-3.5 sb-text-muted shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold leading-none">{team.memberCount}</p>
                            <p className="text-[9px] sb-text-muted mt-0.5">Members</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Trophy className="h-3.5 w-3.5 sb-gold shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold leading-none">
                              {team.rank ? `#${team.rank}` : "—"}
                            </p>
                            <p className="text-[9px] sb-text-muted mt-0.5">Rank</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-6 w-6 ring-1 ring-[hsl(var(--sb-border))]">
                            <AvatarImage src={team.captainPhoto || undefined} />
                            <AvatarFallback className="text-[9px] bg-[hsl(var(--sb-surface-2))]">
                              {team.captainName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] truncate">
                            <span className="font-semibold text-foreground">{team.captainName}</span>
                            <span className="sb-text-muted"> · Captain</span>
                          </span>
                        </div>
                        {overflow > 0 && (
                          <span className="text-[10px] font-semibold sb-text-muted bg-[hsl(var(--sb-surface-2))] px-2 py-1 rounded-full">
                            +{overflow}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
