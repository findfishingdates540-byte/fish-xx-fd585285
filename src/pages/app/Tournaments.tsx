import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  Trophy,
  DollarSign,
  Award,
  Users,
  Clock,
  Swords,
  Flame,
  Target,
  ArrowRight,
  CalendarDays,
  Users2,
} from "lucide-react";
import { toast } from "sonner";

type TabValue = "live" | "registration" | "completed";

interface TournamentRow {
  id: string;
  title: string;
  description: string | null;
  format: string;
  scoring_method: string;
  seeding_method: string;
  status: string;
  start_date: string;
  end_date: string | null;
  max_participants: number;
  entry_fee: number;
  entry_fee_enabled: boolean;
  prize_type: string;
  prize_description: string | null;
  created_by: string;
}

interface EnrichedTournament extends TournamentRow {
  participantCount: number;
  prizePool: number;
  topTeams: { teamId: string; name: string; logo: string | null; rank: number }[];
  isJoined: boolean;
}

const formatLabel = (f: string) =>
  f === "single_elimination" ? "Single Elim" : f === "double_elimination" ? "Double Elim" : f;

const scoringLabel = (s: string) => {
  switch (s) {
    case "biggest_catch": return "Biggest Catch";
    case "total_weight": return "Total Length";
    case "most_catches": return "Most Catches";
    default: return s;
  }
};

