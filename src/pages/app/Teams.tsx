import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Users,
  Crown,
  ChevronRight,
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
        .from("profiles")
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

  const categoryConfig: Record<string, { label: string; icon: typeof Shield; gradient: string; accent: string }> = {
    jr_anglers: { label: "Jr. Anglers", icon: Sparkles, gradient: "from-amber-500/20 to-orange-500/10", accent: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
    junior_angler: { label: "Jr. Anglers", icon: Sparkles, gradient: "from-amber-500/20 to-orange-500/10", accent: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
    lady_angler: { label: "Lady Angler", icon: Star, gradient: "from-pink-500/20 to-rose-500/10", accent: "text-pink-600 bg-pink-500/10 border-pink-500/20" },
    all_anglers: { label: "All Anglers", icon: Anchor, gradient: "from-emerald-500/20 to-teal-500/10", accent: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
    teams: { label: "Teams", icon: Shield, gradient: "from-primary/20 to-primary/5", accent: "text-primary bg-primary/10 border-primary/20" },
  };

  const getCategoryConfig = (c: string) => categoryConfig[c] || categoryConfig.teams;

  const categories = [
    { key: "all", label: "All" },
    { key: "teams", label: "Teams" },
    { key: "lady_angler", label: "Women" },
    { key: "jr_anglers", label: "Jr. Anglers" },
    { key: "all_anglers", label: "All Anglers" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Teams
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{enrichedTeams.length} teams competing</p>
        </div>
        <Button size="sm" onClick={() => navigate("/app/teams/new")} className="gap-1.5">
          <Plus className="h-4 w-4" /> Create
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search teams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {/* Category Filter */}
      <div className="grid grid-cols-5 rounded-lg overflow-hidden border border-border mb-5">
        {categories.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(key)}
            className={`py-2 text-[11px] font-medium text-center transition-colors ${
              categoryFilter === key
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* My Teams */}
      {myTeams.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5" /> My Teams
          </h2>
          <div className="space-y-2">
            {myTeams.map((team) => {
              const config = getCategoryConfig(team.category);
              return (
                <button
                  key={team.id}
                  onClick={() => navigate(`/app/teams/${team.id}`)}
                  className="w-full rounded-xl border-2 border-primary/20 bg-card overflow-hidden text-left hover:border-primary/40 transition-all group"
                >
                  {/* Category accent strip */}
                  <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />
                  <div className="p-3.5 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        team.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{team.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border ${config.accent}`}>
                          {config.label}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />{team.memberCount}
                        </span>
                        {team.captain_id === user?.id && (
                          <span className="text-[11px] text-primary flex items-center gap-0.5">
                            <Crown className="h-3 w-3" />Captain
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* All Teams */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">No teams found</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different search or create your own team</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((team) => {
            const config = getCategoryConfig(team.category);
            const CategoryIcon = config.icon;

            return (
              <button
                key={team.id}
                onClick={() => navigate(`/app/teams/${team.id}`)}
                className="w-full rounded-xl border bg-card overflow-hidden text-left hover:shadow-md transition-all group"
              >
                {/* Gradient header strip */}
                <div className={`h-14 bg-gradient-to-r ${config.gradient} relative px-4 flex items-end pb-2`}>
                  <div className="absolute top-2.5 right-3">
                    <Badge variant="outline" className={`text-[9px] border ${config.accent} backdrop-blur-sm`}>
                      <CategoryIcon className="h-2.5 w-2.5 mr-0.5" />
                      {config.label}
                    </Badge>
                  </div>
                  {/* Logo overlapping the strip */}
                  <div className="w-12 h-12 rounded-xl border-2 border-card bg-card flex items-center justify-center text-sm font-bold text-primary shrink-0 overflow-hidden translate-y-4 shadow-sm">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base">{team.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 pt-5 pb-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                        {team.name}
                      </h3>
                      {team.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={team.captainPhoto || undefined} />
                        <AvatarFallback className="text-[8px]">{team.captainName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">{team.captainName}</span>
                        {team.captain_id === user?.id ? "" : " · Captain"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
