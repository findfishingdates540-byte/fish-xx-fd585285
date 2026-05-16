import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, MessageSquare, MapPin, Clock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTeamPosts, type TeamPostSurface } from "@/hooks/use-team-posts";
import { TeamComposer } from "./TeamComposer";
import { TeamPostCard } from "./TeamPostCard";

interface Props {
  teamId: string;
  surface: TeamPostSurface;
  teamName: string;
  teamLogo?: string | null;
  canPost: boolean;
  canView: boolean;
  isCaptain: boolean;
}

export function TeamFeedTab({ teamId, surface, teamName, teamLogo, canPost, canView, isCaptain }: Props) {
  const [sort, setSort] = useState<"recent" | "top">("recent");
  const [near, setNear] = useState<{ lat: number; lng: number; radiusMi: number } | null>(null);
  const [radius, setRadius] = useState(50);
  const { data: posts = [], isLoading } = useTeamPosts(
    canView ? teamId : undefined,
    surface,
    { sort, near },
  );

  const toggleNearby = () => {
    if (near) {
      setNear(null);
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setNear({ lat: pos.coords.latitude, lng: pos.coords.longitude, radiusMi: radius }),
      () => toast.error("Could not get your location"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  if (!canView) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="font-semibold">Members only</p>
        <p className="text-sm text-muted-foreground mt-1">Join the team to see and post in the group.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canPost && (
        <TeamComposer teamId={teamId} surface={surface} teamName={teamName} teamLogo={teamLogo} />
      )}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <Button size="sm" variant={sort === "recent" ? "default" : "outline"} onClick={() => setSort("recent")} className="h-8 gap-1">
          <Clock className="h-3.5 w-3.5" /> Recent
        </Button>
        <Button size="sm" variant={sort === "top" ? "default" : "outline"} onClick={() => setSort("top")} className="h-8 gap-1">
          <Flame className="h-3.5 w-3.5" /> Top
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button size="sm" variant={near ? "default" : "outline"} onClick={toggleNearby} className="h-8 gap-1">
          <MapPin className="h-3.5 w-3.5" /> {near ? `Within ${near.radiusMi}mi` : "Nearby"}
        </Button>
        {near && (
          <select
            className="h-8 text-xs rounded-md border bg-background px-2"
            value={radius}
            onChange={(e) => {
              const r = Number(e.target.value);
              setRadius(r);
              setNear((n) => (n ? { ...n, radiusMi: r } : n));
            }}
          >
            <option value={10}>10 mi</option>
            <option value={25}>25 mi</option>
            <option value={50}>50 mi</option>
            <option value={100}>100 mi</option>
          </select>
        )}
      </div>
      {isLoading ? (
        <>
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">No posts yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            {canPost ? "Be the first to share something." : "Check back soon."}
          </p>
        </div>
      ) : (
        posts.map((p) => (
          <TeamPostCard
            key={p.id}
            post={p}
            teamName={teamName}
            teamLogo={teamLogo}
            surface={surface}
            isCaptain={isCaptain}
          />
        ))
      )}
    </div>
  );
}