export default function Tournaments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabValue>("live");
  const [searchQuery, setSearchQuery] = useState("");
  const [registerForId, setRegisterForId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // All tournaments
  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["tournaments-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("banner_url,created_at,created_by,creator_team_id,current_round,description,end_date,entry_fee,entry_fee_enabled,format,id,is_admin_funded,is_junior_only,max_participants,prize_description,prize_type,registration_end,registration_start,scoring_method,seeding_method,start_date,status,title,total_rounds,updated_at,winner_id,winner_team_id")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data || []) as TournamentRow[];
    },
  });

  // All participants for these tournaments
  const { data: participants = [] } = useQuery({
    queryKey: ["tournament-participants-all", tournaments.map((t) => t.id).join(",")],
    queryFn: async () => {
      if (tournaments.length === 0) return [];
      const { data } = await supabase
        .from("tournament_participants")
        .select("*")
        .in("tournament_id", tournaments.map((t) => t.id));
      return data || [];
    },
    enabled: tournaments.length > 0,
  });

  // Resolve teams for participants
  const teamIds = useMemo(
    () => [...new Set(participants.map((p: any) => p.team_id).filter(Boolean))],
    [participants],
  );
  const { data: teamsMap = {} } = useQuery({
    queryKey: ["tournament-teams", teamIds.join(",")],
    queryFn: async () => {
      if (teamIds.length === 0) return {} as Record<string, any>;
      const { data } = await supabase
        .from("fishing_teams")
        .select("id, name, logo_url")
        .in("id", teamIds);
      const map: Record<string, any> = {};
      (data || []).forEach((t: any) => (map[t.id] = t));
      return map;
    },
    enabled: teamIds.length > 0,
  });

  // Teams the current user captains
  const { data: myCaptainedTeams = [] } = useQuery({
    queryKey: ["my-captained-teams", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("fishing_teams")
        .select("id, name, logo_url")
        .eq("captain_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const myTeamIdSet = useMemo(
    () => new Set(myCaptainedTeams.map((t: any) => t.id)),
    [myCaptainedTeams],
  );

  // Enrich tournaments
  const enriched: EnrichedTournament[] = useMemo(() => {
    return tournaments.map((t) => {
      const tParts = participants.filter((p: any) => p.tournament_id === t.id);
      const sorted = [...tParts].sort(
        (a: any, b: any) => (a.seed_number ?? 999) - (b.seed_number ?? 999),
      );
      const topTeams = sorted.slice(0, 3).map((p: any, i) => {
        const team = p.team_id ? teamsMap[p.team_id] : null;
        return {
          teamId: p.team_id || p.user_id,
          name: team?.name || "Team",
          logo: team?.logo_url || null,
          rank: p.seed_number ?? i + 1,
        };
      });

      const prizePool =
        t.entry_fee_enabled && t.prize_type === "cash"
          ? Number(t.entry_fee || 0) * tParts.length
          : 0;

      const isJoined =
        !!user && tParts.some((p: any) => p.team_id && myTeamIdSet.has(p.team_id));

      return {
        ...t,
        participantCount: tParts.length,
        prizePool,
        topTeams,
        isJoined,
      };
    });
  }, [tournaments, participants, teamsMap, user, myTeamIdSet]);

  // Tab + search filter
  const filtered = useMemo(() => {
    let list = enriched;
    if (tab === "live") list = list.filter((t) => t.status === "in_progress");
    else if (tab === "registration")
      list = list.filter((t) => ["draft", "registration", "seeding"].includes(t.status));
    else list = list.filter((t) => ["completed", "cancelled"].includes(t.status));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [enriched, tab, searchQuery]);

  // My stats
  const myStats = useMemo(() => {
    if (!user) return { active: 0, purses: 0, bestSeed: null as number | null };
    const myParts = participants.filter(
      (p: any) => p.team_id && myTeamIdSet.has(p.team_id),
    );
    const liveIds = enriched.filter((t) => t.status === "in_progress").map((t) => t.id);
    const active = myParts.filter((p: any) => liveIds.includes(p.tournament_id)).length;
    const purses = enriched
      .filter((t) => myParts.some((p: any) => p.tournament_id === t.id))
      .reduce((sum, t) => sum + t.prizePool, 0);
    const seeds = myParts.map((p: any) => p.seed_number).filter(Boolean) as number[];
    const bestSeed = seeds.length > 0 ? Math.min(...seeds) : null;
    return { active, purses, bestSeed };
  }, [user, participants, enriched, myTeamIdSet]);

  const joinMutation = useMutation({
    mutationFn: async ({ tournamentId, teamId }: { tournamentId: string; teamId: string }) => {
      if (!user) throw new Error("Login required");
      if (!teamId) throw new Error("Select a team");

      const tour = tournaments.find((t) => t.id === tournamentId);
      const requiresPayment =
        tour?.entry_fee_enabled && tour?.prize_type === "cash" && Number(tour?.entry_fee) > 0;

      if (requiresPayment) {
        const isInIframe = window.self !== window.top;
        const pendingTab = isInIframe ? window.open("about:blank", "_blank") : null;
        const { data, error } = await supabase.functions.invoke("tournament-checkout", {
          body: { tournamentId, teamId },
        });
        if (error || !data?.url) {
          if (pendingTab) pendingTab.close();
          throw new Error(error?.message || "Failed to start checkout");
        }
        if (pendingTab) pendingTab.location.href = data.url;
        else window.location.href = data.url;
        return;
      }

      const { error } = await supabase
        .from("tournament_participants")
        .insert({ tournament_id: tournamentId, user_id: user.id, team_id: teamId, has_paid: true } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Your team is registered!");
      setRegisterForId(null);
      setSelectedTeamId("");
      queryClient.invalidateQueries({ queryKey: ["tournament-participants-all"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleRegisterClick = (tournamentId: string) => {
    if (myCaptainedTeams.length === 0) {
      toast.error("Only team captains can register. Create a team first.");
      navigate("/app/teams");
      return;
    }
    if (myCaptainedTeams.length === 1) {
      joinMutation.mutate({ tournamentId, teamId: myCaptainedTeams[0].id });
      return;
    }
    setSelectedTeamId(myCaptainedTeams[0].id);
    setRegisterForId(tournamentId);
  };

  const rankLabel = (r: number) => {
    if (r === 1) return <span className="sb-gold font-bold text-xs w-7">#1</span>;
    if (r === 2) return <span className="text-slate-300 font-bold text-xs w-7">#2</span>;
    if (r === 3) return <span className="text-amber-700 font-bold text-xs w-7">#3</span>;
    return <span className="sb-text-muted text-xs w-7">#{r}</span>;
  };

  return (
    <div className="scoreboard-hub pb-24 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 md:px-6 pt-6 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-xs sb-text-muted mt-1">
            Bracket-style team competitions · {tournaments.length.toLocaleString()} events
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sb-text-muted z-10" />
            <Input
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 sb-input"
            />
          </div>
          <button
            onClick={() => navigate("/app/tournaments/new")}
            className="inline-flex items-center justify-center gap-1.5 shrink-0 h-9 px-4 rounded-md sb-bg-cyan font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Create Tournament
          </button>
        </div>
      </div>

      {/* Teams-only notice */}
      <div className="mx-4 md:mx-6 mb-6 sb-card p-3 flex items-start gap-2 text-xs sb-text-muted">
        <Users2 className="h-4 w-4 sb-cyan mt-0.5 shrink-0" />
        <p>
          Tournaments are <span className="font-semibold text-white">team-based</span>. Only team
          captains can register a team. Need a team?{" "}
          <button onClick={() => navigate("/app/teams")} className="sb-cyan font-semibold hover:underline">
            Create one
          </button>
          .
        </p>
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 px-4 md:px-6 mb-6">
        {[
          { icon: Clock, label: "My Active", value: `${myStats.active} ${myStats.active === 1 ? "Event" : "Events"}`, accent: "cyan" },
          { icon: DollarSign, label: "Total Purses", value: `$${myStats.purses.toLocaleString()}`, accent: "cyan" },
          { icon: Award, label: "Best Seed", value: myStats.bestSeed ? `#${myStats.bestSeed}` : "—", accent: "gold" },
        ].map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className="sb-card p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3">
            <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0 ${accent === "gold" ? "bg-[hsl(var(--sb-gold)/0.15)]" : "bg-[hsl(var(--sb-cyan)/0.15)]"}`}>
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${accent === "gold" ? "sb-gold" : "sb-cyan"}`} />
            </div>
            <div className="text-center sm:text-left min-w-0">
              <p className="text-[9px] sm:text-[10px] sb-text-muted uppercase tracking-widest font-semibold">{label}</p>
              <p className="text-sm sm:text-lg font-bold truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-6 mb-6">
        <div className="inline-flex sb-card-soft p-0.5 gap-0.5">
          {[
            { key: "live", label: "Live Now", icon: <Flame className="h-3.5 w-3.5" /> },
            { key: "registration", label: "Registration" },
            { key: "completed", label: "Completed" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as TabValue)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === key ? "sb-bg-cyan font-semibold" : "sb-text-muted hover:text-white"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tournament Cards */}
      <div className="px-4 md:px-6">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[300px] rounded-xl bg-[hsl(var(--sb-surface-2))]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Swords className="h-12 w-12 mx-auto sb-text-muted opacity-30 mb-3" />
            <p className="font-medium mb-1">No {tab === "live" ? "live" : tab} tournaments</p>
            <p className="text-sm sb-text-muted">
              {tab === "live" ? "Check registration or create one!" : "Check back later for new tournaments."}
            </p>
          </div>
        ) : tab === "live" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map((t) => (
              <LiveTournamentCard
                key={t.id}
                tournament={t}
                rankLabel={rankLabel}
                onOpen={() => navigate(`/app/tournaments/${t.id}`)}
              />
            ))}
          </div>
        ) : tab === "registration" ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg">Open for Registration</h2>
                <p className="text-xs sb-text-muted">Lock your team in before brackets are seeded</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((t) => (
                <RegistrationTournamentCard
                  key={t.id}
                  tournament={t}
                  onRegister={() => handleRegisterClick(t.id)}
                  onOpen={() => navigate(`/app/tournaments/${t.id}`)}
                  joining={joinMutation.isPending}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <CompletedTournamentCard
                key={t.id}
                tournament={t}
                rankLabel={rankLabel}
                onOpen={() => navigate(`/app/tournaments/${t.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* CTA Banner */}
      <div className="mx-4 md:mx-6 mt-8 sb-card p-6 sm:p-8 md:p-10 text-center bg-gradient-to-br from-[hsl(var(--sb-surface))] via-[hsl(var(--sb-cyan)/0.06)] to-transparent">
        <h2 className="text-lg sm:text-xl font-bold mb-2">Run your own tournament</h2>
        <p className="text-xs sm:text-sm sb-text-muted max-w-md mx-auto mb-4 sm:mb-5">
          Set up brackets, seeding and elimination rounds for your fishing club. Cash or
          gift-card prizes, single or double elimination.
        </p>
        <button
          onClick={() => navigate("/app/tournaments/new")}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg sb-bg-cyan font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          Host a Tournament
        </button>
      </div>

      {/* Team picker dialog (when user captains 2+ teams) */}
      <Dialog
        open={!!registerForId}
        onOpenChange={(o) => {
          if (!o) {
            setRegisterForId(null);
            setSelectedTeamId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register a team</DialogTitle>
            <DialogDescription>
              Pick which of your teams will compete in this tournament.
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a team" />
            </SelectTrigger>
            <SelectContent>
              {myCaptainedTeams.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              onClick={() =>
                registerForId &&
                joinMutation.mutate({ tournamentId: registerForId, teamId: selectedTeamId })
              }
              disabled={!selectedTeamId || joinMutation.isPending}
            >
              {joinMutation.isPending ? "Registering…" : "Confirm Registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Live Tournament Card ─── */
function LiveTournamentCard({
  tournament,
  rankLabel,
  onOpen,
}: {
  tournament: EnrichedTournament;
  rankLabel: (r: number) => React.ReactNode;
  onOpen: () => void;
}) {
  return (
    <div className="sb-card overflow-hidden">
      {/* Top section */}
      <div className="relative h-36 bg-gradient-to-br from-[hsl(var(--sb-surface-2))] to-[hsl(var(--sb-surface))] p-4 flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sb-surface))] via-[hsl(var(--sb-surface)/0.5)] to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500 text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Bracket Live
          </span>
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[hsl(var(--sb-surface)/0.8)] backdrop-blur-sm border sb-border sb-cyan">
            {formatLabel(tournament.format)}
          </span>
        </div>
        <div className="absolute top-3 right-3 text-right">
          <span className="text-[10px] font-semibold sb-cyan uppercase tracking-widest">
            Scoring
          </span>
          <p className="text-xs font-bold mt-0.5">{scoringLabel(tournament.scoring_method)}</p>
        </div>
        <div className="relative">
          <h3 className="font-bold text-lg text-white">{tournament.title}</h3>
          {tournament.description && (
            <p className="text-xs sb-text-muted truncate">{tournament.description}</p>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">
                Top Seeds
              </p>
              <button
                onClick={onOpen}
                className="text-[10px] sb-cyan font-semibold hover:underline"
              >
                View Bracket
              </button>
            </div>
            <div className="space-y-2">
              {tournament.topTeams.length === 0 ? (
                <p className="text-xs sb-text-muted py-2">No teams yet</p>
              ) : (
                tournament.topTeams.map((entry) => (
                  <div key={entry.teamId} className="flex items-center gap-2">
                    {rankLabel(entry.rank)}
                    <Avatar className="h-6 w-6 ring-1 ring-[hsl(var(--sb-border))]">
                      <AvatarImage src={entry.logo || ""} />
                      <AvatarFallback className="text-[9px] bg-[hsl(var(--sb-surface-2))]">
                        {entry.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium truncate flex-1">{entry.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 pt-3 sm:pt-0 border-t sb-border sm:border-t-0 shrink-0">
            {tournament.prizePool > 0 && (
              <div className="text-left sm:text-right">
                <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">
                  Prize Pool
                </p>
                <p className="text-xl sm:text-2xl font-bold sb-gold">
                  ${tournament.prizePool.toLocaleString()}
                </p>
              </div>
            )}
            <div className="text-left sm:text-right">
              <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">
                Teams
              </p>
              <p className="text-sm font-bold">
                {tournament.participantCount}
                {tournament.max_participants && (
                  <span className="sb-text-muted font-normal">/{tournament.max_participants}</span>
                )}
              </p>
              <div className="w-20 h-1 bg-[hsl(var(--sb-surface-2))] rounded-full mt-1">
                <div
                  className="h-full bg-[hsl(var(--sb-cyan))] rounded-full"
                  style={{
                    width: `${Math.min(100, (tournament.participantCount / tournament.max_participants) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <button
              onClick={onOpen}
              className="px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider sb-bg-cyan hover:opacity-90 transition-opacity"
            >
              View Bracket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Registration Tournament Card ─── */
function RegistrationTournamentCard({
  tournament,
  onRegister,
  onOpen,
  joining,
}: {
  tournament: EnrichedTournament;
  onRegister: () => void;
  onOpen: () => void;
  joining: boolean;
}) {
  const startDate = new Date(tournament.start_date);
  const typeBadgeClass =
    tournament.format === "single_elimination"
      ? "sb-bg-cyan"
      : "bg-violet-500 text-white";

  return (
    <div className="sb-card overflow-hidden group hover:border-[hsl(var(--sb-cyan))] transition-colors">
      <div className="relative h-28 bg-gradient-to-br from-[hsl(var(--sb-surface-2))] to-[hsl(var(--sb-surface))] p-3 flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sb-surface))] via-[hsl(var(--sb-surface)/0.4)] to-transparent" />
        <span
          className={`absolute top-3 left-3 inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${typeBadgeClass}`}
        >
          {formatLabel(tournament.format)}
        </span>
        <div className="absolute top-3 right-3 rounded-md sb-card-soft bg-[hsl(var(--sb-surface)/0.85)] backdrop-blur-sm px-2 py-1 text-center min-w-[42px]">
          <p className="text-sm font-bold leading-none">
            {startDate.toLocaleDateString("en-US", { day: "2-digit" })}
          </p>
          <p className="text-[9px] sb-cyan uppercase tracking-wider mt-0.5">
            {startDate.toLocaleDateString("en-US", { month: "short" })}
          </p>
        </div>
        <button
          onClick={onOpen}
          className="absolute bottom-3 right-3 text-[10px] sb-cyan font-semibold hover:underline"
        >
          View Details
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-sm mb-1">{tournament.title}</h3>
        <p className="text-xs sb-text-muted flex items-center gap-1 mb-3">
          <Target className="h-3 w-3 sb-cyan" /> {scoringLabel(tournament.scoring_method)}
          <span className="mx-1">·</span>
          <Users className="h-3 w-3" />
          {tournament.participantCount}/{tournament.max_participants} teams
        </p>
        <div className="flex items-center justify-between">
          {tournament.entry_fee_enabled && tournament.prize_type === "cash" && tournament.entry_fee > 0 ? (
            <div>
              <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">
                Entry Fee
              </p>
              <p className="text-sm font-bold sb-gold">${Number(tournament.entry_fee).toFixed(0)}</p>
            </div>
          ) : (
            <div>
              <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">
                Entry
              </p>
              <p className="text-sm font-bold">Free</p>
            </div>
          )}
          <button
            onClick={onRegister}
            disabled={tournament.isJoined || joining}
            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border sb-border transition-colors disabled:opacity-60 ${
              tournament.isJoined
                ? "bg-[hsl(var(--sb-surface-2))] sb-text-muted cursor-not-allowed"
                : "sb-cyan hover:bg-[hsl(var(--sb-cyan)/0.1)]"
            }`}
          >
            {tournament.isJoined ? "Registered" : "Register Team"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Completed Tournament Card ─── */
function CompletedTournamentCard({
  tournament,
  rankLabel,
  onOpen,
}: {
  tournament: EnrichedTournament;
  rankLabel: (r: number) => React.ReactNode;
  onOpen: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className="sb-card p-4 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm truncate">{tournament.title}</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[hsl(var(--sb-surface-2))] sb-text-muted border sb-border shrink-0">
          {tournament.status === "cancelled" ? "Cancelled" : "Completed"}
        </span>
      </div>
      <p className="text-xs sb-text-muted mb-3 flex items-center gap-1">
        <Swords className="h-3 w-3 inline" />
        {formatLabel(tournament.format)}
        <span className="mx-1">·</span>
        <CalendarDays className="h-3 w-3" />
        {new Date(tournament.start_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      <div className="space-y-1.5">
        {tournament.topTeams.length === 0 ? (
          <p className="text-xs sb-text-muted">No teams competed</p>
        ) : (
          tournament.topTeams.map((entry) => (
            <div key={entry.teamId} className="flex items-center gap-2">
              {rankLabel(entry.rank)}
              <Avatar className="h-5 w-5">
                <AvatarImage src={entry.logo || ""} />
                <AvatarFallback className="text-[8px] bg-[hsl(var(--sb-surface-2))]">
                  {entry.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs truncate flex-1">{entry.name}</span>
            </div>
          ))
        )}
      </div>
      {tournament.prizePool > 0 && (
        <p className="text-xs sb-text-muted mt-3 pt-3 border-t sb-border">
          Prize Pool:{" "}
          <span className="font-bold sb-gold">${tournament.prizePool.toLocaleString()}</span>
        </p>
      )}
    </div>
  );
}
