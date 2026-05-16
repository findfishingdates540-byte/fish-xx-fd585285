import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamPostComments } from "@/hooks/use-team-posts";

export function TeamComments({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { data: comments = [], add, isLoading } = useTeamPostComments(postId);
  const [text, setText] = useState("");

  const submit = async () => {
    if (!user || !text.trim()) return;
    await add.mutateAsync({ content: text.trim(), user_id: user.id });
    setText("");
  };

  return (
    <div className="border-t pt-3 mt-2 space-y-3">
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet. Be the first.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex gap-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={c.author?.photos?.[0] || ""} />
              <AvatarFallback className="text-[10px]">{(c.author?.display_name || "?")[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="bg-muted/50 rounded-lg px-3 py-1.5">
                <p className="text-xs font-medium">{c.author?.display_name || "Angler"}</p>
                <p className="text-sm whitespace-pre-wrap break-words">{c.content}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))
      )}
      {user && (
        <div className="flex gap-2">
          <Input
            placeholder="Write a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
            maxLength={500}
          />
          <Button size="sm" onClick={submit} disabled={!text.trim() || add.isPending}>Send</Button>
        </div>
      )}
    </div>
  );
}