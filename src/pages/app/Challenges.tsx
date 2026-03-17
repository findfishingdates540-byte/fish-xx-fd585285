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
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
      };
    };
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  return timeLeft;
}

function CountdownDisplay({ endDate }: { endDate: string }) {
  const { days, hours, minutes } = useCountdown(endDate);
  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      <span className="bg-muted px-1.5 py-0.5 rounded font-bold">{String(days).padStart(2, "0")}d</span>
      <span className="text-muted-foreground">:</span>
      <span className="bg-muted px-1.5 py-0.5 rounded font-bold">{String(hours).padStart(2, "0")}h</span>
      <span className="text-muted-foreground">:</span>
      <span className="bg-muted px-1.5 py-0.5 rounded font-bold">{String(minutes).padStart(2, "0")}m</span>
    </div>
  );
}

export default function Challenges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabValue>("live");
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
        .from("profiles")
        .select("id, display_name, photos")
        .in("id", participantUserIds);
      const map: Record<string, { display_name: string | null; photos: string[] | null }> = {};
      (data || []).forEach((p) => { map[p.id] = p; });
      return map;
    },
    enabled: participantUserIds.length > 0,
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
    if (r === 1) return <span className="text-amber-500 font-bold text-xs">1st</span>;
    if (r === 2) return <span className="text-muted-foreground font-bold text-xs">2nd</span>;
    if (r === 3) return <span className="text-amber-700 font-bold text-xs">3rd</span>;
    return <span className="text-muted-foreground text-xs">{r}th</span>;
  };

  return (
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 md:px-6 pt-6 pb-4">
        <div>
          <h1 className="text-xl font-bold">Fishing Challenges</h1>
          <p className="text-xs text-muted-foreground">
            Competing with {participantUserIds.length.toLocaleString()} anglers worldwide
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search challenges, species..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button className="gap-1.5 shrink-0" onClick={() => navigate("/app/challenges/new")}>
            <Plus className="h-4 w-4" />
            Create Challenge
          </Button>
        </div>
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 md:px-6 mb-6">
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">My Active</p>
            <p className="text-lg font-bold">{myStats.activeChallenges} Challenges</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Purses</p>
            <p className="text-lg font-bold">${myStats.totalPurses.toLocaleString()}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Current Rank</p>
            <p className="text-lg font-bold">{myStats.bestRank ? `#${myStats.bestRank}` : "—"}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-6 mb-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList>
            <TabsTrigger value="live" className="gap-1.5">
              <Flame className="h-3.5 w-3.5" />
              Live Now
            </TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Challenge Cards */}
      <div className="px-4 md:px-6">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[320px] rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium mb-1">No {tab === "live" ? "live" : tab} challenges</p>
            <p className="text-sm text-muted-foreground">
              {tab === "live" ? "Check upcoming challenges or create your own!" : "Check back later for new challenges."}
            </p>
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
              />
            ))}
          </div>
        ) : tab === "upcoming" ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg">Upcoming Challenges</h2>
                <p className="text-xs text-muted-foreground">Secure your spot in the next big events</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((challenge) => (
                <UpcomingChallengeCard key={challenge.id} challenge={challenge} onJoin={() => joinMutation.mutate(challenge.id)} joining={joinMutation.isPending} />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((challenge) => (
              <CompletedChallengeCard key={challenge.id} challenge={challenge} rankLabel={rankLabel} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="mx-4 md:mx-6 mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={() => navigate("/app/leaderboard")} className="rounded-xl border bg-card p-5 text-left hover:bg-muted/50 transition-colors group">
          <Trophy className="h-6 w-6 text-primary mb-2" />
          <p className="font-bold text-sm">Scoreboards Hub</p>
          <p className="text-xs text-muted-foreground mt-1">View rankings & top anglers</p>
        </button>
        <button onClick={() => navigate("/app/species")} className="rounded-xl border bg-card p-5 text-left hover:bg-muted/50 transition-colors group">
          <Fish className="h-6 w-6 text-primary mb-2" />
          <p className="font-bold text-sm">Species Explorer</p>
          <p className="text-xs text-muted-foreground mt-1">Browse species & records</p>
        </button>
        <button onClick={() => navigate("/app/catches")} className="rounded-xl border bg-card p-5 text-left hover:bg-muted/50 transition-colors group">
          <Award className="h-6 w-6 text-primary mb-2" />
          <p className="font-bold text-sm">Log a Catch</p>
          <p className="text-xs text-muted-foreground mt-1">Submit catches to climb ranks</p>
        </button>
      </div>

      {/* CTA Banner */}
      <div className="mx-4 md:mx-6 mt-8 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-8 md:p-10 text-center">
        <h2 className="text-xl font-bold mb-2">Don't see a challenge that fits?</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
          Create your own private challenge for your fishing club or tournament series. Custom species, locations, and scoring rules.
        </p>
        <Button variant="outline" size="lg" onClick={() => navigate("/app/challenges/new")} className="gap-2">
          Host a Private Event
        </Button>
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
}: {
  challenge: ChallengeWithDetails;
  onJoin: () => void;
  joining: boolean;
  rankLabel: (r: number) => React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Top section */}
      <div className="relative h-32 bg-gradient-to-br from-muted to-muted/50 p-4 flex flex-col justify-end overflow-hidden">
        {challenge.bannerUrl && (
          <img src={challenge.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-destructive text-destructive-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-pulse" />
            Live
          </span>
          {challenge.speciesName && (
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-muted/80 backdrop-blur-sm border">
              {challenge.speciesName}
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Ends in</span>
          <div className="mt-0.5">
            <CountdownDisplay endDate={challenge.end_date} />
          </div>
        </div>
        <div>
          <h3 className="font-bold text-base">{challenge.title}</h3>
          {challenge.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {challenge.location}
            </p>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Leaderboard */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Top Leaderboard</p>
              <button className="text-[10px] text-primary font-semibold hover:underline">View All</button>
            </div>
            <div className="space-y-2">
              {challenge.topEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No entries yet</p>
              ) : (
                challenge.topEntries.map((entry) => (
                  <div key={entry.userId} className="flex items-center gap-2">
                    {rankLabel(entry.rank)}
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={entry.photo || ""} />
                      <AvatarFallback className="text-[9px] bg-muted">{entry.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium truncate flex-1">{entry.displayName}</span>
                    <span className="text-xs font-bold">{entry.score} lbs</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Stats */}
          <div className="text-right shrink-0 space-y-3">
            {challenge.prizePool > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Prize Pool</p>
                <p className="text-xl font-bold text-primary">${challenge.prizePool.toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Participants</p>
              <p className="text-sm font-bold">
                {challenge.participantCount}
                {challenge.maxParticipants && <span className="text-muted-foreground font-normal">/{challenge.maxParticipants}</span>}
              </p>
              {challenge.maxParticipants && (
                <div className="w-20 h-1 bg-muted rounded-full mt-1 ml-auto">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, (challenge.participantCount / challenge.maxParticipants) * 100)}%` }}
                  />
                </div>
              )}
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={onJoin}
              disabled={challenge.isJoined || joining}
            >
              {challenge.isJoined ? "Joined" : "Join Challenge"}
            </Button>
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
}: {
  challenge: ChallengeWithDetails;
  onJoin: () => void;
  joining: boolean;
}) {
  const startDate = new Date(challenge.start_date);
  const typeLabel = challenge.is_official ? "Pro Series" : challenge.challenge_type === "most_caught" ? "Casual" : "Team Event";

  return (
    <div className="rounded-xl border bg-card overflow-hidden group">
      <div className="relative h-28 bg-gradient-to-br from-muted to-muted/30 p-3 flex flex-col justify-end overflow-hidden">
        {challenge.bannerUrl && (
          <img src={challenge.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />
        <span className="absolute top-3 left-3 inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-primary text-primary-foreground">
          {typeLabel}
        </span>
        <div className="absolute top-3 right-3 rounded-md border bg-card/80 backdrop-blur-sm px-2 py-1 text-center">
          <p className="text-[10px] font-bold uppercase">{startDate.toLocaleDateString("en-US", { day: "2-digit" })}</p>
          <p className="text-[10px] text-muted-foreground uppercase">{startDate.toLocaleDateString("en-US", { month: "short" })}</p>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-sm mb-1">{challenge.title}</h3>
        {challenge.speciesName && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
            <Fish className="h-3 w-3" /> {challenge.speciesName}
          </p>
        )}
        <div className="flex items-center justify-between">
          {challenge.prizePool > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Prize Pool</p>
              <p className="text-sm font-bold">${challenge.prizePool.toLocaleString()}</p>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onJoin}
            disabled={challenge.isJoined || joining}
          >
            {challenge.isJoined ? "Registered" : "Details"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Completed Challenge Card ─── */
function CompletedChallengeCard({
  challenge,
  rankLabel,
}: {
  challenge: ChallengeWithDetails;
  rankLabel: (r: number) => React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 opacity-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">{challenge.title}</h3>
        <Badge variant="secondary" className="text-[10px]">Completed</Badge>
      </div>
      {challenge.speciesName && (
        <p className="text-xs text-muted-foreground mb-3">
          <Fish className="h-3 w-3 inline mr-1" />{challenge.speciesName}
        </p>
      )}
      <div className="space-y-1.5">
        {challenge.topEntries.map((entry) => (
          <div key={entry.userId} className="flex items-center gap-2">
            {rankLabel(entry.rank)}
            <Avatar className="h-5 w-5">
              <AvatarImage src={entry.photo || ""} />
              <AvatarFallback className="text-[8px] bg-muted">{entry.displayName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs truncate flex-1">{entry.displayName}</span>
            <span className="text-xs font-bold">{entry.score} lbs</span>
          </div>
        ))}
      </div>
      {challenge.prizePool > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          Prize Pool: <span className="font-semibold">${challenge.prizePool.toLocaleString()}</span>
        </p>
      )}
    </div>
  );
}
