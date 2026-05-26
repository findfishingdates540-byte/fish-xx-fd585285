import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Msg = { id: string; sender_id: string; content: string; created_at: string };

export default function TeamPageMessages() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: team } = useQuery({
    queryKey: ["team-header", teamId],
    enabled: !!teamId,
    queryFn: async () => {
      const { data } = await supabase
        .from("fishing_teams")
        .select("id,name,logo_url,captain_id")
        .eq("id", teamId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: thread, refetch: refetchThread } = useQuery({
    queryKey: ["page-thread", teamId, user?.id],
    enabled: !!teamId && !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("team_page_threads")
        .select("*")
        .eq("team_id", teamId!)
        .eq("visitor_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const threadId = thread?.id as string | undefined;

  const { data: messages = [] } = useQuery<Msg[]>({
    queryKey: ["page-thread-messages", threadId],
    enabled: !!threadId,
    queryFn: async () => {
      const { data } = await supabase
        .from("team_page_messages")
        .select("id,sender_id,content,created_at")
        .eq("thread_id", threadId!)
        .order("created_at", { ascending: true });
      return (data || []) as Msg[];
    },
  });

  // Mark as read for visitor
  useEffect(() => {
    if (!threadId) return;
    supabase
      .from("team_page_threads")
      .update({ unread_for_visitor: 0 })
      .eq("id", threadId)
      .then(() => {});
  }, [threadId, messages.length]);

  // Realtime new messages
  useEffect(() => {
    if (!threadId) return;
    const ch = supabase
      .channel(`page-thread-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_page_messages", filter: `thread_id=eq.${threadId}` },
        () => qc.invalidateQueries({ queryKey: ["page-thread-messages", threadId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [threadId, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!text.trim() || !user || !team) return;
    setSending(true);
    try {
      let tid = threadId;
      if (!tid) {
        const { data: created, error } = await supabase
          .from("team_page_threads")
          .insert({ team_id: team.id, visitor_id: user.id })
          .select("id")
          .single();
        if (error) throw error;
        tid = created.id;
        await refetchThread();
      }
      const { error: mErr } = await supabase
        .from("team_page_messages")
        .insert({ thread_id: tid!, sender_id: user.id, content: text.trim() });
      if (mErr) throw mErr;
      setText("");
      qc.invalidateQueries({ queryKey: ["page-thread-messages", tid] });
    } catch (e: any) {
      toast.error(e.message || "Failed to send");
    } finally {
      setSending(false);
    }
  }

  const placeholder = useMemo(
    () => (team ? `Message ${team.name}…` : "Loading…"),
    [team]
  );

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-muted-foreground">Sign in to message this page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-32 pt-3">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/app/teams/${teamId}/page`)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted grid place-items-center text-xs font-bold text-primary shrink-0">
            {team?.logo_url ? <img src={team.logo_url} alt="" className="w-full h-full object-cover" /> : team?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{team?.name || <Skeleton className="h-4 w-32" />}</p>
            <p className="text-[11px] text-muted-foreground">Page · usually replies within a day</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card/40 min-h-[50vh] p-3 md:p-4 flex flex-col gap-2">
        {!threadId && messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-12">
            Start the conversation — your message will go to the page captain.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                  mine ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-background/95 backdrop-blur border-t">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="min-h-[44px] max-h-32 resize-none"
          />
          <Button onClick={send} disabled={!text.trim() || sending} size="icon">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}