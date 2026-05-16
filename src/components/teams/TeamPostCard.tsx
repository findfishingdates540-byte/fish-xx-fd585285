import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, MoreHorizontal, Pin, Trash2, Flag, MapPin, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  useTeamPostMutations, type TeamPost, type TeamPostSurface,
} from "@/hooks/use-team-posts";
import { TeamComments } from "./TeamComments";
import { useCreateStory } from "@/hooks/use-stories";
import { toast } from "sonner";

interface Props {
  post: TeamPost;
  teamName: string;
  teamLogo?: string | null;
  surface: TeamPostSurface;
  isCaptain: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  announcement: "Announcement",
  matchup: "Next Matchup",
  winning: "Winning",
  teaser: "Teaser",
  update: "Update",
  catch: "Catch",
  general: "",
};

export function TeamPostCard({ post, teamName, teamLogo, surface, isCaptain }: Props) {
  const { user } = useAuth();
  const { remove, togglePin, toggleLike, report } = useTeamPostMutations(post.team_id, surface);
  const [showComments, setShowComments] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const createStory = useCreateStory();

  const firstImage = post.media.find((m) => m.type === "image")?.url;
  const shareToStory = () => {
    if (!user) { toast.error("Sign in to share"); return; }
    const overlay = `${teamName}${post.content ? ` — ${post.content.slice(0, 80)}` : ""}`;
    if (firstImage) {
      createStory.mutate({ media_url: firstImage, media_type: "image", text_overlay: overlay });
    } else if (post.content) {
      createStory.mutate({ media_type: "text", text_overlay: overlay, background_color: "#1454AE" });
    } else {
      toast.error("Nothing to share");
    }
  };

  const canManage = isCaptain || post.author_id === user?.id;
  const liked = !!post.viewer_liked;

  return (
    <article className="rounded-xl border bg-card p-4">
      <header className="flex items-start gap-3">
        <Avatar className="h-11 w-11">
          <AvatarImage src={teamLogo || undefined} />
          <AvatarFallback>{teamName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm">{teamName}</span>
            {post.pinned && <Pin className="h-3 w-3 text-primary" />}
            {TYPE_LABELS[post.post_type] && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {TYPE_LABELS[post.post_type]}
              </Badge>
            )}
            {post.visibility === "pending_review" && post.author_id === user?.id && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-amber-500/50 text-amber-600 dark:text-amber-400">
                Pending review
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
            <span>posted by</span>
            <Link to={`/app/u/${post.author_id}`} className="font-medium text-foreground hover:underline">
              {post.author?.display_name || "Angler"}
            </Link>
            <span>·</span>
            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
            {post.location_name && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{post.location_name}</span>
              </>
            )}
          </div>
        </div>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isCaptain && (
                <DropdownMenuItem onClick={() => togglePin.mutate({ id: post.id, pinned: post.pinned })}>
                  <Pin className="h-3.5 w-3.5 mr-2" /> {post.pinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={shareToStory} disabled={createStory.isPending}>
                <Sparkles className="h-3.5 w-3.5 mr-2" /> Share to story
              </DropdownMenuItem>
              {canManage && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => { if (confirm("Delete this post?")) remove.mutate(post.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              )}
              {post.author_id !== user.id && (
                <DropdownMenuItem onClick={() => setReportOpen(true)}>
                  <Flag className="h-3.5 w-3.5 mr-2" /> Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      {post.content && (
        <p className="mt-3 text-sm whitespace-pre-wrap break-words">{post.content}</p>
      )}

      {post.media.length > 0 && (
        <div className={cn(
          "mt-3 grid gap-1 rounded-lg overflow-hidden",
          post.media.length === 1 ? "grid-cols-1" : "grid-cols-2",
        )}>
          {post.media.map((m, i) => (
            <div key={i} className="bg-muted">
              {m.type === "image" ? (
                <img src={m.url} alt="" className="w-full h-full object-cover max-h-[420px]" />
              ) : (
                <video src={m.url} controls className="w-full max-h-[420px]" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-sm">
        <button
          className={cn("inline-flex items-center gap-1 transition-colors", liked ? "text-destructive" : "text-muted-foreground hover:text-destructive")}
          onClick={() => toggleLike.mutate({ id: post.id, liked })}
          disabled={!user}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          <span>{post.likes_count}</span>
        </button>
        <button
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => setShowComments((v) => !v)}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.comments_count}</span>
        </button>
      </div>

      {showComments && <TeamComments postId={post.id} />}

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Report post</DialogTitle></DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Tell us what's wrong with this post…"
            maxLength={500}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!reportReason.trim()) return;
                await report.mutateAsync({ id: post.id, reason: reportReason.trim() });
                setReportOpen(false); setReportReason("");
              }}
              disabled={!reportReason.trim() || report.isPending}
            >
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}