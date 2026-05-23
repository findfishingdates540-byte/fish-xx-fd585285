import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, FileText, Users, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type TeamRow = {
  id: string;
  name: string;
  logo_url: string | null;
  category: string | null;
  skill_level: string | null;
  captain_id: string;
  followers_count: number | null;
  created_at: string;
  captain?: { display_name: string | null; photos: string[] | null } | null;
  member_count?: number;
  page_posts?: number;
  group_posts?: number;
};

type ConfirmTarget =
  | { kind: "team"; team: TeamRow }
  | { kind: "surface"; team: TeamRow; surface: "page" | "group" }
  | null;

export default function AdminTeams() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<ConfirmTarget>(null);

  const { data: teams = [], isLoading } = useQuery<TeamRow[]>({
    queryKey: ["admin-teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fishing_teams")
        .select("id, name, logo_url, category, skill_level, captain_id, followers_count, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const rows = (data || []) as any[];
      if (rows.length === 0) return [];
      const ids = rows.map((r) => r.id);
      const captainIds = Array.from(new Set(rows.map((r) => r.captain_id).filter(Boolean)));
      const [{ data: members }, { data: posts }, { data: captains }] = await Promise.all([
        supabase.from("team_members").select("team_id").in("team_id", ids),
        supabase.from("team_posts").select("team_id, surface").in("team_id", ids),
        supabase.from("profiles").select("id, display_name, photos").in("id", captainIds),
      ]);
      const captainMap: Record<string, any> = {};
      (captains || []).forEach((c: any) => { captainMap[c.id] = c; });
      const memberCounts: Record<string, number> = {};
      (members || []).forEach((m: any) => {
        memberCounts[m.team_id] = (memberCounts[m.team_id] || 0) + 1;
      });
      const pageCounts: Record<string, number> = {};
      const groupCounts: Record<string, number> = {};
      (posts || []).forEach((p: any) => {
        if (p.surface === "page") pageCounts[p.team_id] = (pageCounts[p.team_id] || 0) + 1;
        else if (p.surface === "group") groupCounts[p.team_id] = (groupCounts[p.team_id] || 0) + 1;
      });
      return rows.map((r) => ({
        ...r,
        captain: captainMap[r.captain_id] || null,
        member_count: (memberCounts[r.id] || 0) + 1,
        page_posts: pageCounts[r.id] || 0,
        group_posts: groupCounts[r.id] || 0,
      }));
    },
  });

  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      // Best effort: clean child rows first in case FKs are not cascading.
      await supabase.from("team_post_comments").delete().in(
        "post_id",
        ((await supabase.from("team_posts").select("id").eq("team_id", teamId)).data || []).map((p: any) => p.id),
      );
      await supabase.from("team_post_likes").delete().in(
        "post_id",
        ((await supabase.from("team_posts").select("id").eq("team_id", teamId)).data || []).map((p: any) => p.id),
      );
      await supabase.from("team_posts").delete().eq("team_id", teamId);
      await supabase.from("team_members").delete().eq("team_id", teamId);
      await supabase.from("team_followers").delete().eq("team_id", teamId);
      const { error } = await supabase.from("fishing_teams").delete().eq("id", teamId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-teams"] });
      toast.success("Team deleted");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to delete team"),
  });

  const deleteSurfacePosts = useMutation({
    mutationFn: async (p: { teamId: string; surface: "page" | "group" }) => {
      const { data: postRows } = await supabase
        .from("team_posts")
        .select("id")
        .eq("team_id", p.teamId)
        .eq("surface", p.surface);
      const ids = (postRows || []).map((r: any) => r.id);
      if (ids.length > 0) {
        await supabase.from("team_post_comments").delete().in("post_id", ids);
        await supabase.from("team_post_likes").delete().in("post_id", ids);
      }
      const { error } = await supabase
        .from("team_posts")
        .delete()
        .eq("team_id", p.teamId)
        .eq("surface", p.surface);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-teams"] });
      toast.success(`All ${vars.surface} posts deleted`);
    },
    onError: (e: any) => toast.error(e?.message || "Failed to delete posts"),
  });

  const filtered = teams.filter((t) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(s) ||
      t.captain?.display_name?.toLowerCase().includes(s) ||
      t.category?.toLowerCase().includes(s)
    );
  });

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === "team") {
      deleteTeam.mutate(confirm.team.id);
    } else {
      deleteSurfacePosts.mutate({ teamId: confirm.team.id, surface: confirm.surface });
    }
    setConfirm(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Teams Moderation</h1>
          <p className="text-sm text-slate-400 mt-1">
            Delete teams or clear their page / group content for TOS violations.
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team, captain, category"
            className="pl-9 bg-slate-800/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="[&_th]:text-slate-400 [&_th]:uppercase [&_th]:text-xs [&_td]:text-slate-200 [&_tr]:border-slate-700 [&_tbody_tr:hover]:bg-slate-800/50">
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Captain</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="text-center">Page Posts</TableHead>
                <TableHead className="text-center">Group Posts</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-400">Loading…</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-400">No teams found</TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={t.logo_url || undefined} />
                          <AvatarFallback className="text-xs bg-slate-700 text-slate-200">
                            {t.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate max-w-[180px]">{t.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-[150px]">
                      {t.captain?.display_name || "—"}
                    </TableCell>
                    <TableCell>
                      {t.category ? (
                        <Badge variant="secondary" className="capitalize text-xs">{t.category}</Badge>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm">{t.member_count}</TableCell>
                    <TableCell className="text-center text-sm">{t.page_posts}</TableCell>
                    <TableCell className="text-center text-sm">{t.group_posts}</TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          disabled={!t.page_posts}
                          onClick={() => setConfirm({ kind: "surface", team: t, surface: "page" })}
                        >
                          <FileText className="h-3 w-3 mr-1" /> Clear Page
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          disabled={!t.group_posts}
                          onClick={() => setConfirm({ kind: "surface", team: t, surface: "group" })}
                        >
                          <Users className="h-3 w-3 mr-1" /> Clear Group
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => setConfirm({ kind: "team", team: t })}
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "team"
                ? `Delete "${confirm?.team.name}"?`
                : `Clear all ${confirm?.surface} posts for "${confirm?.team.name}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "team"
                ? "This permanently removes the team, all members, followers, and every post on its page and group. This cannot be undone."
                : `This permanently deletes every ${confirm?.surface} post for this team along with their comments and likes. The team itself stays. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}