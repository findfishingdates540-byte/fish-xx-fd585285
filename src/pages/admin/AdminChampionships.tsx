import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trophy, Plus, Trash2, ExternalLink, Settings2, DollarSign } from "lucide-react";
import { ChampionshipSpeciesTierEditor } from "@/components/admin/ChampionshipSpeciesTierEditor";

type Champ = any;

export default function AdminChampionships() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Champ | null>(null);
  const [tiersFor, setTiersFor] = useState<Champ | null>(null);

  const { data: champs = [], isLoading } = useQuery({
    queryKey: ["admin-championships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fishing_challenges")
        .select("*")
        .eq("is_championship", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Champ[];
    },
  });

  const { data: registrations = {} } = useQuery({
    queryKey: ["admin-championship-registrations", champs.map((c) => c.id).join(",")],
    enabled: champs.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("championship_teams")
        .select("championship_id, calcutta_paid")
        .in("championship_id", champs.map((c) => c.id));
      const map: Record<string, { teams: number; paid: number }> = {};
      (data || []).forEach((r: any) => {
        map[r.championship_id] = map[r.championship_id] || { teams: 0, paid: 0 };
        map[r.championship_id].teams += 1;
        if (r.calcutta_paid) map[r.championship_id].paid += 1;
      });
      return map;
    },
  });

  const finalize = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("finalize_championship_calcutta", {
        p_championship_id: id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(`Calcutta finalized · ${(data?.payouts || []).length} payouts queued`);
      qc.invalidateQueries({ queryKey: ["admin-championships"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to finalize"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fishing_challenges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Championship deleted");
      qc.invalidateQueries({ queryKey: ["admin-championships"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to delete"),
  });

  return (
    <div className="p-4 md:p-8 pt-20 lg:pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6" /> Championships
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Year-long team championships with custom species tiers and optional Calcutta side-pots.
          </p>
        </div>
        <Button onClick={() => setEditing({})} className="bg-cyan-600 hover:bg-cyan-500 text-white">
          <Plus className="w-4 h-4 mr-1" /> New Championship
        </Button>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-300">Title</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-slate-300">Window</TableHead>
              <TableHead className="text-slate-300">Teams</TableHead>
              <TableHead className="text-slate-300">Calcutta</TableHead>
              <TableHead className="text-right text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">Loading…</TableCell></TableRow>
            )}
            {!isLoading && champs.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No championships yet.</TableCell></TableRow>
            )}
            {champs.map((c) => {
              const reg = registrations[c.id] || { teams: 0, paid: 0 };
              const pool = (Number(c.calcutta_entry_fee) || 0) * reg.paid;
              return (
                <TableRow key={c.id} className="border-slate-700">
                  <TableCell className="font-medium text-white">{c.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs text-white border-slate-500">{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-300 text-xs">
                    {c.start_date} → {c.end_date}
                  </TableCell>
                  <TableCell className="text-slate-300 text-xs">{reg.teams}</TableCell>
                  <TableCell className="text-slate-300 text-xs">
                    {reg.paid} paid · ${pool.toLocaleString()} pool
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild size="sm" variant="ghost" className="text-slate-300 hover:text-white" title="Public page">
                        <Link to={`/app/championships/${c.id}`} target="_blank"><ExternalLink className="w-4 h-4" /></Link>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white" title="Species tiers" onClick={() => setTiersFor(c)}>
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white" title="Edit" onClick={() => setEditing(c)}>
                        <Settings2 className="w-4 h-4 opacity-60" />
                      </Button>
                      {c.status === "completed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-emerald-300 hover:text-emerald-200"
                          title="Finalize Calcutta top 3"
                          disabled={finalize.isPending}
                          onClick={() => {
                            if (confirm(`Finalize Calcutta top 3 and queue payouts for "${c.title}"?`)) {
                              finalize.mutate(c.id);
                            }
                          }}
                        >
                          <DollarSign className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => {
                          if (confirm(`Delete "${c.title}"? This cannot be undone.`)) del.mutate(c.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ChampionshipEditDialog
        championship={editing}
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
      />
      <ChampionshipSpeciesTierEditor
        championship={tiersFor}
        open={!!tiersFor}
        onOpenChange={(v) => !v && setTiersFor(null)}
      />
    </div>
  );
}

function ChampionshipEditDialog({
  championship,
  open,
  onOpenChange,
}: {
  championship: Champ | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const isNew = !championship?.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("2026-01-01");
  const [end, setEnd] = useState("2026-12-31");
  const [status, setStatus] = useState("upcoming");
  const [bestN, setBestN] = useState("20");
  const [calcuttaFee, setCalcuttaFee] = useState("100");
  const [prizeDescription, setPrizeDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(championship?.title ?? "");
    setDescription(championship?.description ?? "");
    setStart(championship?.start_date ?? "2026-01-01");
    setEnd(championship?.end_date ?? "2026-12-31");
    setStatus(championship?.status ?? "upcoming");
    setBestN(String(championship?.best_n_catches ?? 20));
    setCalcuttaFee(String(championship?.calcutta_entry_fee ?? 100));
    setPrizeDescription(championship?.prize_description ?? "");
  }, [championship, open]);

  const save = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      const { data: { user } } = await supabase.auth.getUser();
      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        start_date: start,
        end_date: end,
        status,
        best_n_catches: Math.max(parseInt(bestN) || 20, 1),
        calcutta_entry_fee: Number(calcuttaFee) || 0,
        prize_description: prizeDescription.trim() || null,
        is_championship: true,
        challenge_type: "most_caught",
        is_official: true,
        prize_type: "cash",
      };
      if (isNew) {
        payload.created_by = user?.id;
        const { error } = await supabase.from("fishing_challenges").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("fishing_challenges")
          .update(payload)
          .eq("id", championship.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isNew ? "Championship created" : "Championship updated");
      qc.invalidateQueries({ queryKey: ["admin-championships"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "New championship" : "Edit championship"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start date</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">End date</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Best N catches</Label>
              <Input type="number" min="1" value={bestN} onChange={(e) => setBestN(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Calcutta entry fee ($)</Label>
            <Input type="number" min="0" step="1" value={calcuttaFee} onChange={(e) => setCalcuttaFee(e.target.value)} className="mt-1" />
            <p className="text-[11px] text-muted-foreground mt-1">Set to 0 to disable the Calcutta side-pot.</p>
          </div>
          <div>
            <Label className="text-xs">Prize description</Label>
            <Input value={prizeDescription} onChange={(e) => setPrizeDescription(e.target.value)} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : isNew ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}