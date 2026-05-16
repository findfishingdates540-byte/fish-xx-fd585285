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
  ArrowLeft,
  Search,
  Plus,
  Users,
  Crown,
  Shield,
  Anchor,
  Sparkles,
  Star,
} from "lucide-react";

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
}

export default function Teams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["all-teams"],
    queryFn: async () => {
      const { data } = await supabase.from("fishing_teams").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const teamIds = teams.map((t) => t.id);
  const captainIds = teams.map((t) => t.captain_id);

  const { data: memberData = [] } = useQuery({
    queryKey: ["all-team-members", teamIds.join(",")],
    queryFn: async () => {
      if (teamIds.length === 0) return [];
      const { data } = await supabase.from("team_members").select("team_id, user_id");
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

  const enrichedTeams: TeamWithCount[] = teams.map((t: any) => {
    const members = memberData.filter((m) => m.team_id === t.id);
    const captain = captainProfiles[t.captain_id];
    return {
      ...t,
      memberCount: members.length + 1,
      isMember: !!user && (t.captain_id === user.id || members.some((m) => m.user_id === user.id)),
      captainName: captain?.display_name || "Captain",
      captainPhoto: captain?.photos?.[0] || null,
    };
  });

  const filtered = enrichedTeams.filter((t) => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const myTeams = enrichedTeams.filter((t) => t.isMember);

  const categoryConfig: Record<string, { label: string; icon: typeof Shield }> = {
    jr_anglers: { label: "Jr. Anglers", icon: Sparkles },
    junior_angler: { label: "Jr. Anglers", icon: Sparkles },
    lady_angler: { label: "Lady Angler", icon: Star },
    all_anglers: { label: "All Anglers", icon: Anchor },
    teams: { label: "Teams", icon: Shield },
  };
  const getCategoryConfig = (c: string) => categoryConfig[c] || categoryConfig.teams;

  const categories = [
    { key: "all", label: "All" },
    { key: "teams", label: "Open" },
    { key: "lady_angler", label: "Lady Angler" },
    { key: "jr_anglers", label: "Jr. Anglers" },
  ];

  return (
    <div className="scoreboard-hub min-h-screen -mx-4 md:-mx-0 pb-32">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 backdrop-blur bg-[hsl(var(--sb-surface)/0.85)] border-b sb-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="hover:bg-[hsl(var(--sb-surface-2))]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold flex items-center gap-2">
              <Shield className="h-4 w-4 sb-cyan" />
              Teams
            </h1>
            <p className="text-[11px] sb-text-muted">{enrichedTeams.length} teams competing</p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/app/teams/new")}
            className="sb-bg-cyan border-0 hover:opacity-90 gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sb-text-muted" />
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 sb-card border-0 bg-[hsl(var(--sb-surface))] focus-visible:ring-[hsl(var(--sb-cyan))]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {categories.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border sb-border whitespace-nowrap transition-colors ${
                categoryFilter === key
                  ? "sb-bg-cyan text-[hsl(var(--sb-surface))] border-transparent"
                  : "bg-[hsl(var(--sb-surface))] sb-text-muted hover:bg-[hsl(var(--sb-surface-2))] hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* My Teams Rail */}
        {myTeams.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold sb-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5 px-0.5">
              <Crown className="h-3.5 w-3.5 sb-gold" /> My Teams
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
              {myTeams.map((team) => {
                const config = getCategoryConfig(team.category);
                return (
                  <button
                    key={team.id}
                    onClick={() => navigate(`/app/teams/${team.id}`)}
                    className="shrink-0 w-44 sb-card p-3 text-left hover:border-[hsl(var(--sb-cyan))] transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-[hsl(var(--sb-surface-2))] flex items-center justify-center text-xs font-bold sb-cyan overflow-hidden shrink-0">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                        ) : (
                          team.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      {team.captain_id === user?.id && (
                        <Crown className="h-3.5 w-3.5 sb-gold shrink-0 ml-auto" aria-label="Captain" />
                      )}
                    </div>
                    <p className="font-semibold text-sm truncate group-hover:sb-cyan transition-colors">{team.name}</p>
                    <p className="text-[10px] sb-text-muted mt-0.5 flex items-center gap-1">
                      <config.icon className="h-2.5 w-2.5" />
                      {config.label} · {team.memberCount}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* All Teams Grid */}
        <section>
          <h2 className="text-[11px] font-bold sb-text-muted uppercase tracking-wider mb-2 px-0.5">
            {categoryFilter === "all" ? "All Teams" : getCategoryConfig(categoryFilter).label}
            <span className="ml-1.5 sb-text-muted/70">· {filtered.length}</span>
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl bg-[hsl(var(--sb-surface-2))]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="sb-card p-10 text-center">
              <Users className="h-10 w-10 mx-auto sb-text-muted/50 mb-3" />
              <p className="font-medium sb-text-muted">No teams found</p>
              <p className="text-xs sb-text-muted/70 mt-1">Try a different search or create your own team</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((team) => {
                const config = getCategoryConfig(team.category);
                const CategoryIcon = config.icon;
                return (
                  <button
                    key={team.id}
                    onClick={() => navigate(`/app/teams/${team.id}`)}
                    className="sb-card p-3.5 text-left hover:border-[hsl(var(--sb-cyan))] transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-[hsl(var(--sb-surface-2))] flex items-center justify-center text-sm font-bold sb-cyan overflow-hidden shrink-0">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                        ) : (
                          team.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm truncate group-hover:sb-cyan transition-colors">
                            {team.name}
                          </h3>
                          {team.captain_id === user?.id && (
                            <Crown className="h-3 w-3 sb-gold shrink-0" aria-label="You are captain" />
                          )}
                        </div>
                        <p className="text-[10px] sb-text-muted mt-0.5 flex items-center gap-1">
                          <CategoryIcon className="h-2.5 w-2.5" />
                          {config.label}
                        </p>
                        {team.description && (
                          <p className="text-xs sb-text-muted line-clamp-2 mt-1.5 leading-relaxed">
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t sb-border">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-5 w-5 ring-1 ring-[hsl(var(--sb-border))]">
                          <AvatarImage src={team.captainPhoto || undefined} />
                          <AvatarFallback className="text-[8px] bg-[hsl(var(--sb-surface-2))]">
                            {team.captainName?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] sb-text-muted truncate">
                          <span className="font-medium text-foreground">{team.captainName}</span>
                          <span className="sb-text-muted"> · Captain</span>
                        </span>
                      </div>
                      <span className="text-[11px] sb-text-muted flex items-center gap-1 shrink-0">
                        <Users className="h-3 w-3" />
                        {team.memberCount}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
