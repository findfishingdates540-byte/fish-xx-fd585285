import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trophy, Trash2, ExternalLink, Search, Plus, Megaphone, Pencil } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { FishingChallengeEditDialog } from "@/components/admin/FishingChallengeEditDialog";

const STATUSES = ["all", "upcoming", "active", "completed", "cancelled"];

export default function AdminFishingChallenges() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<any>(null);

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["admin-fishing-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fishing_challenges")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = (data || []).map((c: any) => c.id);
      const { data: parts } = await supabase
        .from("challenge_participants")
        .select("challenge_id")
        .in("challenge_id", ids.length ? ids : ["none"]);
      const counts: Record<string, number> = {};
      (parts || []).forEach((p: any) => {
        counts[p.challenge_id] = (counts[p.challenge_id] || 0) + 1;
      });
      return (data || []).map((c: any) => ({
        ...c,
        participant_count: counts[c.id] || 0,
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fishing_challenges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Challenge deleted");
      qc.invalidateQueries({ queryKey: ["admin-fishing-challenges"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const announceMutation = useMutation({
    mutationFn: async ({ id, force }: { id: string; force: boolean }) => {
      const { data, error } = await supabase.functions.invoke("send-event-announcement-email", {
        body: { event_type: "fishing_challenge", event_id: id, force },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.skipped === "already_sent") toast.info("Announcement already sent.");
      else if (data?.skipped === "no_recipients") toast.info("No eligible recipients.");
      else toast.success(`Announcement sent to ${data?.sent ?? 0} members.`);
    },
    onError: (e: any) => toast.error(e.message || "Failed to send announcement"),
  });

  const filtered = challenges.filter((c: any) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Fishing Challenges
          </h1>
          <p className="text-slate-400 mt-1">Moderate and review all fishing challenges (separate from photo challenges)</p>
        </div>
        <Button asChild className="bg-cyan-600 hover:bg-cyan-500 text-white">
          <Link to="/app/challenges/new" target="_blank" rel="noopener noreferrer">
            <Plus className="w-4 h-4 mr-1" /> New Fishing Challenge
          </Link>
        </Button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-300">Title</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-slate-300">Species</TableHead>
              <TableHead className="text-slate-300">Players</TableHead>
              <TableHead className="text-slate-300">Dates</TableHead>
              <TableHead className="text-right text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">Loading…</TableCell></TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No fishing challenges found</TableCell></TableRow>
            )}
            {filtered.map((c: any) => (
              <TableRow key={c.id} className="border-slate-700">
                <TableCell className="font-medium text-white">{c.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs text-white border-slate-500">
                    {c.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300 text-xs">
                  {c.target_species_name || "—"}
                </TableCell>
                <TableCell className="text-slate-300 text-xs">{c.participant_count}</TableCell>
                <TableCell className="text-slate-400 text-xs">
                  {c.start_date ? format(new Date(c.start_date), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild size="sm" variant="ghost" className="text-slate-300 hover:text-white">
                      <Link to={`/app/challenges/${c.id}`} target="_blank">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-300 hover:text-white"
                      onClick={() => setEditing(c)}
                      title="Edit challenge"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {c.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-sky-300 hover:text-sky-200"
                        title="Email announcement to all members"
                        disabled={announceMutation.isPending}
                        onClick={() => {
                          if (confirm(`Email an announcement about "${c.title}" to all eligible members?`)) {
                            announceMutation.mutate({ id: c.id, force: false });
                          }
                        }}
                      >
                        <Megaphone className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => {
                        if (confirm(`Delete "${c.title}"? This cannot be undone.`)) deleteMutation.mutate(c.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <FishingChallengeEditDialog
        challenge={editing}
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
      />
    </div>
  );
}