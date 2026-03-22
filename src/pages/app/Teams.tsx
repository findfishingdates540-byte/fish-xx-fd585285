import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  Users,
  Trophy,
  Crown,
  ChevronRight,
} from "lucide-react";

interface TeamWithCount {
  id: string;
  name: string;
  description: string | null;
  skill_level: string;
  captain_id: string;
  logo_url: string | null;
  created_at: string;
  memberCount: number;
  isMember: boolean;
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
  const { data: memberData = [] } = useQuery({
    queryKey: ["all-team-members", teamIds.join(",")],
    queryFn: async () => {
      if (teamIds.length === 0) return [];
      const { data } = await supabase.from("team_members").select("team_id, user_id");
      return data || [];
    },
    enabled: teamIds.length > 0,
  });

  const enrichedTeams: TeamWithCount[] = teams.map((t) => {
    const members = memberData.filter((m) => m.team_id === t.id);
    return {
      ...t,
      memberCount: members.length + 1, // +1 for captain
      isMember: !!user && (t.captain_id === user.id || members.some((m) => m.user_id === user.id)),
    };
  });

  const filtered = enrichedTeams.filter((t) => {
    if (categoryFilter !== "all" && (t as any).category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const myTeams = enrichedTeams.filter((t) => t.isMember);

  const skillLabel = (s: string) => {
    if (s === "advanced") return "Pro";
    if (s === "intermediate") return "Intermediate";
    return "Beginner";
  };

  const skillColor = (s: string) => {
    if (s === "advanced") return "bg-destructive/10 text-destructive";
    if (s === "intermediate") return "bg-primary/10 text-primary";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Fishing Teams</h1>
          <p className="text-sm text-muted-foreground">{enrichedTeams.length} teams competing</p>
        </div>
        <Button onClick={() => navigate("/app/teams/new")} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      {/* My Teams */}
      {myTeams.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">My Teams</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {myTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => navigate(`/app/teams/${team.id}`)}
                className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 text-left hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate">{team.name}</p>
                    <Badge className={`text-[10px] border-0 ${skillColor(team.skill_level)}`}>{skillLabel(team.skill_level)}</Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{team.memberCount} members</span>
                  {team.captain_id === user?.id && (
                    <span className="flex items-center gap-1 text-primary"><Crown className="h-3 w-3" />Captain</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search teams..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Tabs value={skillFilter} onValueChange={setSkillFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="advanced">Pro</TabsTrigger>
            <TabsTrigger value="intermediate">Mid</TabsTrigger>
            <TabsTrigger value="beginner">Beginner</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No teams found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search or create your own team</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((team) => (
            <button
              key={team.id}
              onClick={() => navigate(`/app/teams/${team.id}`)}
              className="rounded-xl border bg-card p-5 text-left hover:bg-muted/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {team.logo_url ? (
                    <img src={team.logo_url} alt={team.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    team.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <Badge className={`text-[10px] border-0 ${skillColor(team.skill_level)}`}>{skillLabel(team.skill_level)}</Badge>
              </div>
              <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{team.name}</h3>
              {team.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{team.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />{team.memberCount} members
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
