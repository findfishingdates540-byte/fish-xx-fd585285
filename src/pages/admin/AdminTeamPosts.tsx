import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function AdminTeamPosts() {
  const qc = useQueryClient();
  const { data: pendingMedia = [] } = useQuery({
    queryKey: ["admin-team-media-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_post_media_reviews")
        .select("*, post:team_posts(*, team:fishing_teams(name))")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const reviewMedia = useMutation({
    mutationFn: async (p: { id: string; postId: string; approve: boolean; notes?: string }) => {
      const { error } = await supabase
        .from("team_post_media_reviews")
        .update({ status: p.approve ? "approved" : "rejected", reviewed_at: new Date().toISOString(), notes: p.notes || null })
        .eq("id", p.id);
      if (error) throw error;
      if (p.approve) {
        const { data: remaining } = await supabase
          .from("team_post_media_reviews")
          .select("id")
          .eq("post_id", p.postId)
          .eq("status", "pending");
        if (!remaining || remaining.length === 0) {
          await supabase.from("team_posts").update({ visibility: "public" }).eq("id", p.postId);
        }
      } else {
        await supabase.from("team_posts").update({ visibility: "hidden", is_hidden: true }).eq("id", p.postId);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-team-media-reviews"] }); toast.success("Media reviewed"); },
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-team-post-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_post_reports")
        .select("*, post:team_posts(*, team:fishing_teams(name))")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-team-post-reports"] });

  const setStatus = useMutation({
    mutationFn: async (p: { id: string; status: "reviewed" | "actioned" | "dismissed" }) => {
      const { error } = await supabase
        .from("team_post_reports")
        .update({ status: p.status, reviewed_at: new Date().toISOString() })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Report updated"); },
  });

  const hidePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("team_posts").update({ is_hidden: true }).eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Post hidden"); },
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("team_posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Post deleted"); },
  });

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-white mb-6">Team Post Reports</h1>
      <Tabs defaultValue="reports">
        <TabsList className="mb-4">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="media">Pending Media ({pendingMedia.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="reports">
      {isLoading ? (
        <p className="text-slate-400">Loading…</p>
      ) : reports.length === 0 ? (
        <p className="text-slate-400">No reports.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <div key={r.id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-slate-300 border-slate-700 capitalize">{r.status}</Badge>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Team: {r.post?.team?.name || "—"} · Surface: {r.post?.surface}
                </span>
              </div>
              <p className="text-sm text-slate-200 mb-1"><b>Reason:</b> {r.reason}</p>
              {r.post?.content && (
                <p className="text-sm text-slate-400 bg-slate-950 rounded p-2 mb-2 whitespace-pre-wrap">{r.post.content}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => hidePost.mutate(r.post_id)}>Hide post</Button>
                <Button size="sm" variant="destructive" onClick={() => deletePost.mutate(r.post_id)}>Delete post</Button>
                <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: r.id, status: "actioned" })}>Mark actioned</Button>
                <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: r.id, status: "dismissed" })}>Dismiss</Button>
              </div>
            </div>
          ))}
        </div>
      )}
        </TabsContent>
        <TabsContent value="media">
          {pendingMedia.length === 0 ? (
            <p className="text-slate-400">No media pending review.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {pendingMedia.map((m: any) => (
                <div key={m.id} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-slate-300 border-slate-700 capitalize">{m.kind}</Badge>
                    <span className="text-xs text-slate-500">{m.post?.team?.name || "—"}</span>
                  </div>
                  {m.kind === "video" ? (
                    <video src={m.url} controls className="w-full rounded bg-black aspect-video" />
                  ) : (
                    <img src={m.url} alt="" className="w-full rounded" />
                  )}
                  {m.post?.content && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3">{m.post.content}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => reviewMedia.mutate({ id: m.id, postId: m.post_id, approve: true })}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => reviewMedia.mutate({ id: m.id, postId: m.post_id, approve: false })}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}