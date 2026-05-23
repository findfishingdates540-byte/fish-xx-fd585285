import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTournamentMatchAlerts } from "@/hooks/use-tournament-match-alerts";
import { formatPrizeDescription } from "@/lib/utils";
import { BracketConnectors } from "@/components/tournaments/BracketConnectors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Trophy,
  Users,
  DollarSign,
  Swords,
  CalendarDays,
  Clock,
  Target,
  Copy,
  CheckCircle,
  Users2,
  Medal,
  Crown,
  ChevronDown,
  XCircle,
  Fish,
  CalendarClock,
  Zap,
  ChevronRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { LogCompetitionCatchModal } from "@/components/competition/LogCompetitionCatchModal";
import { format } from "date-fns";

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [teamsView, setTeamsView] = useState<"overall" | "round">("overall");
  const [logCatchOpen, setLogCatchOpen] = useState(false);
  const [teamsRoundId, setTeamsRoundId] = useState<string>("");
  const [expandedMvp, setExpandedMvp] = useState<string | null>(null);

  useTournamentMatchAlerts(id);

  // Refs for bracket connector positioning
  const winnersBracketRef = useRef<HTMLDivElement>(null);
  const losersBracketRef = useRef<HTMLDivElement>(null);
  const matchupNodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const setMatchupNode = (id: string) => (el: HTMLElement | null) => {
    if (el) matchupNodeRefs.current.set(id, el);
    else matchupNodeRefs.current.delete(id);
  };
  const getMatchupNode = (id: string) => matchupNodeRefs.current.get(id) ?? null;

  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["tournament-participants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_participants")
        .select("*")
        .eq("tournament_id", id!)
        .order("seed_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: profiles = {} } = useQuery({
    queryKey: ["tournament-participant-profiles", id],
    queryFn: async () => {
      if (participants.length === 0) return {};
      const ids = participants.map((p: any) => p.user_id);
      const { data, error } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos")
        .in("id", ids);
      if (error) throw error;
      const map: Record<string, any> = {};
      data.forEach((p: any) => (map[p.id] = p));
      return map;
    },
    enabled: participants.length > 0,
  });

  // Resolve team info for participants (tournaments are team-based)
  const { data: teamMap = {} } = useQuery({
    queryKey: ["tournament-participant-teams", id, participants.map((p: any) => p.team_id).filter(Boolean).join(",")],
    queryFn: async () => {
      const teamIds = participants.map((p: any) => p.team_id).filter(Boolean);
      if (teamIds.length === 0) return {} as Record<string, any>;
      const { data, error } = await supabase
        .from("fishing_teams")
        .select("id, name, logo_url")
        .in("id", teamIds);
      if (error) throw error;
      const map: Record<string, any> = {};
      (data || []).forEach((t: any) => (map[t.id] = t));
      return map;
    },
    enabled: participants.length > 0,
  });

  // Teams the current user is captain of
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

  const { data: rounds = [] } = useQuery({
    queryKey: ["tournament-rounds", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_rounds")
        .select("*")
        .eq("tournament_id", id!)
        .order("round_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: matchups = [] } = useQuery({
    queryKey: ["tournament-matchups", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_matchups")
        .select("*")
        .eq("tournament_id", id!)
        .order("matchup_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Team leaderboard (per-tournament)
  const { data: teamLeaderboard = [] } = useQuery({
    queryKey: ["tournament-team-leaderboard", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_team_leaderboard" as any)
        .select("*")
        .eq("tournament_id", id!)
        .order("total_score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // MVP leaderboard (top individuals)
  const { data: mvpLeaderboard = [] } = useQuery({
    queryKey: ["tournament-mvp-leaderboard", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_mvp_leaderboard" as any)
        .select("*")
        .eq("tournament_id", id!)
        .order("total_score", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // My-team contributions
  const { data: myTeamContributions = [] } = useQuery({
    queryKey: ["tournament-my-team-contributions", id, user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Find registered team for current user (captain or member)
      const captainTeamIds = (myCaptainedTeams || []).map((t: any) => t.id);
      const myEntry = participants.find(
        (p: any) => p.user_id === user.id || (p.team_id && captainTeamIds.includes(p.team_id)),
      );
      const teamIdForView = (myEntry as any)?.team_id;
      if (!teamIdForView) return [];
      const { data, error } = await supabase
        .from("tournament_member_contributions" as any)
        .select("*")
        .eq("tournament_id", id!)
        .eq("team_id", teamIdForView)
        .order("score_contribution", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && !!user && participants.length > 0,
  });

  // Per-round team scores (powers the "By round" filter in the Teams tab)
  const { data: teamRoundScores = [] } = useQuery({
    queryKey: ["tournament-team-round-scores", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_team_round_scores" as any)
        .select("*")
        .eq("tournament_id", id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Per-matchup MVPs (powers the MVPs tab)
  const { data: matchupMvps = [] } = useQuery({
    queryKey: ["tournament-matchup-mvps", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_matchup_mvps" as any)
        .select("*")
        .eq("tournament_id", id!)
        .order("round_number", { ascending: false })
        .order("score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // On-demand catch log for an expanded MVP row
  const { data: expandedMvpCatches = [] } = useQuery({
    queryKey: ["mvp-catches", expandedMvp],
    queryFn: async () => {
      if (!expandedMvp) return [];
      const mvp = (matchupMvps as any[]).find((m: any) => m.matchup_id === expandedMvp);
      if (!mvp) return [];
      const round = (rounds as any[]).find((r: any) => r.id === mvp.round_id);
      if (!round) return [];
      const { data, error } = await supabase
        .from("catches")
        .select("id, species_name, weight_lbs, length_in, caught_at, photos, cover_photo_url")
        .eq("user_id", mvp.user_id)
        .gte("caught_at", round.start_date)
        .lte("caught_at", round.end_date)
        .order("weight_lbs", { ascending: false, nullsFirst: false })
        .limit(25);
      if (error) throw error;
      return data || [];
    },
    enabled: !!expandedMvp,
  });

  // Fetch prize payout for current user
  const { data: myPayout } = useQuery({
    queryKey: ["my-tournament-payout", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prize_payouts")
        .select("*")
        .eq("tournament_id", id!)
        .eq("winner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (data && data.status === "pending") {
        await supabase
          .from("prize_payouts")
          .update({ status: "claimed" } as any)
          .eq("id", data.id);
      }
      return data;
    },
    enabled: !!id && !!user && tournament?.status === "completed",
  });

  const myTeamIds = myCaptainedTeams.map((t: any) => t.id);
  const isJoined = participants.some(
    (p: any) => p.user_id === user?.id || (p.team_id && myTeamIds.includes(p.team_id))
  );
  const myParticipantEntry = participants.find(
    (p: any) => p.user_id === user?.id || (p.team_id && myTeamIds.includes(p.team_id))
  );
  const myRegisteredTeamId = myParticipantEntry?.team_id ?? null;

  // Roster for the team currently being picked (or already registered)
  const rosterTeamId = myRegisteredTeamId || selectedTeamId || myCaptainedTeams[0]?.id;
  const { data: rosterMembers = [] } = useQuery({
    queryKey: ["tournament-team-roster", rosterTeamId],
    queryFn: async () => {
      if (!rosterTeamId) return [] as any[];
      const { data: team } = await supabase
        .from("fishing_teams")
        .select("id, name, logo_url, captain_id")
        .eq("id", rosterTeamId)
        .maybeSingle();
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", rosterTeamId);
      const memberIds = (members || []).map((m: any) => m.user_id);
      const allIds = Array.from(new Set([team?.captain_id, ...memberIds].filter(Boolean))) as string[];
      if (allIds.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos")
        .in("id", allIds);
      return (profs || []).map((p: any) => ({
        ...p,
        is_captain: p.id === team?.captain_id,
      }));
    },
    enabled: !!rosterTeamId,
  });
  const registeredTeamName = myRegisteredTeamId
    ? teamMap[myRegisteredTeamId]?.name ?? myCaptainedTeams.find((t: any) => t.id === myRegisteredTeamId)?.name
    : null;

  const canJoin = tournament?.status === "registration" && !isJoined;
  const requiresPayment =
    !!tournament?.entry_fee_enabled &&
    Number(tournament?.entry_fee) > 0 &&
    tournament?.prize_type === "cash";

  const joinMutation = useMutation({
    mutationFn: async (teamId: string) => {
      if (!user || !id) throw new Error("Not logged in");
      if (!teamId) throw new Error("Select a team");
      const { error } = await supabase
        .from("tournament_participants")
        .insert({ tournament_id: id, user_id: user.id, team_id: teamId, has_paid: true } as any);
      if (error) {
        // Friendly duplicate detection
        const msg = error.message || "";
        if (error.code === "23505" || /duplicate|unique/i.test(msg)) {
          throw new Error("This team is already registered for this tournament.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Your team is registered!");
      setTeamPickerOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tournament-participants", id] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not register team"),
  });

  const handleRegister = async () => {
    if (myCaptainedTeams.length === 0) {
      toast.error("Only team captains can register a team. Create a team or ask your captain to register.");
      navigate("/app/teams");
      return;
    }
    const pickTeam = () => {
      if (myCaptainedTeams.length === 1) return myCaptainedTeams[0].id;
      setSelectedTeamId(myCaptainedTeams[0].id);
      setTeamPickerOpen(true);
      return null;
    };
    if (!requiresPayment) {
      const teamId = pickTeam();
      if (teamId) joinMutation.mutate(teamId);
      return;
    }
    // For paid tournaments, require a single team selection up front
    if (myCaptainedTeams.length > 1) {
      setSelectedTeamId(myCaptainedTeams[0].id);
      setTeamPickerOpen(true);
      return;
    }
    setCheckoutLoading(true);
    try {
      const isInIframe = window.self !== window.top;
      const pendingTab = isInIframe ? window.open("about:blank", "_blank") : null;
      const { data, error } = await supabase.functions.invoke("tournament-checkout", {
        body: { tournamentId: id, teamId: myCaptainedTeams[0].id },
      });
      if (error) {
        if (pendingTab) pendingTab.close();
        throw error;
      }
      const url = data?.url as string | undefined;
      if (!url) {
        if (pendingTab) pendingTab.close();
        throw new Error("No checkout URL returned");
      }
      if (pendingTab) pendingTab.location.href = url;
      else window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message || "Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Optimistic confirmation on ?payment=success
  useEffect(() => {
    const status = searchParams.get("payment");
    if (status === "success") {
      toast.success("Payment received — you're registered!");
      queryClient.invalidateQueries({ queryKey: ["tournament-participants", id] });
      searchParams.delete("payment");
      setSearchParams(searchParams, { replace: true });
    } else if (status === "cancelled") {
      toast.info("Checkout cancelled");
      searchParams.delete("payment");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, id, queryClient, setSearchParams]);

  const formatLabel = (f: string) =>
    f === "single_elimination" ? "Single Elimination" : "Double Elimination";

  const scoringLabel = (s: string) => {
    switch (s) {
      case "biggest_catch": return "Biggest Catch";
      case "total_weight": return "Total Weight";
      case "most_catches": return "Most Catches";
      default: return s;
    }
  };

  const seedingLabel = (s: string) => {
    switch (s) {
      case "random": return "Random";
      case "ranked": return "Ranked";
      case "manual": return "Manual";
      default: return s;
    }
  };

  // Group matchups by round
  const roundMatchups = useMemo(() => {
    const map: Record<string, any[]> = {};
    matchups.forEach((m: any) => {
      if (!map[m.round_id]) map[m.round_id] = [];
      map[m.round_id].push(m);
    });
    return map;
  }, [matchups]);

  const completedRounds = useMemo(
    () =>
      (rounds as any[]).filter((r: any) =>
        (roundMatchups[r.id] || []).some((m: any) => m.status === "completed"),
      ),
    [rounds, roundMatchups],
  );

  // Current user's registered team in this tournament
  const myTeamId = useMemo(() => {
    if (!user) return null;
    const captainTeamIds = (myCaptainedTeams || []).map((t: any) => t.id);
    const myEntry = participants.find(
      (p: any) => p.user_id === user.id || (p.team_id && captainTeamIds.includes(p.team_id)),
    );
    return (myEntry as any)?.team_id || null;
  }, [user, myCaptainedTeams, participants]);

  // Live (in-progress) matchups
  const liveMatchups = useMemo(
    () =>
      (matchups as any[]).filter(
        (m: any) => m.status === "in_progress" || m.status === "active",
      ),
    [matchups],
  );

  // Next pending matchup for my team
  const nextMatchupForMe = useMemo(() => {
    if (!myTeamId) return null;
    const mine = (matchups as any[]).filter(
      (m: any) =>
        (m.team1_id === myTeamId || m.team2_id === myTeamId) &&
        m.status !== "completed",
    );
    // Sort by round_number ascending using rounds lookup
    const roundOrder: Record<string, number> = {};
    (rounds as any[]).forEach((r: any) => (roundOrder[r.id] = r.round_number));
    mine.sort((a: any, b: any) => (roundOrder[a.round_id] ?? 999) - (roundOrder[b.round_id] ?? 999));
    return mine[0] || null;
  }, [matchups, rounds, myTeamId]);

  const roundById = useMemo(() => {
    const m: Record<string, any> = {};
    (rounds as any[]).forEach((r: any) => (m[r.id] = r));
    return m;
  }, [rounds]);

  const scoringUnit = (s: string) =>
    s === "most_catches" ? "catches" : "lbs";
  // For tournaments, "players" are teams. Resolve via the participant's team_id.
  const participantByUser = useMemo(() => {
    const map: Record<string, any> = {};
    participants.forEach((p: any) => { if (p.user_id) map[p.user_id] = p; });
    return map;
  }, [participants]);

  const getPlayerName = (userId: string | null) => {
    if (!userId) return "TBD";
    const part = participantByUser[userId];
    if (part?.team_id && teamMap[part.team_id]) return teamMap[part.team_id].name;
    const p = profiles[userId];
    return p?.display_name || "Team";
  };

  const getPlayerPhoto = (userId: string | null) => {
    if (!userId) return null;
    const part = participantByUser[userId];
    if (part?.team_id && teamMap[part.team_id]?.logo_url) return teamMap[part.team_id].logo_url;
    const p = profiles[userId];
    return p?.photos?.[0] || null;
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Tournament not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{tournament.title}</h1>
          <Badge
            variant="outline"
            className="text-[10px] capitalize mt-0.5"
          >
            {(tournament.status as string).replace("_", " ")}
          </Badge>
        </div>
        {canJoin && (
          <Button
            size="sm"
            onClick={handleRegister}
            disabled={joinMutation.isPending || checkoutLoading}
          >
            {checkoutLoading ? "Loading…" : requiresPayment ? `Pay $${tournament.entry_fee} & Register Team` : "Register Team"}
          </Button>
        )}
        {isJoined && (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
            Team Registered
          </Badge>
        )}
      </div>

      {isJoined && registeredTeamName && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold">
              Registered as <span className="text-emerald-700 dark:text-emerald-400">{registeredTeamName}</span>
            </p>
          </div>
          {rosterMembers.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {rosterMembers.map((m: any) => (
                <div key={m.id} className="flex items-center gap-1.5 bg-background rounded-full pl-1 pr-2 py-0.5 border">
                  <Avatar className="h-5 w-5"><AvatarImage src={m.photos?.[0]} /><AvatarFallback className="text-[8px]">{m.display_name?.charAt(0)}</AvatarFallback></Avatar>
                  <span className="text-[11px] font-medium">{m.display_name}{m.is_captain && " (C)"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isJoined && tournament.status === "in_progress" && (
        <button
          onClick={() => setLogCatchOpen(true)}
          className="w-full mb-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wider sb-bg-cyan hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Log Catch for Tournament
        </button>
      )}

      {/* Teams-only notice */}
      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
        <Users2 className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
        <p>This is a <span className="font-medium text-foreground">team tournament</span>. Only team captains can register their team to compete.</p>
      </div>

      {/* Info cards */}
      <div className="rounded-xl border bg-card p-4 mb-4 space-y-3">
        {tournament.description && (
          <p className="text-sm text-muted-foreground">{tournament.description}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <InfoItem icon={<Swords className="h-4 w-4" />} label="Format" value={formatLabel(tournament.format as string)} />
          <InfoItem icon={<Target className="h-4 w-4" />} label="Scoring" value={scoringLabel(tournament.scoring_method as string)} />
          <InfoItem icon={<Users className="h-4 w-4" />} label="Players" value={`${participants.length}/${tournament.max_participants}`} />
          <InfoItem icon={<Clock className="h-4 w-4" />} label="Seeding" value={seedingLabel(tournament.seeding_method as string)} />
          <InfoItem icon={<CalendarDays className="h-4 w-4" />} label="Starts" value={format(new Date(tournament.start_date), "MMM d, yyyy")} />
          {tournament.entry_fee > 0 && (
            <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Entry Fee" value={`$${tournament.entry_fee}`} />
          )}
        </div>
        {tournament.prize_description && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Prize</p>
            <p className="text-sm font-medium">{formatPrizeDescription(tournament.prize_description)}</p>
          </div>
        )}
      </div>

      {/* Winner Prize Card */}
      {myPayout && (
        <Card className="p-5 border-accent bg-accent/5 space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-lg">🎉 You Won!</h3>
          </div>
          {myPayout.prize_type === "gift_card" && myPayout.gift_card_code ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{myPayout.prize_description ? formatPrizeDescription(myPayout.prize_description) : "Your gift card prize:"}</p>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                <code className="flex-1 font-mono text-sm font-bold tracking-wider">{myPayout.gift_card_code}</code>
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(myPayout.gift_card_code); toast.success("Code copied!"); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium">Your prize: ${Number(myPayout.prize_amount || 0).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">
                {myPayout.status === "sent" ? (
                  <span className="flex items-center gap-1 text-primary"><CheckCircle className="h-3 w-3" /> Payment has been sent!</span>
                ) : "Your prize is being processed. The organizer will contact you."}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Participants */}
      <div className="rounded-xl border bg-card p-4 mb-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Teams ({participants.length})
        </h2>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No teams registered yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {participants.map((p: any) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={getPlayerPhoto(p.user_id)} />
                  <AvatarFallback className="text-[10px]">
                    {getPlayerName(p.user_id).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{getPlayerName(p.user_id)}</p>
                  {p.seed_number && (
                    <p className="text-[10px] text-muted-foreground">Seed #{p.seed_number}</p>
                  )}
                </div>
                {p.eliminated && (
                  <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30">
                    Out
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team picker dialog */}
      <Dialog open={teamPickerOpen} onOpenChange={setTeamPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register a team</DialogTitle>
            <DialogDescription>Pick which of your teams will compete in this tournament.</DialogDescription>
          </DialogHeader>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger><SelectValue placeholder="Choose a team" /></SelectTrigger>
            <SelectContent>
              {myCaptainedTeams.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTeamId && rosterMembers.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Roster ({rosterMembers.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {rosterMembers.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-1.5 bg-background rounded-full pl-1 pr-2 py-0.5 border">
                    <Avatar className="h-5 w-5"><AvatarImage src={m.photos?.[0]} /><AvatarFallback className="text-[8px]">{m.display_name?.charAt(0)}</AvatarFallback></Avatar>
                    <span className="text-[11px] font-medium">{m.display_name}{m.is_captain && " (C)"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                if (!selectedTeamId) return;
                if (requiresPayment) {
                  setTeamPickerOpen(false);
                  setCheckoutLoading(true);
                  (async () => {
                    try {
                      const isInIframe = window.self !== window.top;
                      const pendingTab = isInIframe ? window.open("about:blank", "_blank") : null;
                      const { data, error } = await supabase.functions.invoke("tournament-checkout", {
                        body: { tournamentId: id, teamId: selectedTeamId },
                      });
                      if (error) { if (pendingTab) pendingTab.close(); throw error; }
                      const url = data?.url as string | undefined;
                      if (!url) { if (pendingTab) pendingTab.close(); throw new Error("No checkout URL returned"); }
                      if (pendingTab) pendingTab.location.href = url;
                      else window.location.href = url;
                    } catch (e: any) {
                      toast.error(e?.message || "Failed to start checkout");
                    } finally {
                      setCheckoutLoading(false);
                    }
                  })();
                } else {
                  joinMutation.mutate(selectedTeamId);
                }
              }}
              disabled={!selectedTeamId || joinMutation.isPending || checkoutLoading}
            >
              {joinMutation.isPending || checkoutLoading ? "Working…" : requiresPayment ? `Pay $${tournament.entry_fee} & Register` : "Confirm Registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs: Bracket / Standings / MVPs / My Team */}
      {/* Next up card */}
      {nextMatchupForMe && (() => {
        const r = roundById[nextMatchupForMe.round_id];
        const opponentId =
          nextMatchupForMe.team1_id === myTeamId ? nextMatchupForMe.team2_id : nextMatchupForMe.team1_id;
        const opponent = opponentId ? teamMap[opponentId] : null;
        return (
          <Link
            to={`/app/tournaments/${id}/matchups/${nextMatchupForMe.id}`}
            className="block mb-3 rounded-xl border border-primary/30 bg-primary/5 p-4 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <CalendarClock className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Next up · {r?.round_name || "Round"}</p>
                <p className="text-sm font-bold truncate">
                  vs {opponent?.name || "TBD"}
                </p>
                {r?.start_date && (
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(r.start_date), "EEE MMM d")}
                    {r.end_date && ` – ${format(new Date(r.end_date), "MMM d")}`}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        );
      })()}

      {/* Live now feed */}
      {liveMatchups.length > 0 && (
        <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> Live
            </span>
            <p className="text-xs font-semibold">{liveMatchups.length} matchup{liveMatchups.length > 1 ? "s" : ""} in progress</p>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-3 px-3 pb-1">
            {liveMatchups.map((m: any) => {
              const t1 = m.team1_id ? teamMap[m.team1_id] : null;
              const t2 = m.team2_id ? teamMap[m.team2_id] : null;
              const r = roundById[m.round_id];
              return (
                <Link
                  key={m.id}
                  to={`/app/tournaments/${id}/matchups/${m.id}`}
                  className="shrink-0 w-56 rounded-lg border bg-background p-2.5 hover:border-primary/50 transition-colors"
                >
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5 truncate">
                    {r?.round_name || "Match"} · #{m.matchup_number}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Avatar className="h-5 w-5"><AvatarImage src={t1?.logo_url} /><AvatarFallback className="text-[8px]">{t1?.name?.charAt(0) || "?"}</AvatarFallback></Avatar>
                      <span className="text-xs font-semibold truncate">{t1?.name || "TBD"}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{Number(m.team1_score || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Avatar className="h-5 w-5"><AvatarImage src={t2?.logo_url} /><AvatarFallback className="text-[8px]">{t2?.name?.charAt(0) || "?"}</AvatarFallback></Avatar>
                      <span className="text-xs font-semibold truncate">{t2?.name || "TBD"}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{Number(m.team2_score || 0)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <Tabs defaultValue="bracket" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-3">
          <TabsTrigger value="bracket" className="text-xs"><Swords className="h-3 w-3 mr-1" />Bracket</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs"><CalendarClock className="h-3 w-3 mr-1" />Schedule</TabsTrigger>
          <TabsTrigger value="standings" className="text-xs"><Trophy className="h-3 w-3 mr-1" />Teams</TabsTrigger>
          <TabsTrigger value="mvp" className="text-xs"><Crown className="h-3 w-3 mr-1" />MVPs</TabsTrigger>
          <TabsTrigger value="myteam" className="text-xs" disabled={myTeamContributions.length === 0}>
            <Users className="h-3 w-3 mr-1" />My Team
          </TabsTrigger>
        </TabsList>

        {/* BRACKET */}
        <TabsContent value="bracket" className="mt-0">
          {rounds.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
              Bracket will appear once seeding is complete.
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle className="h-3 w-3" /> Advancing
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/30">
                  <XCircle className="h-3 w-3" /> Eliminated
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                  <Clock className="h-3 w-3" /> Pending
                </span>
              </div>
              <div className="overflow-x-auto -mx-4 px-4">
                <div ref={winnersBracketRef} className="relative flex gap-6 min-w-max items-stretch">
                  {rounds.filter((r: any) => r.bracket_type === "winners").map((round: any) => {
                    const rMatchups = roundMatchups[round.id] || [];
                    return (
                      <div key={round.id} className="flex flex-col gap-3 min-w-[230px]">
                        <div className="text-center">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{round.round_name}</p>
                          {round.start_date && (
                            <p className="text-[10px] text-muted-foreground/70">
                              {format(new Date(round.start_date), "MMM d")}
                              {round.end_date ? ` – ${format(new Date(round.end_date), "MMM d")}` : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col justify-around flex-1 gap-3">
                          {rMatchups.map((m: any) => (
                            <Link
                              key={m.id}
                              to={`/app/tournaments/${id}/matchups/${m.id}`}
                              data-matchup-id={m.id}
                              ref={setMatchupNode(m.id) as any}
                              className="block hover:opacity-90 transition-opacity"
                            >
                              <MatchupCard
                                matchup={m}
                                roundName={round.round_name}
                                teamMap={teamMap}
                                getPlayerName={getPlayerName}
                                getPlayerPhoto={getPlayerPhoto}
                              />
                            </Link>
                          ))}
                          {rMatchups.length === 0 && (
                            <div className="p-4 rounded-lg border border-dashed text-center text-xs text-muted-foreground">TBD</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <BracketConnectors
                    containerRef={winnersBracketRef}
                    matchups={matchups.filter((m: any) => {
                      const r = (rounds as any[]).find((x) => x.id === m.round_id);
                      return r?.bracket_type === "winners";
                    })}
                    getNodeEl={getMatchupNode}
                    deps={[rounds.length, matchups.length]}
                  />
                </div>
              </div>
              {rounds.some((r: any) => r.bracket_type === "losers") && (
                <div className="mt-6 pt-4 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">Losers Bracket</p>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <div ref={losersBracketRef} className="relative flex gap-6 min-w-max">
                      {rounds.filter((r: any) => r.bracket_type === "losers").map((round: any) => {
                        const rMatchups = roundMatchups[round.id] || [];
                        return (
                          <div key={round.id} className="flex flex-col gap-3 min-w-[230px]">
                            <p className="text-xs font-semibold text-muted-foreground text-center uppercase tracking-wide">{round.round_name}</p>
                            <div className="flex flex-col justify-around flex-1 gap-3">
                              {rMatchups.map((m: any) => (
                                <Link
                                  key={m.id}
                                  to={`/app/tournaments/${id}/matchups/${m.id}`}
                                  data-matchup-id={m.id}
                                  ref={setMatchupNode(m.id) as any}
                                  className="block hover:opacity-90 transition-opacity"
                                >
                                  <MatchupCard
                                    matchup={m}
                                    roundName={round.round_name}
                                    teamMap={teamMap}
                                    getPlayerName={getPlayerName}
                                    getPlayerPhoto={getPlayerPhoto}
                                  />
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      <BracketConnectors
                        containerRef={losersBracketRef}
                        matchups={matchups.filter((m: any) => {
                          const r = (rounds as any[]).find((x) => x.id === m.round_id);
                          return r?.bracket_type === "losers";
                        })}
                        getNodeEl={getMatchupNode}
                        deps={[rounds.length, matchups.length]}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* SCHEDULE */}
        <TabsContent value="schedule" className="mt-0">
          {rounds.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
              Schedule will appear once rounds are created.
            </div>
          ) : (
            <div className="space-y-3">
              {(rounds as any[]).map((r: any) => {
                const rMs = roundMatchups[r.id] || [];
                const isLive = r.status === "active" || r.status === "in_progress";
                const isDone = r.status === "completed";
                return (
                  <div key={r.id} className="rounded-xl border bg-card overflow-hidden">
                    <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{r.round_name}</p>
                        {r.start_date && (
                          <p className="text-[11px] text-muted-foreground">
                            {format(new Date(r.start_date), "EEE MMM d, yyyy")}
                            {r.end_date && ` – ${format(new Date(r.end_date), "MMM d")}`}
                          </p>
                        )}
                      </div>
                      <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${
                        isLive
                          ? "bg-rose-500 text-white border-rose-500"
                          : isDone
                          ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {isLive ? "Live" : isDone ? "Final" : "Upcoming"}
                      </span>
                    </div>
                    {rMs.length === 0 ? (
                      <p className="p-4 text-xs text-muted-foreground text-center">No matchups yet.</p>
                    ) : (
                      <div className="divide-y">
                        {rMs.map((m: any) => {
                          const t1 = m.team1_id ? teamMap[m.team1_id] : null;
                          const t2 = m.team2_id ? teamMap[m.team2_id] : null;
                          return (
                            <Link
                              key={m.id}
                              to={`/app/tournaments/${id}/matchups/${m.id}`}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                            >
                              <span className="text-[10px] text-muted-foreground font-mono w-6">#{m.matchup_number}</span>
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <Avatar className="h-5 w-5"><AvatarImage src={t1?.logo_url} /><AvatarFallback className="text-[8px]">{t1?.name?.charAt(0) || "?"}</AvatarFallback></Avatar>
                                <span className="text-xs font-semibold truncate">{t1?.name || "TBD"}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground uppercase">vs</span>
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <Avatar className="h-5 w-5"><AvatarImage src={t2?.logo_url} /><AvatarFallback className="text-[8px]">{t2?.name?.charAt(0) || "?"}</AvatarFallback></Avatar>
                                <span className="text-xs font-semibold truncate">{t2?.name || "TBD"}</span>
                              </div>
                              {m.status === "completed" ? (
                                <span className="text-xs font-bold tabular-nums">{Number(m.team1_score || 0)}–{Number(m.team2_score || 0)}</span>
                              ) : (m.status === "in_progress" || m.status === "active") ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500"><Zap className="h-3 w-3" /> Live</span>
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TEAM STANDINGS */}
        <TabsContent value="standings" className="mt-0">
          <div className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setTeamsView("overall")}
                className={`px-2.5 py-1 rounded-full border ${teamsView === "overall" ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
              >
                Overall
              </button>
              <button
                onClick={() => {
                  setTeamsView("round");
                  if (!teamsRoundId && completedRounds[0]) setTeamsRoundId(completedRounds[0].id);
                }}
                disabled={completedRounds.length === 0}
                className={`px-2.5 py-1 rounded-full border disabled:opacity-50 ${teamsView === "round" ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
              >
                By round
              </button>
              {teamsView === "round" && (
                <Select value={teamsRoundId} onValueChange={setTeamsRoundId}>
                  <SelectTrigger className="h-7 w-auto text-xs ml-auto"><SelectValue placeholder="Round" /></SelectTrigger>
                  <SelectContent>
                    {completedRounds.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>{r.round_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {teamLeaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No team scores yet.</p>
            ) : teamsView === "overall" ? (
              <div className="space-y-2">
                {teamLeaderboard.map((row: any, idx: number) => (
                  <div key={row.team_id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${idx === 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-muted/30"}`}>
                    <div className="w-7 h-7 rounded-full bg-background border flex items-center justify-center">
                      {idx === 0 ? <Crown className="h-3.5 w-3.5 text-amber-500" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                    </div>
                    <Avatar className="h-8 w-8"><AvatarImage src={row.logo_url} /><AvatarFallback className="text-[10px]">{row.team_name?.charAt(0)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{row.team_name}</p>
                      <p className="text-[10px] text-muted-foreground">{row.catches_count} catches · {row.rounds_won} rounds won</p>
                    </div>
                    {row.eliminated && <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30">Out</Badge>}
                    <p className="text-sm font-bold tabular-nums">{Number(row.total_score).toFixed(1)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(teamRoundScores as any[])
                  .filter((r) => r.round_id === teamsRoundId)
                  .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
                  .map((row: any) => {
                    const team = teamMap[row.team_id];
                    const opp = teamMap[row.opponent_team_id];
                    const won = row.result === "won";
                    const lost = row.result === "lost";
                    return (
                      <div key={`${row.matchup_id}-${row.team_id}`} className={`flex items-center gap-3 p-2.5 rounded-lg border ${won ? "bg-emerald-500/10 border-emerald-500/30" : lost ? "bg-destructive/5 border-destructive/30" : "bg-muted/30"}`}>
                        <Avatar className="h-8 w-8"><AvatarImage src={team?.logo_url} /><AvatarFallback className="text-[10px]">{team?.name?.charAt(0)}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{team?.name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground truncate">vs {opp?.name || "TBD"} · {won ? "Won" : lost ? "Lost" : "Pending"}</p>
                        </div>
                        <p className="text-sm font-bold tabular-nums">{Number(row.score || 0).toFixed(1)}</p>
                      </div>
                    );
                  })}
                {(teamRoundScores as any[]).filter((r) => r.round_id === teamsRoundId).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No scores for this round yet.</p>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* MVP LEADERBOARD */}
        <TabsContent value="mvp" className="mt-0">
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              Winning-team MVP per matchup
            </p>
            {matchupMvps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No completed matchups yet.
              </p>
            ) : (
              matchupMvps.map((row: any) => {
                const isOpen = expandedMvp === row.matchup_id;
                const unit = scoringUnit(tournament.scoring_method as string);
                return (
                  <Collapsible
                    key={row.matchup_id}
                    open={isOpen}
                    onOpenChange={(v) => setExpandedMvp(v ? row.matchup_id : null)}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition">
                        <Badge variant="outline" className="text-[9px] shrink-0">{row.round_name}</Badge>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={row.photos?.[0]} />
                          <AvatarFallback className="text-[10px]">{row.display_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-semibold truncate flex items-center gap-1">
                            <Medal className="h-3 w-3 text-amber-500" />
                            {row.display_name || "Unknown"}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {row.team_name} · {row.catches_count} catches
                          </p>
                        </div>
                        <p className="text-sm font-bold tabular-nums">
                          {Number(row.score || 0).toFixed(1)} <span className="text-[9px] text-muted-foreground">{unit}</span>
                        </p>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 ml-4 pl-3 border-l-2 border-amber-500/30 space-y-1.5">
                        {expandedMvpCatches.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">No catches recorded in window.</p>
                        ) : (
                          expandedMvpCatches.map((c: any) => (
                            <div key={c.id} className="flex items-center gap-2 text-xs">
                              {c.cover_photo_url || c.photos?.[0] ? (
                                <img src={c.cover_photo_url || c.photos?.[0]} className="h-8 w-8 rounded object-cover" alt="" />
                              ) : (
                                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                  <Fish className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{c.species_name || "Catch"}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {c.caught_at ? format(new Date(c.caught_at), "MMM d, p") : ""}
                                </p>
                              </div>
                              {c.weight_lbs && (
                                <span className="tabular-nums text-muted-foreground">{Number(c.weight_lbs).toFixed(1)} lbs</span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* MY TEAM */}
        <TabsContent value="myteam" className="mt-0">
          <div className="rounded-xl border bg-card p-4">
            {myTeamContributions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">You're not on a registered team in this tournament.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2">Roster contribution</p>
                {myTeamContributions.map((row: any, idx: number) => (
                  <div key={row.user_id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border">
                    <span className="text-xs font-bold w-5 text-center">{idx + 1}</span>
                    <Avatar className="h-8 w-8"><AvatarImage src={row.photos?.[0]} /><AvatarFallback className="text-[10px]">{row.display_name?.charAt(0)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{row.display_name}</p>
                      <p className="text-[10px] text-muted-foreground">{row.catches} catches · {Number(row.total_weight).toFixed(1)} lbs</p>
                    </div>
                    <p className="text-sm font-bold tabular-nums">{Number(row.score_contribution).toFixed(1)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      <LogCompetitionCatchModal
        open={logCatchOpen}
        onOpenChange={setLogCatchOpen}
        competition={{
          kind: "tournament",
          id: tournament.id,
          name: tournament.title,
          speciesId: (tournament as any).species_id ?? null,
        }}
      />
    </div>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2">
    <div className="text-muted-foreground">{icon}</div>
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-medium">{value}</p>
    </div>
  </div>
);

const MatchupCard = ({
  matchup,
  roundName,
  teamMap,
  getPlayerName,
  getPlayerPhoto,
}: {
  matchup: any;
  roundName?: string;
  teamMap: Record<string, any>;
  getPlayerName: (id: string | null) => string;
  getPlayerPhoto: (id: string | null) => string | null;
}) => {
  const isComplete = matchup.status === "completed";
  const t1 = matchup.team1_id ? teamMap[matchup.team1_id] : null;
  const t2 = matchup.team2_id ? teamMap[matchup.team2_id] : null;
  const team1Name = t1?.name || getPlayerName(matchup.player1_id);
  const team2Name = t2?.name || getPlayerName(matchup.player2_id);
  const team1Photo = t1?.logo_url || getPlayerPhoto(matchup.player1_id);
  const team2Photo = t2?.logo_url || getPlayerPhoto(matchup.player2_id);
  const team1Score = matchup.team1_id ? matchup.team1_score : matchup.player1_score;
  const team2Score = matchup.team2_id ? matchup.team2_score : matchup.player2_score;
  const team1Wins = isComplete && (
    (matchup.winner_team_id && matchup.winner_team_id === matchup.team1_id) ||
    (!matchup.winner_team_id && matchup.winner_id === matchup.player1_id)
  );
  const team2Wins = isComplete && (
    (matchup.winner_team_id && matchup.winner_team_id === matchup.team2_id) ||
    (!matchup.winner_team_id && matchup.winner_id === matchup.player2_id)
  );
  const bothPresent = !!(matchup.team1_id && matchup.team2_id);
  const isBye = (matchup.team1_id && !matchup.team2_id) || (!matchup.team1_id && matchup.team2_id);
  const statusPill = isComplete
    ? null
    : isBye
    ? <span className="text-[9px] uppercase tracking-wide text-muted-foreground">BYE</span>
    : bothPresent
    ? <span className="text-[9px] uppercase tracking-wide text-amber-600">Pending</span>
    : <span className="text-[9px] uppercase tracking-wide text-muted-foreground">TBD</span>;

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <TeamRow
        name={team1Name}
        photo={team1Photo}
        score={team1Score}
        isWinner={team1Wins}
        isLoser={isComplete && team2Wins}
        eliminatedLabel={isComplete && team2Wins ? `Out · ${roundName ?? ""}`.trim() : null}
      />
      <div className="h-px bg-border" />
      <TeamRow
        name={team2Name}
        photo={team2Photo}
        score={team2Score}
        isWinner={team2Wins}
        isLoser={isComplete && team1Wins}
        eliminatedLabel={isComplete && team1Wins ? `Out · ${roundName ?? ""}`.trim() : null}
      />
      {statusPill && (
        <div className="px-3 py-1 border-t bg-muted/30 text-center">{statusPill}</div>
      )}
    </div>
  );
};

const TeamRow = ({
  name,
  photo,
  score,
  isWinner,
  isLoser,
  eliminatedLabel,
}: {
  name: string;
  photo: string | null;
  score: number;
  isWinner: boolean;
  isLoser?: boolean;
  eliminatedLabel?: string | null;
}) => (
  <div
    className={`flex items-center gap-2 px-3 py-2 border-l-2 ${
      isWinner
        ? "bg-emerald-500/10 border-emerald-500"
        : isLoser
        ? "bg-destructive/5 border-destructive/60 opacity-70"
        : "border-transparent"
    }`}
  >
    <Avatar className="h-5 w-5">
      <AvatarImage src={photo || undefined} />
      <AvatarFallback className="text-[8px]">{(name || "?").charAt(0)}</AvatarFallback>
    </Avatar>
    <span
      className={`text-xs flex-1 truncate ${
        isWinner ? "font-semibold" : isLoser ? "line-through" : ""
      }`}
    >
      {name || "TBD"}
    </span>
    {eliminatedLabel && (
      <span className="text-[9px] uppercase tracking-wide text-destructive">{eliminatedLabel}</span>
    )}
    <span
      className={`text-xs tabular-nums ${
        isWinner ? "font-bold text-emerald-600" : "text-muted-foreground"
      }`}
    >
      {Number(score || 0)}
    </span>
  </div>
);

export default TournamentDetail;
