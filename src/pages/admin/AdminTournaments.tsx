import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Swords, Trash2, X, ExternalLink, Search, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { TournamentEditDialog } from "@/components/admin/TournamentEditDialog";

const STATUSES = ["all", "draft", "registration", "seeding", "in_progress", "completed", "cancelled"];

export default function AdminTournaments() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<any>(null);

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["admin-tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = (data || []).map((t: any) => t.id);
      const { data: parts } = await supabase
        .from("tournament_participants")
        .select("tournament_id, has_paid")
        .in("tournament_id", ids.length ? ids : ["none"]);
      const counts: Record<string, { total: number; paid: number }> = {};
      (parts || []).forEach((p: any) => {
        const c = counts[p.tournament_id] || { total: 0, paid: 0 };
        c.total += 1;
        if (p.has_paid) c.paid += 1;
        counts[p.tournament_id] = c;
      });
      return (data || []).map((t: any) => ({
        ...t,
        participant_count: counts[t.id]?.total || 0,
        paid_count: counts[t.id]?.paid || 0,
      }));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tournaments")
        .update({ status: "cancelled" } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tournament cancelled");
      qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tournaments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tournament deleted");
      qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = tournaments.filter((t: any) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Swords className="w-6 h-6" />
            Tournaments
          </h1>
          <p className="text-slate-400 mt-1">Moderate and review all user-created tournaments</p>
        </div>
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
                {s.replace("_", " ")}
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
              <TableHead className="text-slate-300">Format</TableHead>
              <TableHead className="text-slate-300">Players</TableHead>
              <TableHead className="text-slate-300">Entry / Prize</TableHead>
              <TableHead className="text-slate-300">Dates</TableHead>
              <TableHead className="text-right text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-8">Loading…</TableCell></TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-8">No tournaments found</TableCell></TableRow>
            )}
            {filtered.map((t: any) => (
              <TableRow key={t.id} className="border-slate-700">
                <TableCell className="font-medium text-white">{t.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize text-xs">
                    {String(t.status).replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-300 text-xs capitalize">
                  {String(t.format).replace("_", " ")}
                </TableCell>
                <TableCell className="text-slate-300 text-xs">
                  {t.participant_count}/{t.max_participants}
                  {t.entry_fee_enabled && (
                    <span className="text-emerald-400"> ({t.paid_count} paid)</span>
                  )}
                </TableCell>
                <TableCell className="text-slate-300 text-xs">
                  {t.entry_fee_enabled ? `$${t.entry_fee}` : "Free"} → {t.prize_type}
                </TableCell>
                <TableCell className="text-slate-400 text-xs">
                  {t.start_date ? format(new Date(t.start_date), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild size="sm" variant="ghost" className="text-slate-300 hover:text-white">
                      <Link to={`/app/tournaments/${t.id}`} target="_blank">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-300 hover:text-white"
                      onClick={() => setEditing(t)}
                      title="Edit format & scoring"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    {t.status !== "cancelled" && t.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-orange-400 hover:text-orange-300"
                        onClick={() => {
                          if (confirm(`Cancel "${t.title}"?`)) cancelMutation.mutate(t.id);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => {
                        if (confirm(`Delete "${t.title}"? This cannot be undone.`)) deleteMutation.mutate(t.id);
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
      <TournamentEditDialog
        tournament={editing}
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
      />
    </div>
  );
}