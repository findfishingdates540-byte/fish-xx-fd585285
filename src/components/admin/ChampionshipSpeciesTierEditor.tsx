import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

type Tier = "common" | "premium";
type Row = {
  id?: string;
  species_id: string | null;
  species_name: string;
  tier: Tier;
  points: number;
  _new?: boolean;
};

export function ChampionshipSpeciesTierEditor({
  championship,
  open,
  onOpenChange,
}: {
  championship: any | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [adding, setAdding] = useState<Tier | null>(null);
  const [search, setSearch] = useState("");

  const { data: tiers = [] } = useQuery({
    queryKey: ["championship-species-tiers", championship?.id],
    enabled: open && !!championship?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("championship_species_tiers")
        .select("*")
        .eq("championship_id", championship.id)
        .order("tier")
        .order("species_name");
      if (error) throw error;
      return data as Row[];
    },
  });

  const { data: species = [] } = useQuery({
    queryKey: ["fish-species-all"],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("fish_species").select("id, name").order("name");
      return (data || []) as { id: string; name: string }[];
    },
  });

  useEffect(() => {
    if (open) setRows(tiers || []);
  }, [tiers, open]);

  const updateRow = (idx: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const removeRow = (idx: number) => setRows((rs) => rs.filter((_, i) => i !== idx));

  const filteredSpecies = useMemo(() => {
    const term = search.trim().toLowerCase();
    const used = new Set(rows.map((r) => (r.species_id || r.species_name.toLowerCase())));
    return species
      .filter((s) => !used.has(s.id) && !used.has(s.name.toLowerCase()))
      .filter((s) => !term || s.name.toLowerCase().includes(term))
      .slice(0, 20);
  }, [species, rows, search]);

  const save = useMutation({
    mutationFn: async () => {
      if (!championship?.id) return;
      // Replace strategy: delete all then insert fresh — small list, simplest correctness.
      const { error: delErr } = await supabase
        .from("championship_species_tiers")
        .delete()
        .eq("championship_id", championship.id);
      if (delErr) throw delErr;
      if (rows.length === 0) return;
      const payload = rows.map((r) => ({
        championship_id: championship.id,
        species_id: r.species_id,
        species_name: r.species_name,
        tier: r.tier,
        points: Number(r.points) || (r.tier === "common" ? 10 : 50),
      }));
      const { error } = await supabase.from("championship_species_tiers").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Species tiers saved");
      qc.invalidateQueries({ queryKey: ["championship-species-tiers", championship?.id] });
      qc.invalidateQueries({ queryKey: ["championship-detail", championship?.id] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  const addSpecies = (s: { id: string; name: string }, tier: Tier) => {
    setRows((rs) => [
      ...rs,
      { species_id: s.id, species_name: s.name, tier, points: tier === "common" ? 10 : 50, _new: true },
    ]);
    setSearch("");
    setAdding(null);
  };

  const renderColumn = (tier: Tier) => {
    const list = rows.map((r, i) => ({ r, i })).filter(({ r }) => r.tier === tier);
    return (
      <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize text-xs">{tier}</Badge>
            <span className="text-xs text-slate-400">{list.length} species</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setAdding(tier)} className="text-cyan-300">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
        <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
          {list.length === 0 && (
            <p className="text-xs text-slate-500 italic px-1 py-2">No species in this tier yet.</p>
          )}
          {list.map(({ r, i }) => (
            <div key={(r.id || r.species_name) + i} className="flex items-center gap-2 px-2 py-1 rounded bg-slate-800/60">
              <span className="flex-1 text-sm text-white truncate" title={r.species_name}>
                {r.species_name}
                {!r.species_id && <span className="text-[10px] text-amber-400 ml-1">(unmatched)</span>}
              </span>
              {r.tier === "common" && (
                <Input
                  type="number"
                  min={0}
                  value={r.points}
                  onChange={(e) => updateRow(i, { points: Number(e.target.value) })}
                  className="h-7 w-16 text-xs"
                />
              )}
              {r.tier === "premium" && (
                <span className="text-[10px] text-slate-400 w-16 text-right">50 / 75 / 100</span>
              )}
              <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-7 w-7 p-0" onClick={() => removeRow(i)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
        {adding === tier && (
          <div className="mt-3 border-t border-slate-700/60 pt-3">
            <Input
              autoFocus
              placeholder="Search species…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
              {filteredSpecies.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full text-left text-xs px-2 py-1 rounded hover:bg-slate-800 text-slate-200"
                  onClick={() => addSpecies(s, tier)}
                >
                  {s.name}
                </button>
              ))}
              {filteredSpecies.length === 0 && (
                <p className="text-[11px] text-slate-500 italic px-2 py-1">No matching species.</p>
              )}
            </div>
            <div className="flex justify-end mt-2">
              <Button size="sm" variant="ghost" onClick={() => { setAdding(null); setSearch(""); }}>Close</Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!championship) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Species tiers · {championship.title}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Common sharks award a flat point value per catch. Premium sharks award 50 / 75 / 100 based on the
          Standard / Large / Trophy size that admins set when approving each catch.
        </p>
        <div className="grid md:grid-cols-2 gap-4 mt-2">
          {renderColumn("common")}
          {renderColumn("premium")}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save tiers"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}