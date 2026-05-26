import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Loader2, Inbox } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamRole } from "@/hooks/use-team-role";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Thread = {
  id: string;
  visitor_id: string;
  last_message_at: string;
  last_message_preview: string | null;
  unread_for_captain: number;
};

type Msg = { id: string; sender_id: string; content: string; created_at: string };

export default function TeamPageInbox() {
  const { teamId } = useParams<{ teamId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: role, isLoading: roleLoading } = useTeamRole(teamId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const allowed = !!role?.canPostPage;

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

  const { data: threads = [] } = useQuery<Thread[]>({
    queryKey: ["page-inbox", teamId],
    enabled: !!teamId && allowed,
    queryFn: async () => {
      const { data } = await supabase
        .from("team_page_threads")
        .select("id,visitor_id,last_message_at,last_message_preview,unread_for_captain")
        .eq("team_id", teamId!)
        .order("last_message_at", { ascending: false });
      return (data || []) as Thread[];
    },
  });

  // Resolve visitor profiles
  const visitorIds = useMemo(() => Array.from(new Set(threads.map((t) => t.visitor_id))), [threads]);
  const { data: profiles = [] } = useQuery({
    queryKey: ["page-inbox-profiles", visitorIds.join(",")],
    enabled: visitorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("public_profiles")
        .select("id,display_name,photos")
        .in("id", visitorIds);
      return data || [];
    },
  });
  const profileMap = useMemo(() => {
    const m = new Map<string, { display_name: string; photo?: string }>();
    (profiles as any[]).forEach((p) =>
      m.set(p.id, { display_name: p.display_name, photo: p.photos?.[0] })
    );
    return m;
  }, [profiles]);

  const { data: messages = [] } = useQuery<Msg[]>({
    queryKey: ["page-inbox-messages", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data } = await supabase
        .from("team_page_messages")
        .select("id,sender_id,content,created_at")
        .eq("thread_id", activeId!)
        .order("created_at", { ascending: true });
      return (data || []) as Msg[];
    },
  });

  // Mark active thread read for captain
  useEffect(() => {
    if (!activeId) return;
    supabase
      .from("team_page_threads")
      .update({ unread_for_captain: 0 })
      .eq("id", activeId)
      .then(() => qc.invalidateQueries({ queryKey: ["page-inbox", teamId] }));
  }, [activeId, messages.length, qc, teamId]);

  // Realtime
  useEffect(() => {
    if (!teamId) return;
    const ch = supabase
      .channel(`page-inbox-${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_page_threads", filter: `team_id=eq.${teamId}` },
        () => qc.invalidateQueries({ queryKey: ["page-inbox", teamId] })
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_page_messages" },
        (payload: any) => {
          if (payload.new?.thread_id === activeId) {
            qc.invalidateQueries({ queryKey: ["page-inbox-messages", activeId] });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [teamId, activeId, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!text.trim() || !activeId || !user) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from("team_page_messages")
        .insert({ thread_id: activeId, sender_id: user.id, content: text.trim() });
      if (error) throw error;
      setText("");
      qc.invalidateQueries({ queryKey: ["page-inbox-messages", activeId] });
    } catch (e: any) {
      toast.error(e.message || "Failed to send");
    } finally {
      setSending(false);
    }
  }

  if (roleLoading) {
    return <div className="max-w-5xl mx-auto p-6"><Skeleton className="h-32" /></div>;
  }

  if (!allowed) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center py-20">
        <Inbox className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">Only the captain or officers can view the page inbox.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(`/app/teams/${teamId}/page`)}>
          Back to page
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24 pt-3">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/app/teams/${teamId}/page`)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to page
        </Button>
        <h1 className="text-xl md:text-2xl font-bold">
          {team?.name ? `${team.name} · Inbox` : "Inbox"}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[70vh] min-h-[480px]">
        {/* Thread list */}
        <div className="rounded-2xl border bg-card/40 overflow-y-auto">
          {threads.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No messages yet.
            </div>
          )}
          {threads.map((t) => {
            const p = profileMap.get(t.visitor_id);
            const active = t.id === activeId;
            return (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`w-full text-left px-3 py-3 flex items-center gap-3 border-b last:border-0 transition ${
                  active ? "bg-muted/60" : "hover:bg-muted/30"
                }`}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0 grid place-items-center text-xs font-bold text-muted-foreground">
                  {p?.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : (p?.display_name || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{p?.display_name || "Unknown"}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(t.last_message_at), { addSuffix: false })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{t.last_message_preview || "—"}</p>
                </div>
                {t.unread_for_captain > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full h-4 min-w-4 px-1">
                    {t.unread_for_captain}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Thread pane */}
        <div className="rounded-2xl border bg-card/40 flex flex-col">
          {!activeId ? (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-2">
                {messages.map((m) => {
                  const fromVisitor = m.sender_id !== user?.id && m.sender_id !== team?.captain_id ? true : m.sender_id !== user?.id;
                  const mine = !fromVisitor;
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
              <div className="border-t p-3 flex items-end gap-2">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Reply as the page…"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}