import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Trophy,
  DollarSign,
  Award,
  MapPin,
  Users,
  Clock,
  Fish,
  ArrowRight,
  Flame,
  CheckCircle2,
  Bell,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getServerTimeStatus } from "@/hooks/use-server-time";
import { useCountdown } from "@/hooks/use-countdown";
import { localMidnightUtcMs, getUserTimeZone } from "@/lib/timezone";

type TabValue = "live" | "upcoming" | "completed";

interface ChallengeWithDetails {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  species_id: string | null;
  target_species_name: string | null;
  start_date: string;
  end_date: string;
  status: string;
  prizes: any;
  rules: any;
  is_official: boolean;
  created_by: string;
  created_at: string;
  participantCount: number;
  maxParticipants: number | null;
  prizePool: number;
  topEntries: { userId: string; displayName: string; photo: string | null; score: number; rank: number }[];
  isJoined: boolean;
  speciesName: string | null;
  location: string | null;
  bannerUrl: string | null;
}

function CountdownDisplay({ endDate }: { endDate: string }) {
  const { days, hours, minutes, totalMs } = useCountdown(endDate);
  const urgent = totalMs > 0 && totalMs <= 60 * 60 * 1000;
  const { degraded, online } = getServerTimeStatus();
  const cellCls = urgent
    ? "bg-rose-500/15 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded font-bold animate-pulse"
    : "bg-[hsl(var(--sb-surface-2))] sb-cyan border sb-border px-1.5 py-0.5 rounded font-bold";
  return (
    <div className="flex items-center gap-1 text-xs font-mono" title={degraded ? (online ? "Time may be slightly off — reconnecting…" : "Offline — showing last known time") : undefined}>
      {degraded && (
        <span
          aria-label={online ? "Time sync degraded" : "Offline"}
          className={`h-1.5 w-1.5 rounded-full mr-0.5 ${online ? "bg-amber-400" : "bg-amber-500"} animate-pulse`}
        />
      )}
      <span className={cellCls}>{String(days).padStart(2, "0")}d</span>
      <span className="sb-text-muted">:</span>
      <span className={cellCls}>{String(hours).padStart(2, "0")}h</span>
      <span className="sb-text-muted">:</span>
      <span className={cellCls}>{String(minutes).padStart(2, "0")}m</span>
    </div>
  );
}

