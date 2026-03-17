import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Camera, Clock, DollarSign, Gift, Trophy, Users, Plus } from "lucide-react";
import { formatDistanceToNow, isPast, isFuture } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

interface PhotoChallenge {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  entry_fee: number;
  prize_type: string;
  prize_description: string | null;
  start_date: string;
  end_date: string;
  voting_end_date: string;
  status: string;
  winner_id: string | null;
  created_by: string;
  created_at: string;
  entry_count?: number;
}

export default function PhotoChallenges() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [tab, setTab] = useState("active");

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["photo-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photo_challenges")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;

      // Get entry counts
      const ids = (data || []).map((c: any) => c.id);
      const { data: entries } = await supabase
        .from("photo_challenge_entries")
        .select("challenge_id")
        .in("challenge_id", ids);

      const countMap: Record<string, number> = {};
      (entries || []).forEach((e: any) => {
        countMap[e.challenge_id] = (countMap[e.challenge_id] || 0) + 1;
      });

      return (data || []).map((c: any) => ({
        ...c,
        entry_count: countMap[c.id] || 0,
      })) as PhotoChallenge[];
    },
  });

  const active = challenges.filter(
    (c) => c.status === "submissions_open" || c.status === "voting"
  );
  const upcoming = challenges.filter((c) => c.status === "upcoming");
  const completed = challenges.filter((c) => c.status === "completed");

  const getTimeLabel = (c: PhotoChallenge) => {
    if (c.status === "submissions_open") {
      return `Submissions close ${formatDistanceToNow(new Date(c.end_date), { addSuffix: true })}`;
    }
    if (c.status === "voting") {
      return `Voting ends ${formatDistanceToNow(new Date(c.voting_end_date), { addSuffix: true })}`;
    }
    if (c.status === "upcoming") {
      return `Starts ${formatDistanceToNow(new Date(c.start_date), { addSuffix: true })}`;
    }
    return "Completed";
  };

  const ChallengeCard = ({ challenge }: { challenge: PhotoChallenge }) => {
    const prizePool = challenge.entry_fee * (challenge.entry_count || 0) * 0.5;

    return (
      <div
        onClick={() => navigate(`/app/photo-challenges/${challenge.id}`)}
        className="group cursor-pointer rounded-xl overflow-hidden border bg-card hover:shadow-lg transition-all"
      >
        {/* Banner */}
        <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5">
          {challenge.banner_url && (
            <img
              src={challenge.banner_url}
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-3 right-3">
            <Badge
              variant={
                challenge.status === "submissions_open"
                  ? "default"
                  : challenge.status === "voting"
                  ? "secondary"
                  : "outline"
              }
              className="capitalize"
            >
              {challenge.status === "submissions_open"
                ? "Open"
                : challenge.status === "voting"
                ? "Voting"
                : challenge.status}
            </Badge>
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white font-bold text-lg leading-tight">
              {challenge.title}
            </h3>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          {challenge.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {challenge.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {challenge.entry_count} entries
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              ${challenge.entry_fee} entry
            </span>
            {challenge.prize_type === "gift_card" ? (
              <span className="flex items-center gap-1">
                <Gift className="h-3.5 w-3.5" />
                {challenge.prize_description || "Gift Card"}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                ${prizePool.toFixed(0)} pot
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {getTimeLabel(challenge)}
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12 text-muted-foreground">
      <Camera className="h-12 w-12 mx-auto mb-3 opacity-40" />
      <p>{message}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Photo Challenges</h1>
          <p className="text-muted-foreground text-sm">
            Submit your best fish photos, vote for winners, and win prizes
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Completed ({completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : active.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {active.map((c) => (
                <ChallengeCard key={c.id} challenge={c} />
              ))}
            </div>
          ) : (
            <EmptyState message="No active photo challenges right now" />
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          {upcoming.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {upcoming.map((c) => (
                <ChallengeCard key={c.id} challenge={c} />
              ))}
            </div>
          ) : (
            <EmptyState message="No upcoming photo challenges" />
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completed.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {completed.map((c) => (
                <ChallengeCard key={c.id} challenge={c} />
              ))}
            </div>
          ) : (
            <EmptyState message="No completed photo challenges yet" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
