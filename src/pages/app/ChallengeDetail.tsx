import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, DollarSign, MapPin, Trophy, Users, Fish, Share2, CheckCircle2, ShieldCheck, Activity, Crown, Plus } from "lucide-react";
import { LogCompetitionCatchModal } from "@/components/competition/LogCompetitionCatchModal";
import { ApprovalBadge } from "@/components/competition/ApprovalBadge";
import { getShareBaseUrl } from "@/lib/config";
import { FormattedRules } from "@/lib/format-rules";
import { toast } from "sonner";
import { getServerTimeStatus } from "@/hooks/use-server-time";
import { useCountdown } from "@/hooks/use-countdown";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function timeAgo(date: Date): string {
  const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function scoringSummary(type: string): string {
  switch (type) {
    case "most_caught": return "Most verified catches during the challenge window wins.";
    case "most_species": return "Most distinct verified species during the challenge window wins.";
    case "total_weight": return "Highest cumulative verified weight during the challenge window wins.";
    case "largest_fish":
    default: return "Heaviest single verified catch during the challenge window wins.";
  }
}

function formatChallengeType(type: string): string {
  switch (type) {
    case "most_caught": return "Most Caught";
    case "most_species": return "Most Species";
    case "total_weight": return "Total Weight";
    case "largest_fish":
    default: return "Largest Fish";
  }
}

function Podium({ top3, profiles, formatScore }: { top3: any[]; profiles: Record<string, any>; formatScore: (n: number) => string }) {
  const order = [1, 0, 2]; // 2nd, 1st, 3rd
  const heights = ["h-16", "h-24", "h-12"];
  const accent = ["text-slate-300", "sb-gold", "text-amber-700"];
  return (
    <div className="sb-card p-4">
      <div className="grid grid-cols-3 gap-3 items-end">
        {order.map((idx, i) => {
          const p = top3[idx];
          if (!p) return <div key={i} />;
          const prof = profiles[p.user_id];
          const name = prof?.display_name || "Angler";
          const rank = idx + 1;
          return (
            <div key={p.user_id} className="flex flex-col items-center text-center min-w-0">
              <Avatar className="h-12 w-12 mb-2 ring-2 ring-[hsl(var(--sb-border))]">
                <AvatarImage src={prof?.photos?.[0] || ""} />
                <AvatarFallback className="text-xs bg-[hsl(var(--sb-surface-2))]">{name[0]}</AvatarFallback>
              </Avatar>
              <p className="text-xs font-semibold truncate w-full">{name}</p>
              <p className="text-[11px] sb-cyan font-mono">{formatScore(Number(p.score))}</p>
              <div className={`mt-2 w-full ${heights[i]} rounded-t-md bg-[hsl(var(--sb-surface-2))] flex items-start justify-center pt-2`}>
                <span className={`text-sm font-bold ${accent[i]}`}>#{rank}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: any;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; variant?: "primary" | "ghost" };
}) {
  return (
    <div className="text-center py-10 px-4">
      <div className="mx-auto mb-3 inline-flex items-center justify-center h-12 w-12 rounded-full bg-[hsl(var(--sb-surface-2))] ring-1 ring-[hsl(var(--sb-border))]">
        <Icon className="h-5 w-5 sb-text-muted" />
      </div>
      <p className="text-sm font-semibold mb-1">{title}</p>
      {description && (
        <p className="text-xs sb-text-muted max-w-xs mx-auto leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={
            action.variant === "ghost"
              ? "mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider sb-text-muted hover:text-white border sb-border hover:bg-[hsl(var(--sb-surface-2))] transition-colors"
              : "mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider sb-bg-cyan hover:opacity-90 transition-opacity"
          }
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle Stripe checkout return (?payment=success | ?payment=cancelled)
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment) return;
    if (payment === "success") {
      toast.success("Payment confirmed — you're registered!");
      qc.invalidateQueries({ queryKey: ["fishing-challenge-participants", id] });
      qc.invalidateQueries({ queryKey: ["fishing-challenge", id] });
    } else if (payment === "cancelled") {
      toast.error("Payment cancelled — you were not registered.");
    }
    // Clean the query param from the URL
    const next = new URLSearchParams(searchParams);
    next.delete("payment");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: challenge, isLoading } = useQuery({
    queryKey: ["fishing-challenge", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fishing_challenges")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["fishing-challenge-participants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_participants")
        .select("*")
        .eq("challenge_id", id!)
        .order("score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const userIds = [...new Set(participants.map((p) => p.user_id))];
  const { data: profiles = {} } = useQuery({
    queryKey: ["fishing-challenge-profiles", id, userIds.join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos")
        .in("id", userIds);
      const map: Record<string, any> = {};
      (data || []).forEach((p) => { map[p.id] = p; });
      return map;
    },
    enabled: userIds.length > 0,
  });

  const isJoined = !!user && participants.some((p) => p.user_id === user.id);

  // Metric label + formatter driven by challenge type
  const challengeType: string = (challenge as any)?.challenge_type || "largest_fish";
  const isCountType = challengeType === "most_caught" || challengeType === "most_species";
  const metricSuffix = isCountType ? "" : " lbs";
  const metricLabel = isCountType ? "Catches" : "Weight";
  const formatScore = (n: number) =>
    isCountType ? `${Math.round(n).toLocaleString()}` : `${Number(n).toLocaleString()} lbs`;

  // My rank
  const myIndex = user ? participants.findIndex((p) => p.user_id === user.id) : -1;
  const myRank = myIndex >= 0 ? myIndex + 1 : null;
  const myScore = myIndex >= 0 ? Number(participants[myIndex].score) : 0;
  const leaderScore = participants.length > 0 ? Number(participants[0].score) : 0;
  const gapToLeader = myRank && myRank > 1 ? leaderScore - myScore : 0;

  // Recent verified catches from participants (live activity feed)
  const c2: any = challenge;
  const startISO = c2?.start_date ? new Date(c2.start_date).toISOString() : null;
  const endISO = c2?.end_date
    ? new Date(new Date(c2.end_date).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
    : null;
  const { data: recentCatches = [] } = useQuery({
    queryKey: ["fishing-challenge-recent-catches", id, userIds.join(","), c2?.species_id, startISO, endISO],
    queryFn: async () => {
      if (userIds.length === 0 || !startISO || !endISO) return [];
      let q = supabase
        .from("catches")
        .select("id,user_id,species_name,weight_lbs,length_in,caught_at,cover_photo_url,is_verified")
        .in("user_id", userIds)
        .eq("is_verified", true)
        .eq("is_private", false)
        .gte("caught_at", startISO)
        .lte("caught_at", endISO)
        .order("caught_at", { ascending: false })
        .limit(25);
      if (c2?.species_id) q = q.eq("species_id", c2.species_id);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: userIds.length > 0 && !!startISO && !!endISO,
  });

  const handleShare = async () => {
    const url = `${getShareBaseUrl()}/app/challenges/${id}`;
    const ch: any = challenge;
    const title = ch?.title ? `Fish-X Challenge: ${ch.title}` : "Fish-X Challenge";
    const text = ch?.description || "Check out this fishing challenge on Fish-X!";
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      const ch: any = challenge;
      const requiresPayment =
        ch?.entry_fee_enabled && ch?.prize_type === "cash" && Number(ch?.entry_fee) > 0;
      if (requiresPayment) {
        const { data, error } = await supabase.functions.invoke(
          "fishing-challenge-checkout",
          { body: { challengeId: id } },
        );
        if (error || !data?.url) throw new Error(error?.message || "Failed to start checkout");
        window.location.href = data.url;
        return;
      }
      const { error } = await supabase.from("challenge_participants").insert({
        challenge_id: id!,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fishing-challenge-participants", id] });
      toast.success("Joined challenge!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Must be logged in");
      const ch: any = challenge;
      const wasPaid =
        ch?.entry_fee_enabled && ch?.prize_type === "cash" && Number(ch?.entry_fee) > 0;
      if (wasPaid) {
        // Block client-side; refunds are not handled here.
        const { data: entry } = await supabase
          .from("fishing_challenge_entries")
          .select("has_paid")
          .eq("challenge_id", id!)
          .eq("user_id", user.id)
          .maybeSingle();
        if (entry?.has_paid) {
          // Block leaving and redirect to the support/help page for refund handling.
          toast.error("Paid entries can't be cancelled here — redirecting you to support.");
          navigate(`/help?topic=refund&challenge=${id}`);
          // Throwing keeps mutation in an "error" state without showing a duplicate toast.
          throw new Error("PAID_BLOCKED");
        }
      }
      const { error } = await supabase
        .from("challenge_participants")
        .delete()
        .eq("challenge_id", id!)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fishing-challenge-participants", id] });
      qc.invalidateQueries({ queryKey: ["challenge-participants-all"] });
      toast.success("You've left the challenge.");
    },
    onError: (err: any) => {
      if (err?.message === "PAID_BLOCKED") return; // already handled above
      toast.error(err.message);
    },
  });

  const handleLeave = () => {
    if (typeof window !== "undefined" && !window.confirm("Leave this challenge? You can rejoin while it's still open.")) {
      return;
    }
    leaveMutation.mutate();
  };

  // Competition catch logging
  const [logOpen, setLogOpen] = useState(false);
  const { data: mySubmissions = [] } = useQuery({
    queryKey: ["my-competition-catches", "challenge", id, user?.id],
    queryFn: async () => {
      if (!user || !id) return [];
      const { data } = await supabase
        .from("catches")
        .select("id, species_name, weight_lbs, length_in, cover_photo_url, approval_status, approval_notes, caught_at")
        .eq("user_id", user.id)
        .eq("challenge_id", id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && !!id,
  });

  if (isLoading) {
    return (
      <div className="scoreboard-hub min-h-screen p-6 space-y-4">
        <Skeleton className="h-8 w-40 bg-[hsl(var(--sb-surface-2))]" />
        <Skeleton className="h-48 w-full bg-[hsl(var(--sb-surface-2))]" />
        <Skeleton className="h-64 w-full bg-[hsl(var(--sb-surface-2))]" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="scoreboard-hub min-h-screen p-6 text-center">
        <Trophy className="h-12 w-12 mx-auto sb-text-muted opacity-30 mb-3" />
        <p className="font-medium mb-3">Challenge not found</p>
        <button onClick={() => navigate("/app/challenges")} className="text-sm sb-cyan hover:underline">
          Back to Challenges
        </button>
      </div>
    );
  }

  const c: any = challenge;
  const prizes = c.prizes as any;
  const prizePool = typeof prizes === "object" && prizes?.total ? Number(prizes.total) : 0;
  const maxParticipants = typeof prizes === "object" && prizes?.max_participants ? Number(prizes.max_participants) : null;
  const bannerUrl = typeof prizes === "object" && prizes?.banner_url ? String(prizes.banner_url) : null;
  const location = typeof prizes === "object" && prizes?.location ? String(prizes.location) : null;

  const now = new Date();
  const start = new Date(c.start_date);
  const end = new Date(c.end_date);
  let status: string = c.status;
  if (now >= start && now <= end && status !== "completed") status = "active";
  else if (now < start) status = "upcoming";
  else if (now > end) status = "completed";

  const rankLabel = (r: number) => {
    if (r === 1) return <span className="sb-gold font-bold text-xs w-8">1st</span>;
    if (r === 2) return <span className="text-slate-300 font-bold text-xs w-8">2nd</span>;
    if (r === 3) return <span className="text-amber-700 font-bold text-xs w-8">3rd</span>;
    return <span className="sb-text-muted text-xs w-8">{r}th</span>;
  };

  return (
    <div className="scoreboard-hub min-h-screen pb-24">
      {/* Back */}
      <div className="px-4 md:px-6 pt-6 pb-2">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => navigate("/app/challenges")} className="inline-flex items-center gap-1.5 text-xs sb-text-muted hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> All Challenges
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border sb-border text-xs font-semibold sb-cyan hover:bg-[hsl(var(--sb-cyan)/0.1)] transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="mx-4 md:mx-6 mt-2 sb-card overflow-hidden">
        <div className="relative h-48 sm:h-64 bg-gradient-to-br from-[hsl(var(--sb-surface-2))] to-[hsl(var(--sb-surface))] overflow-hidden">
          {bannerUrl && (
            <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sb-surface))] via-[hsl(var(--sb-surface)/0.4)] to-transparent" />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
              status === "active" ? "bg-rose-500 text-white" :
              status === "upcoming" ? "sb-bg-cyan" : "bg-[hsl(var(--sb-surface-2))] sb-text-muted"
            }`}>
              {status === "active" && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
              {status === "active" ? "Live" : status}
            </span>
            {c.target_species_name && (
              <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-[hsl(var(--sb-surface)/0.8)] backdrop-blur-sm border sb-border sb-cyan">
                {c.target_species_name}
              </span>
            )}
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="font-bold text-2xl sm:text-3xl text-white">{c.title}</h1>
            {location && (
              <p className="text-xs sb-text-muted flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 sb-cyan" /> {location}
              </p>
            )}
          </div>
        </div>

        {/* Countdown */}
        {status !== "completed" && (
          <div className="px-4 pt-4">
            <CountdownBanner
              label={status === "upcoming" ? "Starts in" : "Ends in"}
              targetDate={status === "upcoming" ? c.start_date : c.end_date}
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
          <Stat icon={Calendar} label="Starts" value={start.toLocaleDateString()} />
          <Stat icon={Clock} label="Ends" value={end.toLocaleDateString()} />
          <Stat icon={Users} label="Participants" value={`${participants.length}${maxParticipants ? `/${maxParticipants}` : ""}`} />
          <Stat icon={DollarSign} label="Prize Pool" value={prizePool > 0 ? `$${prizePool.toLocaleString()}` : "—"} />
        </div>

        {/* Join button */}
        {status !== "completed" && (
          <div className="px-4 pb-4">
            {isJoined ? (
              <div className="space-y-2">
                <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="h-4 w-4" />
                  Registered
                </div>
                {status === "active" && (
                  <button
                    onClick={() => setLogOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wider sb-bg-cyan hover:opacity-90 transition-opacity"
                  >
                    <Plus className="h-4 w-4" /> Log Catch for Challenge
                  </button>
                )}
                <button
                  onClick={handleLeave}
                  disabled={leaveMutation.isPending}
                  className="w-full text-xs font-semibold sb-text-muted hover:text-rose-400 underline-offset-2 hover:underline transition-colors disabled:opacity-60"
                >
                  {leaveMutation.isPending ? "Leaving…" : "Leave challenge"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wider sb-bg-cyan hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {status === "upcoming" ? "Register" : "Join Challenge"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* My rank card */}
      {isJoined && status !== "completed" && (
        <div className="mx-4 md:mx-6 mt-4 sb-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-[hsl(var(--sb-cyan)/0.15)] flex items-center justify-center shrink-0">
                {myRank === 1 ? (
                  <Crown className="h-5 w-5 sb-gold" />
                ) : (
                  <Trophy className="h-5 w-5 sb-cyan" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest sb-text-muted font-semibold">Your standing</p>
                <p className="text-sm font-bold truncate">
                  {myRank ? (
                    <>Rank #{myRank} of {participants.length}</>
                  ) : (
                    <>Not ranked yet — log a verified catch</>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold sb-cyan font-mono">{formatScore(myScore)}</p>
              {gapToLeader > 0 && (
                <p className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold">
                  −{formatScore(gapToLeader).replace(" lbs", "")}{metricSuffix} to #1
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My competition submissions */}
      {isJoined && mySubmissions.length > 0 && (
        <div className="mx-4 md:mx-6 mt-4 sb-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Fish className="h-4 w-4 sb-cyan" /> Your submissions ({mySubmissions.length})
            </h3>
          </div>
          <div className="space-y-2">
            {mySubmissions.slice(0, 5).map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-md bg-[hsl(var(--sb-surface-2))]">
                {s.cover_photo_url ? (
                  <img src={s.cover_photo_url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded bg-[hsl(var(--sb-surface))] flex items-center justify-center shrink-0">
                    <Fish className="h-4 w-4 sb-text-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{s.species_name || "Catch"}</p>
                  <p className="text-[11px] sb-text-muted">
                    {s.weight_lbs ? `${s.weight_lbs} lbs` : ""}{s.weight_lbs && s.length_in ? " · " : ""}{s.length_in ? `${s.length_in} in` : ""}
                  </p>
                </div>
                <ApprovalBadge status={s.approval_status} notes={s.approval_notes} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mx-4 md:mx-6 mt-4 mb-6">
        <Tabs
          value={searchParams.get("tab") || "leaderboard"}
          onValueChange={(v) => {
            const next = new URLSearchParams(searchParams);
            if (v === "leaderboard") next.delete("tab"); else next.set("tab", v);
            setSearchParams(next, { replace: true });
          }}
        >
          <TabsList className="w-full grid grid-cols-5 bg-[hsl(var(--sb-surface-2))]">
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="participants">
              Participants
              <span className="ml-1.5 text-[10px] sb-text-muted">({participants.length}{maxParticipants ? `/${maxParticipants}` : ""})</span>
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* Leaderboard */}
          <TabsContent value="leaderboard" className="mt-4 space-y-4">
            {status !== "upcoming" && participants.length >= 3 && (
              <Podium top3={participants.slice(0, 3)} profiles={profiles} formatScore={formatScore} />
            )}
            <div className="sb-card p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 sb-gold" />
                  <h2 className="font-bold text-sm">Leaderboard</h2>
                  <span className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold ml-1">
                    by {metricLabel}
                  </span>
                </div>
                <span
                  title="Only verified catches count toward this challenge"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                >
                  <ShieldCheck className="h-3 w-3" /> Verified only
                </span>
              </div>
              {participants.length === 0 ? (
                status === "upcoming" ? (
                  <EmptyState
                    icon={Clock}
                    title="Leaderboard opens at start"
                    description="Scores will appear here once the challenge goes live. Register now so you don't miss a minute."
                    action={!isJoined ? { label: "Register", onClick: () => joinMutation.mutate() } : undefined}
                  />
                ) : status === "completed" ? (
                  <EmptyState
                    icon={Trophy}
                    title="No entries were recorded"
                    description="This challenge ended without any verified catches on the board."
                  />
                ) : (
                  <EmptyState
                    icon={Fish}
                    title="No entries yet — be the first!"
                    description={isJoined
                      ? "Log a verified catch to claim the #1 spot on the board."
                      : "Join the challenge and log a verified catch to take the lead."}
                    action={isJoined
                      ? { label: "Log Catch", onClick: () => setLogOpen(true) }
                      : { label: "Join Challenge", onClick: () => joinMutation.mutate() }}
                  />
                )
              ) : (
                <div className="space-y-2">
                  {participants.map((p, i) => {
                    const prof = profiles[p.user_id];
                    const name = prof?.display_name || "Angler";
                    const isMe = !!user && p.user_id === user.id;
                    return (
                      <div
                        key={p.user_id}
                        className={`flex items-center gap-3 py-2 border-b sb-border last:border-0 ${
                          isMe ? "bg-[hsl(var(--sb-cyan)/0.08)] -mx-2 px-2 rounded" : ""
                        }`}
                      >
                        {rankLabel(i + 1)}
                        <Avatar className="h-8 w-8 ring-1 ring-[hsl(var(--sb-border))]">
                          <AvatarImage src={prof?.photos?.[0] || ""} />
                          <AvatarFallback className="text-[10px] bg-[hsl(var(--sb-surface-2))]">{name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate flex-1">
                          {name}
                          {isMe && <span className="ml-1.5 text-[9px] uppercase tracking-widest sb-cyan font-bold">You</span>}
                        </span>
                        <span className="text-sm font-bold sb-cyan">{formatScore(Number(p.score))}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Participants */}
          <TabsContent value="participants" className="mt-4">
            <div className="sb-card p-4">
              {participants.length === 0 ? (
                status === "completed" ? (
                  <EmptyState
                    icon={Users}
                    title="No one registered"
                    description="This challenge ended without any participants."
                  />
                ) : (
                  <EmptyState
                    icon={Users}
                    title={status === "upcoming" ? "Be the first to register" : "No participants yet"}
                    description={status === "upcoming"
                      ? "Get a head start — registered anglers are notified the moment the challenge opens."
                      : "Be the first to join and lock in your spot on the leaderboard."}
                    action={!isJoined
                      ? { label: status === "upcoming" ? "Register" : "Join Challenge", onClick: () => joinMutation.mutate() }
                      : undefined}
                  />
                )
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {participants.map((p) => {
                    const prof = profiles[p.user_id];
                    const name = prof?.display_name || "Angler";
                    return (
                      <button
                        key={p.user_id}
                        onClick={() => navigate(`/app/profile/${p.user_id}`)}
                        className="flex items-center gap-3 p-3 rounded-md border sb-border bg-[hsl(var(--sb-surface-2)/0.5)] hover:bg-[hsl(var(--sb-surface-2))] transition-colors text-left"
                      >
                        <Avatar className="h-10 w-10 ring-1 ring-[hsl(var(--sb-border))]">
                          <AvatarImage src={prof?.photos?.[0] || ""} />
                          <AvatarFallback className="text-xs bg-[hsl(var(--sb-surface))]">{name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{name}</p>
                          <p className="text-[11px] sb-cyan font-mono">{formatScore(Number(p.score))}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity" className="mt-4">
            <div className="sb-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 sb-cyan" />
                <h2 className="font-bold text-sm">Recent activity</h2>
                <span className="text-[10px] sb-text-muted uppercase tracking-widest font-semibold ml-1">
                  Verified catches
                </span>
              </div>
              {status === "upcoming" ? (
                <EmptyState
                  icon={Clock}
                  title="Activity starts at kickoff"
                  description="Once the challenge opens, every verified catch from participants will appear here in real time."
                  action={!isJoined ? { label: "Register", onClick: () => joinMutation.mutate() } : undefined}
                />
              ) : recentCatches.length === 0 ? (
                status === "completed" ? (
                  <EmptyState
                    icon={Fish}
                    title="No catches were logged"
                    description="No verified catches were submitted during this challenge."
                  />
                ) : (
                  <EmptyState
                    icon={Fish}
                    title="No verified catches yet"
                    description={isJoined
                      ? "Log your first catch — verified entries appear here for everyone to see."
                      : "Join the challenge to log catches and kick off the activity feed."}
                    action={isJoined
                      ? { label: "Log Catch", onClick: () => setLogOpen(true) }
                      : { label: "Join Challenge", onClick: () => joinMutation.mutate() }}
                  />
                )
              ) : (
                <div className="space-y-2">
                  {recentCatches.map((rc: any) => {
                    const prof = profiles[rc.user_id];
                    const name = prof?.display_name || "Angler";
                    const ago = timeAgo(new Date(rc.caught_at));
                    return (
                      <button
                        key={rc.id}
                        onClick={() => navigate(`/app/catches/${rc.id}`)}
                        className="w-full flex items-center gap-3 py-2 border-b sb-border last:border-0 text-left hover:bg-[hsl(var(--sb-surface-2)/0.5)] rounded transition-colors"
                      >
                        {rc.cover_photo_url ? (
                          <img src={rc.cover_photo_url} alt="" className="h-10 w-10 rounded object-cover ring-1 ring-[hsl(var(--sb-border))] shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-[hsl(var(--sb-surface-2))] flex items-center justify-center shrink-0">
                            <Fish className="h-4 w-4 sb-text-muted" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">
                            {name} <span className="sb-text-muted font-normal">landed</span> {rc.species_name || "a fish"}
                          </p>
                          <p className="text-[11px] sb-text-muted">
                            {rc.weight_lbs ? `${Number(rc.weight_lbs).toFixed(1)} lbs` : null}
                            {rc.weight_lbs && rc.length_in ? " · " : ""}
                            {rc.length_in ? `${Number(rc.length_in).toFixed(1)} in` : null}
                            {(rc.weight_lbs || rc.length_in) ? " · " : ""}
                            {ago}
                          </p>
                        </div>
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Rules */}
          <TabsContent value="rules" className="mt-4 space-y-4">
            <div className="sb-card p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-[10px] uppercase tracking-widest sb-text-muted font-semibold">Scoring</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="h-3 w-3" /> Verified only
                </span>
              </div>
              <p className="text-sm">{scoringSummary(challengeType)}</p>
            </div>
            {(() => {
              const r: any = c.rules;
              let rulesText = "";
              if (typeof r === "string") rulesText = r;
              else if (r && typeof r === "object") {
                rulesText = [r.description, r.rules, r.text, r.body]
                  .filter((v) => typeof v === "string" && v.trim().length > 0)
                  .join("\n\n");
              }
              if (!rulesText.trim()) {
                return (
                  <div className="sb-card p-4">
                    <EmptyState
                      icon={ShieldCheck}
                      title="No additional rules"
                      description="Standard scoring applies — see the Scoring summary above. All catches must be verified to count."
                    />
                  </div>
                );
              }
              return (
                <div className="sb-card p-4">
                  <h2 className="text-[10px] uppercase tracking-widest sb-text-muted font-semibold mb-2">Rules</h2>
                  <FormattedRules text={rulesText} className="text-sm" />
                </div>
              );
            })()}
          </TabsContent>

          {/* About */}
          <TabsContent value="about" className="mt-4 space-y-4">
            {c.description && (
              <div className="sb-card p-4">
                <h2 className="text-[10px] uppercase tracking-widest sb-text-muted font-semibold mb-2">Description</h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.description}</p>
              </div>
            )}
            <div className="sb-card p-4 grid grid-cols-2 gap-3">
              {c.target_species_name && <Stat icon={Fish} label="Species" value={c.target_species_name} />}
              {location && <Stat icon={MapPin} label="Location" value={location} />}
              <Stat icon={Calendar} label="Start" value={start.toLocaleDateString()} />
              <Stat icon={Clock} label="End" value={end.toLocaleDateString()} />
              <Stat icon={Users} label="Participants" value={`${participants.length}${maxParticipants ? `/${maxParticipants}` : ""}`} />
              <Stat icon={DollarSign} label="Prize Pool" value={prizePool > 0 ? `$${prizePool.toLocaleString()}` : "—"} />
              {c.entry_fee_enabled && Number(c.entry_fee) > 0 && (
                <Stat icon={DollarSign} label="Entry Fee" value={`$${Number(c.entry_fee).toLocaleString()}`} />
              )}
              <Stat icon={Trophy} label="Format" value={formatChallengeType(challengeType)} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <LogCompetitionCatchModal
        open={logOpen}
        onOpenChange={setLogOpen}
        competition={{ kind: "challenge", id: id!, name: c.title, speciesId: c.species_id }}
      />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-[hsl(var(--sb-cyan)/0.15)] flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 sb-cyan" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] sb-text-muted uppercase tracking-widest font-semibold">{label}</p>
        <p className="text-xs font-bold truncate">{value}</p>
      </div>
    </div>
  );
}

function CountdownBanner({ label, targetDate }: { label: string; targetDate: string }) {
  const { days, hours, minutes, seconds, totalMs } = useCountdown(targetDate);
  const urgent = totalMs > 0 && totalMs <= 60 * 60 * 1000;
  const { degraded, online } = getServerTimeStatus();
  const units = [
    { v: days, l: "Days" },
    { v: hours, l: "Hours" },
    { v: minutes, l: "Mins" },
    { v: seconds, l: "Secs" },
  ];
  return (
    <div className={`rounded-lg p-3 border transition-colors ${
      urgent
        ? "bg-rose-500/10 border-rose-500/50 animate-pulse"
        : "bg-[hsl(var(--sb-surface-2))] sb-border"
    }`}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className={`text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1.5 ${urgent ? "text-rose-300" : "sb-cyan"}`}>
          {urgent && <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />}
          {urgent ? `${label.replace(/ in$/i, "")} soon!` : label}
        </p>
        {degraded && (
          <span
            title={online ? "Time may be slightly off — reconnecting…" : "Offline — showing last known time"}
            className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-semibold text-amber-400/90"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            {online ? "Reconnecting" : "Offline"}
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {units.map((u) => (
          <div key={u.l} className={`text-center rounded-md py-2 ${urgent ? "bg-rose-500/15" : "bg-[hsl(var(--sb-surface))]"}`}>
            <div className={`text-xl sm:text-2xl font-bold font-mono ${urgent ? "text-rose-300" : "sb-cyan"}`}>{String(u.v).padStart(2, "0")}</div>
            <div className="text-[9px] sb-text-muted uppercase tracking-widest font-semibold mt-0.5">{u.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}