export default function Challenges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: TabValue = tabParam === "upcoming" || tabParam === "completed" ? tabParam : "live";
  const [tab, setTabState] = useState<TabValue>(initialTab);
  const setTab = (next: TabValue) => {
    setTabState(next);
    const params = new URLSearchParams(searchParams);
    if (next === "live") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  };
  useEffect(() => {
    const t = searchParams.get("tab");
    const v: TabValue = t === "upcoming" || t === "completed" ? t : "live";
    if (v !== tab) setTabState(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch challenges
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["fishing-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fishing_challenges")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all participants
  const { data: participants = [] } = useQuery({
    queryKey: ["challenge-participants-all"],
    queryFn: async () => {
      const challengeIds = challenges.map((c) => c.id);
      if (challengeIds.length === 0) return [];
      const { data } = await supabase
        .from("challenge_participants")
        .select("*")
        .in("challenge_id", challengeIds);
      return data || [];
    },
    enabled: challenges.length > 0,
  });

  // Fetch profiles for top participants
  const participantUserIds = useMemo(() => [...new Set(participants.map((p) => p.user_id))], [participants]);
  const { data: profiles = {} } = useQuery({
    queryKey: ["challenge-profiles", participantUserIds.join(",")],
    queryFn: async () => {
      if (participantUserIds.length === 0) return {};
      const { data } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos")
        .in("id", participantUserIds);
      const map: Record<string, { display_name: string | null; photos: string[] | null }> = {};
      (data || []).forEach((p) => { map[p.id] = p; });
      return map;
    },
    enabled: participantUserIds.length > 0,
  });

  // Fetch the user's saved reminders so "Remind me" buttons hydrate correctly
  const { data: myReminders = [] } = useQuery({
    queryKey: ["challenge-reminders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("challenge_reminders")
        .select("challenge_id")
        .eq("user_id", user.id);
      return (data || []).map((r: any) => r.challenge_id as string);
    },
    enabled: !!user,
  });
  const remindedIds = useMemo(() => new Set(myReminders), [myReminders]);

  const remindMutation = useMutation({
    mutationFn: async ({ challengeId, startDate }: { challengeId: string; startDate: string }) => {
      if (!user) throw new Error("Must be logged in");
      // Fire reminder 1 hour before the challenge start in the user's local timezone.
      // start_date is a DATE column ("YYYY-MM-DD"); interpret it as local midnight
      // in the user's IANA timezone, then subtract one hour.
      const tz = getUserTimeZone();
      const localStartMs = localMidnightUtcMs(startDate, tz);
      const remindAt = new Date(Math.max(Date.now(), localStartMs - 60 * 60 * 1000)).toISOString();
      const { error } = await supabase
        .from("challenge_reminders")
        .insert({ user_id: user.id, challenge_id: challengeId, remind_at: remindAt });
      if (error && error.code !== "23505") throw error; // 23505 = unique violation (already set)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge-reminders", user?.id] });
      toast.success("We'll remind you before it starts");
    },
    onError: (err: any) => toast.error(err.message || "Could not save reminder"),
  });


  // Build enriched challenge data
  const enrichedChallenges: ChallengeWithDetails[] = useMemo(() => {
    return challenges.map((c) => {
      const cParticipants = participants.filter((p) => p.challenge_id === c.id);
      const sorted = [...cParticipants].sort((a, b) => Number(b.score) - Number(a.score));
      const top3 = sorted.slice(0, 3).map((p, i) => ({
        userId: p.user_id,
        displayName: profiles[p.user_id]?.display_name || "Angler",
        photo: profiles[p.user_id]?.photos?.[0] || null,
        score: Number(p.score),
        rank: i + 1,
      }));
      const prizes = c.prizes as any;
      const prizePool = typeof prizes === "object" && prizes?.total ? Number(prizes.total) : 0;
      const maxParticipants = typeof prizes === "object" && prizes?.max_participants ? Number(prizes.max_participants) : null;
      const bannerUrl = typeof prizes === "object" && prizes?.banner_url ? String(prizes.banner_url) : null;

      // Determine status
      const now = new Date();
      const start = new Date(c.start_date);
      const end = new Date(c.end_date);
      let status = c.status;
      if (now >= start && now <= end && status !== "completed") status = "active";
      else if (now < start) status = "upcoming";
      else if (now > end) status = "completed";

      return {
        ...c,
        status,
        participantCount: cParticipants.length,
        maxParticipants,
        prizePool,
        topEntries: top3,
        isJoined: !!user && cParticipants.some((p) => p.user_id === user.id),
        speciesName: c.target_species_name || null,
        location: typeof prizes === "object" && prizes?.location ? String(prizes.location) : null,
        bannerUrl,
      };
    });
  }, [challenges, participants, profiles, user]);

  // Filter by tab + search
  const filtered = useMemo(() => {
    let list = enrichedChallenges;
    if (tab === "live") list = list.filter((c) => c.status === "active");
    else if (tab === "upcoming") list = list.filter((c) => c.status === "upcoming");
    else list = list.filter((c) => c.status === "completed");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        c.speciesName?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [enrichedChallenges, tab, searchQuery]);

  // Counts per tab
  const tabCounts = useMemo(() => ({
    live: enrichedChallenges.filter((c) => c.status === "active").length,
    upcoming: enrichedChallenges.filter((c) => c.status === "upcoming").length,
    completed: enrichedChallenges.filter((c) => c.status === "completed").length,
  }), [enrichedChallenges]);

  // My stats
  const myStats = useMemo(() => {
    if (!user) return { activeChallenges: 0, totalPurses: 0, bestRank: null };
    const myParticipations = participants.filter((p) => p.user_id === user.id);
    const activeChallengeIds = enrichedChallenges.filter((c) => c.status === "active").map((c) => c.id);
    const activeChallenges = myParticipations.filter((p) => activeChallengeIds.includes(p.challenge_id)).length;
    const totalPurses = enrichedChallenges
      .filter((c) => myParticipations.some((p) => p.challenge_id === c.id))
      .reduce((sum, c) => sum + c.prizePool, 0);
    const ranks = myParticipations.map((p) => p.rank).filter(Boolean) as number[];
    const bestRank = ranks.length > 0 ? Math.min(...ranks) : null;
    return { activeChallenges, totalPurses, bestRank };
  }, [user, participants, enrichedChallenges]);

  // Join challenge mutation
  const joinMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user) throw new Error("Must be logged in");

      // Check if challenge requires entry fee
      const ch = challenges.find((c: any) => c.id === challengeId) as any;
      const requiresPayment =
        ch?.entry_fee_enabled && ch?.prize_type === "cash" && Number(ch?.entry_fee) > 0;

      if (requiresPayment) {
        // Open Stripe Checkout (handle iframe popup blockers)
        const isInIframe = window.self !== window.top;
        const pendingTab = isInIframe ? window.open("about:blank", "_blank") : null;

        const { data, error } = await supabase.functions.invoke(
          "fishing-challenge-checkout",
          { body: { challengeId } },
        );
        if (error || !data?.url) {
          if (pendingTab) pendingTab.close();
          throw new Error(error?.message || "Failed to start checkout");
        }
        if (pendingTab) pendingTab.location.href = data.url;
        else window.location.href = data.url;
        return;
      }

      const { error } = await supabase.from("challenge_participants").insert({
        challenge_id: challengeId,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenge-participants-all"] });
      toast.success("Joined challenge!");
    },
    onError: (err) => toast.error(err.message),
  });


  const rankLabel = (r: number) => {
    if (r === 1) return <span className="sb-gold font-bold text-xs w-7">1st</span>;
    if (r === 2) return <span className="text-slate-300 font-bold text-xs w-7">2nd</span>;
    if (r === 3) return <span className="text-amber-700 font-bold text-xs w-7">3rd</span>;
    return <span className="sb-text-muted text-xs w-7">{r}th</span>;
  };

  return (
    <div className="scoreboard-hub pb-24 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 md:px-6 pt-6 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fishing Challenges</h1>
          <p className="text-xs sb-text-muted mt-1">
            Competing with {participantUserIds.length.toLocaleString()} anglers worldwide
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sb-text-muted z-10" />
            <Input
              placeholder="Search challenges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 sb-input"
            />
          </div>
          <button onClick={() => navigate("/app/challenges/new")} className="inline-flex items-center justify-center gap-1.5 shrink-0 h-9 px-4 rounded-md sb-bg-cyan font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
            Create Challenge
          </button>
        </div>
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 px-4 md:px-6 mb-6">
        {[
          { icon: Clock, label: "My Active", value: `${myStats.activeChallenges} ${myStats.activeChallenges === 1 ? "Challenge" : "Challenges"}`, accent: "cyan" },
          { icon: DollarSign, label: "Total Purses", value: `$${myStats.totalPurses.toLocaleString()}`, accent: "cyan" },
          { icon: Award, label: "Current Rank", value: myStats.bestRank ? `#${myStats.bestRank}` : "—", accent: "gold" },
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
        <div className="inline-flex sb-card-soft p-0.5 gap-0.5 max-w-full">
          {[
            { key: "live", label: "Live Now", icon: <Flame className="h-3.5 w-3.5" />, count: tabCounts.live },
            { key: "upcoming", label: "Upcoming", count: tabCounts.upcoming },
            { key: "completed", label: "Completed", count: tabCounts.completed },
          ].map(({ key, label, icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key as TabValue)}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                tab === key ? "sb-bg-cyan font-semibold" : "sb-text-muted hover:text-white"
              }`}
            >
              {icon}
              {label}
              <span className={`ml-0.5 sm:ml-1 inline-flex items-center justify-center min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 rounded-full text-[9px] sm:text-[10px] font-bold ${
                tab === key ? "bg-[hsl(var(--sb-bg)/0.25)] text-white" : "bg-[hsl(var(--sb-surface-2))] sb-text-muted"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Challenge Cards */}
      <div className="px-4 md:px-6">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[320px] rounded-xl bg-[hsl(var(--sb-surface-2))]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 px-4 max-w-md mx-auto">
            {tab === "live" ? (
              <>
                <Flame className="h-12 w-12 mx-auto sb-text-muted opacity-30 mb-3" />
                <p className="font-semibold mb-1">No live challenges right now</p>
                <p className="text-sm sb-text-muted mb-5">
                  Check the Upcoming tab to register, or host your own private event.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setTab("upcoming")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg sb-card-soft text-xs font-semibold hover:border-[hsl(var(--sb-cyan))] transition-colors"
                  >
                    See Upcoming
                  </button>
                  <button
                    onClick={() => navigate("/app/challenges/new")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg sb-bg-cyan text-xs font-bold"
                  >
                    <Plus className="h-3.5 w-3.5" /> Host a Challenge
                  </button>
                </div>
              </>
            ) : tab === "upcoming" ? (
              <>
                <Clock className="h-12 w-12 mx-auto sb-text-muted opacity-30 mb-3" />
                <p className="font-semibold mb-1">Nothing on the schedule yet</p>
                <p className="text-sm sb-text-muted mb-5">
                  New tournaments and weekend derbies appear here as soon as they're announced.
                </p>
                <button
                  onClick={() => navigate("/app/challenges/new")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg sb-bg-cyan text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5" /> Create One
                </button>
              </>
            ) : (
              <>
                <Trophy className="h-12 w-12 mx-auto sb-text-muted opacity-30 mb-3" />
                <p className="font-semibold mb-1">No completed challenges yet</p>
                <p className="text-sm sb-text-muted mb-5">
                  Past winners and final standings will show up here once challenges wrap.
                </p>
                <button
                  onClick={() => setTab("live")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg sb-card-soft text-xs font-semibold hover:border-[hsl(var(--sb-cyan))] transition-colors"
                >
                  Back to Live
                </button>
              </>
            )}
          </div>
        ) : tab === "live" ? (
          /* Live cards - big format */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map((challenge) => (
              <LiveChallengeCard
                key={challenge.id}
                challenge={challenge}
                onJoin={() => joinMutation.mutate(challenge.id)}
                joining={joinMutation.isPending}
                rankLabel={rankLabel}
                onOpen={() => navigate(`/app/challenges/${challenge.id}`)}
              />
            ))}
          </div>
        ) : tab === "upcoming" ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg">Upcoming Challenges</h2>
                <p className="text-xs sb-text-muted">Secure your spot in the next big events</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((challenge) => (
                <UpcomingChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onJoin={() => joinMutation.mutate(challenge.id)}
                  joining={joinMutation.isPending}
                  onOpen={() => navigate(`/app/challenges/${challenge.id}`)}
                  reminded={remindedIds.has(challenge.id)}
                  onRemind={() => remindMutation.mutate({ challengeId: challenge.id, startDate: challenge.start_date })}
                  remindLoading={remindMutation.isPending}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((challenge) => (
              <CompletedChallengeCard key={challenge.id} challenge={challenge} rankLabel={rankLabel} onOpen={() => navigate(`/app/challenges/${challenge.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="mx-4 md:mx-6 mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={() => navigate("/app/leaderboard")} className="sb-card p-5 text-left hover:border-[hsl(var(--sb-cyan))] transition-colors">
          <Trophy className="h-6 w-6 sb-gold mb-2" />
          <p className="font-bold text-sm">Scoreboards Hub</p>
          <p className="text-xs sb-text-muted mt-1">View rankings & top anglers</p>
        </button>
        <button onClick={() => navigate("/app/species")} className="sb-card p-5 text-left hover:border-[hsl(var(--sb-cyan))] transition-colors">
          <Fish className="h-6 w-6 sb-cyan mb-2" />
          <p className="font-bold text-sm">Species Explorer</p>
          <p className="text-xs sb-text-muted mt-1">Browse species & records</p>
        </button>
        <button onClick={() => navigate("/app/catches")} className="sb-card p-5 text-left hover:border-[hsl(var(--sb-cyan))] transition-colors">
          <Award className="h-6 w-6 text-emerald-400 mb-2" />
          <p className="font-bold text-sm">Log a Catch</p>
          <p className="text-xs sb-text-muted mt-1">Submit catches to climb ranks</p>
        </button>
      </div>

      {/* CTA Banner */}
      <div className="mx-4 md:mx-6 mt-8 sb-card p-6 sm:p-8 md:p-10 text-center bg-gradient-to-br from-[hsl(var(--sb-surface))] via-[hsl(var(--sb-cyan)/0.06)] to-transparent">
        <h2 className="text-lg sm:text-xl font-bold mb-2">Don't see a challenge that fits?</h2>
        <p className="text-xs sm:text-sm sb-text-muted max-w-md mx-auto mb-4 sm:mb-5">
          Create your own private challenge for your fishing club or tournament series. Custom species, locations, and scoring rules.
        </p>
        <button onClick={() => navigate("/app/challenges/new")} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg sb-bg-cyan font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity">
          Host a Private Event
        </button>
      </div>
    </div>
  );
}

/* ─── Live Challenge Card ─── */
function LiveChallengeCard({
  challenge,
  onJoin,
  joining,
  rankLabel,
  onOpen,
}: {
  challenge: ChallengeWithDetails;
  onJoin: () => void;
  joining: boolean;
  rankLabel: (r: number) => React.ReactNode;
  onOpen: () => void;
}) {
  return (
    <div onClick={onOpen} className="sb-card overflow-hidden cursor-pointer hover:border-[hsl(var(--sb-cyan))] transition-colors">
      {/* Top section */}
      <div className="relative h-36 bg-gradient-to-br from-[hsl(var(--sb-surface-2))] to-[hsl(var(--sb-surface))] p-4 flex flex-col justify-end overflow-hidden">
        {challenge.bannerUrl && (
          <img src={challenge.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sb-surface))] via-[hsl(var(--sb-surface)/0.5)] to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500 text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            Live
          </span>
          {challenge.speciesName && (
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-[hsl(var(--sb-surface)/0.8)] backdrop-blur-sm border sb-border sb-cyan">
              {challenge.speciesName}
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 text-right">
          <span className="text-[10px] font-semibold sb-cyan uppercase tracking-widest">Ends in</span>
          <div className="mt-0.5">
            <CountdownDisplay endDate={challenge.end_date} />
          </div>
        </div>
        <div className="relative">
          <h3 className="font-bold text-lg text-white">{challenge.title}</h3>
          {challenge.location && (
            <p className="text-xs sb-text-muted flex items-center gap-1">
              <MapPin className="h-3 w-3 sb-cyan" /> {challenge.location}
            </p>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          {/* Leaderboard */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">Top Leaderboard</p>
              <button className="text-[10px] sb-cyan font-semibold hover:underline">View All</button>
            </div>
            <div className="space-y-2">
              {challenge.topEntries.length === 0 ? (
                <p className="text-xs sb-text-muted py-2">No entries yet</p>
              ) : (
                challenge.topEntries.map((entry) => (
                  <div key={entry.userId} className="flex items-center gap-2">
                    {rankLabel(entry.rank)}
                    <Avatar className="h-6 w-6 ring-1 ring-[hsl(var(--sb-border))]">
                      <AvatarImage src={entry.photo || ""} />
                      <AvatarFallback className="text-[9px] bg-[hsl(var(--sb-surface-2))]">{entry.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium truncate flex-1">{entry.displayName}</span>
                    <span className="text-xs font-bold sb-cyan">{entry.score} in</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 pt-3 sm:pt-0 border-t sb-border sm:border-t-0 shrink-0">
            {challenge.prizePool > 0 && (
              <div className="text-left sm:text-right">
                <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">Prize Pool</p>
                <p className="text-xl sm:text-2xl font-bold sb-gold">${challenge.prizePool.toLocaleString()}</p>
              </div>
            )}
            <div className="text-left sm:text-right">
              <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">Participants</p>
              <p className="text-sm font-bold">
                {challenge.participantCount}
                {challenge.maxParticipants && <span className="sb-text-muted font-normal">/{challenge.maxParticipants}</span>}
              </p>
              {challenge.maxParticipants && (
                <div className="w-20 h-1 bg-[hsl(var(--sb-surface-2))] rounded-full mt-1">
                  <div
                    className="h-full bg-[hsl(var(--sb-cyan))] rounded-full"
                    style={{ width: `${Math.min(100, (challenge.participantCount / challenge.maxParticipants) * 100)}%` }}
                  />
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onJoin(); }}
              disabled={challenge.isJoined || joining}
              className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-opacity ${
                challenge.isJoined
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 cursor-not-allowed"
                  : "sb-bg-cyan hover:opacity-90"
              } disabled:opacity-60`}
            >
              {challenge.isJoined ? (<><CheckCircle2 className="h-3.5 w-3.5" />Registered</>) : "Join Challenge"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Upcoming Challenge Card ─── */
function UpcomingChallengeCard({
  challenge,
  onJoin,
  joining,
  onOpen,
  reminded: remindedProp,
  onRemind,
  remindLoading,
}: {
  challenge: ChallengeWithDetails;
  onJoin: () => void;
  joining: boolean;
  onOpen: () => void;
  reminded?: boolean;
  onRemind?: () => void;
  remindLoading?: boolean;
}) {
  const startDate = new Date(challenge.start_date);
  const reminded = !!remindedProp;
  const typeLabel = challenge.is_official ? "Pro Series" : challenge.challenge_type === "most_caught" ? "Casual" : "Team Event";
  const typeBadgeClass = challenge.is_official
    ? "sb-bg-cyan"
    : challenge.challenge_type === "most_caught"
      ? "bg-[hsl(var(--sb-gold))] text-[hsl(var(--sb-bg))]"
      : "bg-violet-500 text-white";

  return (
    <div onClick={onOpen} className="sb-card overflow-hidden group cursor-pointer hover:border-[hsl(var(--sb-cyan))] transition-colors">
      <div className="relative h-28 bg-gradient-to-br from-[hsl(var(--sb-surface-2))] to-[hsl(var(--sb-surface))] p-3 flex flex-col justify-end overflow-hidden">
        {challenge.bannerUrl && (
          <img src={challenge.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sb-surface))] via-[hsl(var(--sb-surface)/0.4)] to-transparent" />
        <span className={`absolute top-3 left-3 inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${typeBadgeClass}`}>
          {typeLabel}
        </span>
        <div className="absolute top-3 right-3 rounded-md sb-card-soft bg-[hsl(var(--sb-surface)/0.85)] backdrop-blur-sm px-2 py-1 text-center min-w-[42px]">
          <p className="text-sm font-bold leading-none">{startDate.toLocaleDateString("en-US", { day: "2-digit" })}</p>
          <p className="text-[9px] sb-cyan uppercase tracking-wider mt-0.5">{startDate.toLocaleDateString("en-US", { month: "short" })}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (reminded) return;
            onRemind?.();
          }}
          disabled={reminded || !!remindLoading}
          className={`absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm transition-colors ${
            reminded
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 cursor-not-allowed"
              : "bg-[hsl(var(--sb-surface)/0.85)] sb-cyan border sb-border hover:bg-[hsl(var(--sb-cyan)/0.15)]"
          }`}
        >
          {reminded ? <BellRing className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
          {reminded ? "Reminder set" : remindLoading ? "Saving…" : "Remind me"}
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-sm mb-1 line-clamp-1">{challenge.title}</h3>
        <p className="text-xs sb-text-muted flex items-center gap-1 mb-3 min-h-[16px] line-clamp-1">
          {(challenge.location || challenge.speciesName) ? (
            <>
              <MapPin className="h-3 w-3 sb-cyan shrink-0" />
              <span className="truncate">{challenge.location || challenge.speciesName}</span>
            </>
          ) : null}
        </p>
        <div className="mb-3 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-[hsl(var(--sb-surface-2))] border sb-border">
          <span className="text-[10px] sb-cyan uppercase tracking-widest font-semibold">Starts in</span>
          <CountdownDisplay endDate={challenge.start_date} />
        </div>
        <div className="flex items-end justify-between gap-3 min-h-[44px]">
          <div>
            <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">Prize Pool</p>
            <p className="text-sm font-bold sb-gold">
              {challenge.prizePool > 0 ? `$${challenge.prizePool.toLocaleString()}` : "—"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(); }}
              className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border sb-border sb-cyan hover:bg-[hsl(var(--sb-cyan)/0.1)] transition-colors"
            >
              Details
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onJoin(); }}
              disabled={challenge.isJoined || joining}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-opacity ${
                challenge.isJoined
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 cursor-not-allowed"
                  : "sb-bg-cyan hover:opacity-90"
              } disabled:opacity-60`}
            >
              {challenge.isJoined ? (<><CheckCircle2 className="h-3.5 w-3.5" />Registered</>) : "Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Completed Challenge Card ─── */
function CompletedChallengeCard({
  challenge,
  rankLabel,
  onOpen,
}: {
  challenge: ChallengeWithDetails;
  rankLabel: (r: number) => React.ReactNode;
  onOpen: () => void;
}) {
  return (
    <div onClick={onOpen} className="sb-card p-4 opacity-90 hover:opacity-100 cursor-pointer hover:border-[hsl(var(--sb-cyan))] transition-all">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">{challenge.title}</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[hsl(var(--sb-surface-2))] sb-text-muted border sb-border">Completed</span>
      </div>
      {challenge.speciesName && (
        <p className="text-xs sb-text-muted mb-3">
          <Fish className="h-3 w-3 inline mr-1" />{challenge.speciesName}
        </p>
      )}
      <div className="space-y-1.5">
        {challenge.topEntries.map((entry) => (
          <div key={entry.userId} className="flex items-center gap-2">
            {rankLabel(entry.rank)}
            <Avatar className="h-5 w-5">
              <AvatarImage src={entry.photo || ""} />
              <AvatarFallback className="text-[8px] bg-[hsl(var(--sb-surface-2))]">{entry.displayName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs truncate flex-1">{entry.displayName}</span>
            <span className="text-xs font-bold sb-cyan">{entry.score} in</span>
          </div>
        ))}
      </div>
      {challenge.prizePool > 0 && (
        <p className="text-xs sb-text-muted mt-3 pt-3 border-t sb-border">
          Prize Pool: <span className="font-bold sb-gold">${challenge.prizePool.toLocaleString()}</span>
        </p>
      )}
    </div>
  );
}
