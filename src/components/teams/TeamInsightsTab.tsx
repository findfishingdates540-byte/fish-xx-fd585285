import { useTeamPageInsights } from "@/hooks/use-team-page-insights";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Users, TrendingUp, Heart, MessageCircle, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function TeamInsightsTab({ teamId, isCaptain }: { teamId: string; isCaptain: boolean }) {
  const { data, isLoading } = useTeamPageInsights(teamId, isCaptain);

  if (!isCaptain) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        Only the team captain can view insights.
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  const stat = (icon: React.ReactNode, label: string, value: string | number, sub?: string) => (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stat(<Eye className="h-3.5 w-3.5" />, "Views (30d)", data.views_30d, `${data.views_7d} in last 7 days`)}
        {stat(<Users className="h-3.5 w-3.5" />, "Unique viewers (30d)", data.unique_viewers_30d)}
        {stat(<Users className="h-3.5 w-3.5" />, "Followers", data.followers_total, `+${data.followers_new_30d} this month`)}
        {stat(<TrendingUp className="h-3.5 w-3.5" />, "New followers (7d)", data.followers_new_7d)}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Top post (last 90 days)</h3>
        </div>
        {data.top_post ? (
          <div className="space-y-2">
            <p className="text-sm whitespace-pre-wrap line-clamp-4">{data.top_post.content || "(no caption)"}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{data.top_post.likes_count}</span>
              <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{data.top_post.comments_count}</span>
              <span>{formatDistanceToNow(new Date(data.top_post.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No public page posts yet.</p>
        )}
      </div>
    </div>
  );
}