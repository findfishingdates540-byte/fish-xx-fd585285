import { Skeleton } from "@/components/ui/skeleton";
import { Lock, MessageSquare } from "lucide-react";
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
  const { data: posts = [], isLoading } = useTeamPosts(canView ? teamId : undefined, surface);

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