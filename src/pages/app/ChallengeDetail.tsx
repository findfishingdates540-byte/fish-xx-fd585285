import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Clock, DollarSign, MapPin, Trophy, Users, Fish } from "lucide-react";
import { toast } from "sonner";

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

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
        <button onClick={() => navigate("/app/challenges")} className="inline-flex items-center gap-1.5 text-xs sb-text-muted hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> All Challenges
        </button>
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
            <button
              onClick={() => joinMutation.mutate()}
              disabled={isJoined || joinMutation.isPending}
              className={`w-full px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wider transition-opacity ${
                isJoined ? "bg-[hsl(var(--sb-surface-2))] sb-text-muted cursor-not-allowed" : "sb-bg-cyan hover:opacity-90"
              } disabled:opacity-60`}
            >
              {isJoined ? "Joined" : status === "upcoming" ? "Register" : "Join Challenge"}
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {c.description && (
        <div className="mx-4 md:mx-6 mt-4 sb-card p-4">
          <h2 className="text-[10px] uppercase tracking-widest sb-text-muted font-semibold mb-2">About</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.description}</p>
        </div>
      )}

      {/* Rules */}
      {c.rules && (typeof c.rules === "string" ? c.rules.length > 0 : Object.keys(c.rules).length > 0) && (
        <div className="mx-4 md:mx-6 mt-4 sb-card p-4">
          <h2 className="text-[10px] uppercase tracking-widest sb-text-muted font-semibold mb-2">Rules</h2>
          <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
            {typeof c.rules === "string" ? c.rules : JSON.stringify(c.rules, null, 2)}
          </pre>
        </div>
      )}

      {/* Leaderboard */}
      <div className="mx-4 md:mx-6 mt-4 sb-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 sb-gold" />
          <h2 className="font-bold text-sm">Leaderboard</h2>
        </div>
        {participants.length === 0 ? (
          <div className="text-center py-8">
            <Fish className="h-8 w-8 mx-auto sb-text-muted opacity-30 mb-2" />
            <p className="text-sm sb-text-muted">No entries yet — be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {participants.map((p, i) => {
              const prof = profiles[p.user_id];
              const name = prof?.display_name || "Angler";
              return (
                <div key={p.user_id} className="flex items-center gap-3 py-2 border-b sb-border last:border-0">
                  {rankLabel(i + 1)}
                  <Avatar className="h-8 w-8 ring-1 ring-[hsl(var(--sb-border))]">
                    <AvatarImage src={prof?.photos?.[0] || ""} />
                    <AvatarFallback className="text-[10px] bg-[hsl(var(--sb-surface-2))]">{name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate flex-1">{name}</span>
                  <span className="text-sm font-bold sb-cyan">{Number(p.score).toLocaleString()} lbs</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
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