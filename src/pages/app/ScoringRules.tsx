import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Trophy, Sparkles, Search, ShieldCheck, Calculator } from "lucide-react";

type Method = { key: string; label: string; multiplier: number; sort_order: number };
type Bonus = { level: string; label: string; bonus: number; sort_order: number };
type Milestone = { species_count: number; bonus: number };
type Streak = { streak_type: string; label: string; bonus: number };
type Tourn = { key: string; label: string; multiplier_text: string; sort_order: number };
type Species = {
  id: string;
  name: string;
  base_score: number | null;
  category: string | null;
  water_type: string | null;
  measurement_type: string | null;
  safe_release: boolean;
  trophy_quality: number | null;
  trophy_trophy: number | null;
  trophy_exceptional: number | null;
  trophy_unit: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  billfish: "Billfish",
  tuna_pelagic: "Tuna & Pelagics",
  reef_bottom: "Reef & Bottom",
  inshore_saltwater: "Inshore Saltwater",
  shark: "Sharks",
  bass: "Bass",
  trout_salmon: "Trout & Salmon",
  exotic_freshwater: "Exotic Freshwater",
  catfish: "Catfish",
  international_exotic: "International Exotic",
};

export default function ScoringRules() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("all");

  const { data: methods = [] } = useQuery({
    queryKey: ["scoring_catch_methods"],
    queryFn: async () => (await supabase.from("scoring_catch_methods").select("*").order("sort_order")).data as Method[],
  });
  const { data: bonuses = [] } = useQuery({
    queryKey: ["scoring_trophy_bonuses"],
    queryFn: async () => (await supabase.from("scoring_trophy_bonuses").select("*").order("sort_order")).data as Bonus[],
  });
  const { data: milestones = [] } = useQuery({
    queryKey: ["scoring_variety_milestones"],
    queryFn: async () => (await supabase.from("scoring_variety_milestones").select("*").order("species_count")).data as Milestone[],
  });
  const { data: streaks = [] } = useQuery({
    queryKey: ["scoring_streak_bonuses"],
    queryFn: async () => (await supabase.from("scoring_streak_bonuses").select("*")).data as Streak[],
  });
  const { data: tourns = [] } = useQuery({
    queryKey: ["scoring_tournament_multipliers"],
    queryFn: async () => (await supabase.from("scoring_tournament_multipliers").select("*").order("sort_order")).data as Tourn[],
  });
  const { data: species = [] } = useQuery({
    queryKey: ["scoring_species"],
    queryFn: async () =>
      (await supabase
        .from("fish_species")
        .select("id,name,base_score,category,water_type,measurement_type,safe_release,trophy_quality,trophy_trophy,trophy_exceptional,trophy_unit")
        .not("base_score", "is", null)
        .order("base_score", { ascending: false })
      ).data as Species[],
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (species || []).filter((s) => {
      if (cat !== "all" && s.category !== cat) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [species, search, cat]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (species || []).forEach((s) => s.category && set.add(s.category));
    return Array.from(set).sort();
  }, [species]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 space-y-8">
      <header className="space-y-2">
        <Badge className="bg-primary/15 text-primary border-primary/30">Fish-X IGFA Scoring</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Scoring System &amp; Rules</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Fair, skill-rewarding scoring across every fishing style. Shore anglers compete with offshore crews; trophy
          catches, species variety, streaks and ethical handling all add up.
        </p>
      </header>

      {/* Formula */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Final Score Formula</h2>
        </div>
        <p className="font-mono text-sm bg-muted rounded-md p-3">
          (Base Species Score) × Catch Method Multiplier + Trophy Bonus + Tournament Bonus + Variety Bonus + Streak Bonus
        </p>
      </Card>

      {/* Multipliers & bonuses grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Catch Method Multipliers</h3>
          <ul className="space-y-1.5 text-sm">
            {methods.map((m) => (
              <li key={m.key} className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
                <span>{m.label}</span>
                <span className="font-mono tabular-nums text-primary">×{Number(m.multiplier).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">Shore-based anglers get the highest multipliers — designed to keep land-based fishing competitive with charter / offshore.</p>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-1.5"><Trophy className="h-4 w-4" />Trophy Bonuses</h3>
          <ul className="space-y-1.5 text-sm">
            {bonuses.map((b) => (
              <li key={b.level} className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
                <span>{b.label}</span>
                <span className="font-mono tabular-nums text-primary">+{Number(b.bonus)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">Bonus capped at +2. Trophy class is verified by measurement photo, video, or estimate for safe-release species.</p>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-1.5"><Sparkles className="h-4 w-4" />Species Variety Milestones</h3>
          <ul className="space-y-1.5 text-sm">
            {milestones.map((m) => (
              <li key={m.species_count} className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
                <span>{m.species_count} unique species</span>
                <span className="font-mono tabular-nums text-primary">+{Number(m.bonus)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Streak Bonuses</h3>
          <ul className="space-y-1.5 text-sm">
            {streaks.map((s) => (
              <li key={s.streak_type} className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
                <span>{s.label}</span>
                <span className="font-mono tabular-nums text-primary">+{Number(s.bonus)}{s.streak_type === "daily" ? "/day" : ""}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 md:col-span-2">
          <h3 className="font-semibold mb-3">Tournament Multipliers</h3>
          <ul className="grid sm:grid-cols-2 gap-y-1.5 text-sm">
            {tourns.map((t) => (
              <li key={t.key} className="flex items-center justify-between pr-4">
                <span>{t.label}</span>
                <span className="font-mono text-primary">{t.multiplier_text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Measurement standards */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3">IGFA Measurement Standards</h3>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div>
            <div className="font-medium">Total Length (TL)</div>
            <p className="text-muted-foreground text-xs mt-1">Nose to longest tail tip. Most freshwater and inshore species.</p>
          </div>
          <div>
            <div className="font-medium">Fork Length (FL)</div>
            <p className="text-muted-foreground text-xs mt-1">Nose to tail fork. Tuna, mackerel, pelagics, some sharks.</p>
          </div>
          <div>
            <div className="font-medium">Lower Jaw Fork Length (LJFL)</div>
            <p className="text-muted-foreground text-xs mt-1">Lower jaw tip to tail fork. Billfish, swordfish, marlin.</p>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs">
          <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Safe-release species (tarpon, billfish, sharks, goliath grouper, giant tuna, swordfish, GT, large rays, arapaima)
            don't require measurement — photo/video + estimated class is enough.
          </span>
        </div>
      </Card>

      {/* Species table */}
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="font-semibold">Species Scoreboard ({filtered.length})</h3>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search species…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 w-56"
              />
            </div>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2 pr-3">Species</th>
                <th className="text-left pr-3">Category</th>
                <th className="text-left pr-3">Water</th>
                <th className="text-center pr-3">Score</th>
                <th className="text-center pr-3">Measure</th>
                <th className="text-left pr-3">Trophy thresholds</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/40 hover:bg-muted/40">
                  <td className="py-2 pr-3 font-medium flex items-center gap-1.5">
                    {s.name}
                    {s.safe_release && (
                      <span title="Safe-release species" className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600">SR</span>
                    )}
                  </td>
                  <td className="pr-3 text-muted-foreground text-xs">{s.category ? (CATEGORY_LABELS[s.category] ?? s.category) : "—"}</td>
                  <td className="pr-3 text-xs capitalize">{s.water_type ?? "—"}</td>
                  <td className="text-center pr-3">
                    <span className="inline-flex items-center justify-center min-w-7 h-7 rounded-full bg-primary/10 text-primary font-bold tabular-nums">
                      {s.base_score ?? "—"}
                    </span>
                  </td>
                  <td className="text-center pr-3 text-xs font-mono">{s.measurement_type ?? "—"}</td>
                  <td className="pr-3 text-xs">
                    {s.trophy_quality != null
                      ? `${s.trophy_quality} / ${s.trophy_trophy} / ${s.trophy_exceptional}+ ${s.trophy_unit ?? ""}`
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">No species match this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}