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
  ArrowLeft,
  Scale,
  Home,
  Database,
  Settings,
  HelpCircle,
  LogOut,
  Radio,
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
  cover_url?: string | null;
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
    <div className="scoreboard-hub min-h-[100dvh] pb-32 overflow-x-hidden">
      <div className="lg:grid lg:grid-cols-[260px_1fr]">
        <TeamsSidebar />
        <div className="min-w-0 max-w-6xl mx-auto w-full px-4 md:px-6 pt-5 md:pt-8">
        {/* Page heading */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-[hsl(var(--sb-surface-2))] transition-colors shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                Teams
              </h1>
              <p className="text-xs sb-text-muted mt-0.5">
                {enrichedTeams.length} teams competing
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/app/teams/new")}
            className="sb-bg-cyan border-0 hover:opacity-90 gap-1.5 shrink-0 rounded-xl h-11 px-3 sm:px-5 font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create team</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>

        {/* Toolbar */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sb-text-muted" />
            <Input
              placeholder="Search teams, captains, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 rounded-2xl border-0 bg-[hsl(var(--sb-surface-2))] focus-visible:ring-[hsl(var(--sb-cyan))] h-12 text-sm"
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

        {/* My Teams horizontal row */}
        <div className="mb-8">
          <h2 className="text-[11px] font-bold sb-text-muted uppercase tracking-[0.18em] mb-3 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 sb-gold" /> My Teams
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {myTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => navigate(`/app/teams/${team.id}`)}
                className="sb-card rounded-2xl p-4 flex flex-col items-center text-center hover:border-[hsl(var(--sb-cyan))] transition-colors group"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-[hsl(var(--sb-surface-2))] flex items-center justify-center text-sm font-bold sb-cyan overflow-hidden ring-1 ring-[hsl(var(--sb-border))]">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      team.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[hsl(var(--sb-surface))]" />
                  {team.captain_id === user?.id && (
                    <Crown className="absolute -top-1 -right-1 h-3.5 w-3.5 sb-gold" aria-label="Captain" />
                  )}
                </div>
                <p className="mt-3 font-semibold text-sm truncate w-full group-hover:sb-cyan transition-colors">
                  {team.name}
                </p>
                <p className="text-[10px] sb-text-muted mt-0.5">{team.memberCount} members</p>
              </button>
            ))}
            <button
              onClick={() => navigate("/app/teams/new")}
              className="rounded-2xl p-4 flex flex-col items-center text-center border border-dashed sb-border hover:border-[hsl(var(--sb-cyan))] hover:bg-[hsl(var(--sb-surface-2))] transition-colors group"
            >
              <div className="w-14 h-14 rounded-full border border-dashed sb-border flex items-center justify-center group-hover:border-[hsl(var(--sb-cyan))]">
                <Plus className="h-5 w-5 sb-text-muted group-hover:sb-cyan" />
              </div>
              <p className="mt-3 font-semibold text-sm">Join New</p>
              <p className="text-[10px] sb-text-muted mt-0.5">Explore</p>
            </button>
          </div>
        </div>

        {/* Discover */}
        <section>
          <h2 className="text-[11px] font-bold sb-text-muted uppercase tracking-[0.18em] mb-3 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 sb-cyan" /> Discover Teams
          </h2>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-72 rounded-2xl bg-[hsl(var(--sb-surface-2))]" />
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
                  const isRecruiting = team.memberCount < 10;
                  const overflow = Math.max(0, team.memberCount - 1);
                  const lbs = Math.round((team.totalScore || 0));
                  return (
                    <button
                      key={team.id}
                      onClick={() => navigate(`/app/teams/${team.id}`)}
                      className="sb-card text-left rounded-2xl hover:border-[hsl(var(--sb-cyan))] transition-colors group relative flex flex-col overflow-hidden"
                    >
                      {/* Cover banner */}
                      <div className="relative h-32 w-full bg-gradient-to-br from-[hsl(var(--sb-cyan)/0.25)] via-[hsl(var(--sb-surface-2))] to-[hsl(var(--sb-surface))]">
                        {team.cover_url && (
                          <img src={team.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sb-surface))] via-transparent to-transparent" />
                        <span
                          className={`absolute bottom-2 right-3 text-[9px] font-bold tracking-[0.14em] px-2 py-1 rounded-md ${
                            isRecruiting
                              ? "bg-[hsl(var(--sb-cyan)/0.2)] sb-cyan ring-1 ring-[hsl(var(--sb-cyan)/0.4)]"
                              : "bg-[hsl(var(--sb-surface-2))] sb-text-muted ring-1 ring-[hsl(var(--sb-border))]"
                          }`}
                        >
                          {isRecruiting ? "RECRUITING" : "STABLE"}
                        </span>
                        <div className="absolute -bottom-6 left-4">
                          <div className="w-14 h-14 rounded-full bg-[hsl(var(--sb-surface))] p-1 ring-1 ring-[hsl(var(--sb-border))]">
                            <div className="w-full h-full rounded-full bg-[hsl(var(--sb-surface-2))] flex items-center justify-center text-sm font-bold sb-cyan overflow-hidden">
                              {team.logo_url ? (
                                <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                team.name.slice(0, 2).toUpperCase()
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-5 pt-8 pb-5 flex flex-col flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-base leading-tight group-hover:sb-cyan transition-colors">
                            {team.name}
                          </h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md sb-text-muted bg-[hsl(var(--sb-surface-2))]">
                            {config.label}
                          </span>
                        </div>

                        {team.description && (
                          <p className="text-xs sb-text-muted line-clamp-2 mt-2 leading-relaxed">
                            {team.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 sm:gap-4 mt-4 text-[11px] flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Fish className="h-3.5 w-3.5 sb-cyan" />
                            <span className="font-semibold">{team.catchCount}</span>
                            <span className="sb-text-muted">Catches</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Scale className="h-3.5 w-3.5 sb-text-muted" />
                            <span className="font-semibold">{lbs} lbs</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Trophy className="h-3.5 w-3.5 sb-gold" />
                            <span className="font-semibold">
                              {team.rank ? `Rank #${team.rank}` : "Unranked"}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t sb-border">
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

function TeamsSidebar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth() as any;

  const { data: profile } = useQuery({
    queryKey: ["sidebar-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, photos, is_premium")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const photo = (profile?.photos as any)?.[0];
  const tier = profile?.is_premium ? "PRO ANGLER" : "ANGLER";

  const navItems = [
    { label: "Home", icon: Home, to: "/app/feed" },
    { label: "Competitions", icon: Trophy, to: "/app/leaderboard", active: false },
    { label: "Teams", icon: Users, to: "/app/teams", active: true },
    { label: "Trips", icon: Compass, to: "/app/trips" },
    { label: "Settings", icon: Settings, to: "/app/settings" },
  ];

  return (
    <aside className="hidden lg:flex flex-col gap-1 sticky top-16 self-start h-[calc(100dvh-4rem)] overflow-hidden px-3 py-5 border-r sb-border bg-[hsl(var(--sb-surface)/0.4)]">
      {/* Profile card */}
      <button
        onClick={() => navigate("/app/profile")}
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[hsl(var(--sb-surface-2))] transition-colors text-left mb-3"
      >
        <Avatar className="h-10 w-10 ring-1 ring-[hsl(var(--sb-border))]">
          <AvatarImage src={photo || undefined} />
          <AvatarFallback className="bg-[hsl(var(--sb-surface-2))] text-xs">
            {(profile?.display_name || "A").charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-[10px] font-bold sb-cyan tracking-[0.14em]">{tier}</p>
          <p className="text-xs sb-text-muted truncate">
            {profile?.display_name || "Elite Division"}
          </p>
        </div>
      </button>

      {/* Nav */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.to)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? "bg-[hsl(var(--sb-cyan)/0.12)] sb-cyan"
                  : "sb-text-muted hover:bg-[hsl(var(--sb-surface-2))] hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Go Live */}
      <Button
        onClick={() => navigate("/app/feed")}
        className="sb-bg-cyan border-0 hover:opacity-90 gap-2 rounded-xl h-11 font-semibold mb-2"
      >
        <Radio className="h-4 w-4" /> GO LIVE
      </Button>

      <div className="space-y-1 pt-2 border-t sb-border">
        <button
          onClick={() => navigate("/app/settings")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm sb-text-muted hover:bg-[hsl(var(--sb-surface-2))] hover:text-foreground transition-colors"
        >
          <HelpCircle className="h-4 w-4" /> Help
        </button>
        <button
          onClick={() => signOut?.()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm sb-text-muted hover:bg-[hsl(var(--sb-surface-2))] hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
