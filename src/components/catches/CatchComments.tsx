import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface CatchCommentsProps {
  catchId: string;
}

interface CommentRow {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: { display_name: string | null; photos: string[] | null } | null;
}

export function CatchComments({ catchId }: CatchCommentsProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["catch-comments", catchId],
    queryFn: async (): Promise<CommentRow[]> => {
      const { data, error } = await supabase
        .from("catch_comments")
        .select("id, user_id, body, created_at")
        .eq("catch_id", catchId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const userIds = Array.from(new Set((data || []).map((c) => c.user_id)));
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos")
        .in("id", userIds);
      const map = new Map((profiles || []).map((p: any) => [p.id, p]));
      return (data || []).map((c) => ({ ...c, author: map.get(c.user_id) || null }));
    },
  });

  const { mutate: postComment, isPending: posting } = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error("Sign in to comment");
      const { error } = await supabase.from("catch_comments").insert({
        catch_id: catchId,
        user_id: user.id,
        body: text.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["catch-comments", catchId] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to post comment"),
  });

  const { mutate: removeComment } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("catch_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["catch-comments", catchId] }),
    onError: (e: any) => toast.error(e.message || "Failed to delete"),
  });

  const handleSubmit = () => {
    const text = body.trim();
    if (!text) return;
    postComment(text);
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
        </div>
        Comments {comments.length > 0 && <span className="text-muted-foreground font-normal">({comments.length})</span>}
      </h3>

      {user ? (
        <div className="flex gap-2 mb-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Nice catch! Where did you land it?"
            rows={2}
            maxLength={2000}
            className="resize-none text-sm"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={posting || !body.trim()}
            className="shrink-0 self-end"
            aria-label="Post comment"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-4">Sign in to leave a comment.</p>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground">No comments yet. Be the first to say something.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={c.author?.photos?.[0] || ""} />
                <AvatarFallback className="text-xs">
                  {(c.author?.display_name || "?")[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">
                    {c.author?.display_name || "Angler"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                  {user?.id === c.user_id && (
                    <button
                      onClick={() => removeComment(c.id)}
                      className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap break-words mt-0.5">
                  {c.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}