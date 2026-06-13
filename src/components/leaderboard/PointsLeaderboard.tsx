import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Medal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Timeframe = "all" | "year" | "month";
type MethodFilter = "all" | "shore" | "surf" | "kayak" | "pier" | "flats" | "private_offshore" | "charter";
type WaterFilter = "all" | "freshwater" | "saltwater";

interface Row { user_id: string; total_score: number; catches: number; }

const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: "all", label: "All-Time" },
  { key: "year", label: "This Year" },
  { key: "month", label: "This Month" },
];

const METHODS: { key: MethodFilter; label: string }[] = [
  { key: "all", label: "All Methods" },
  { key: "shore", label: "Land-Based" },
  { key: "surf", label: "Surf" },
  { key: "kayak", label: "Kayak" },
  { key: "pier", label: "Pier/Jetty" },
  { key: "flats", label: "Flats/Skiff" },
  { key: "private_offshore", label: "Offshore" },
  { key: "charter", label: "Charter" },
];

const WATERS: { key: WaterFilter; label: string }[] = [
  { key: "all", label: "All Water" },
  { key: "freshwater", label: "Freshwater" },
  { key: "saltwater", label: "Saltwater" },
];

export default function PointsLeaderboard() {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<Timeframe>("all");
  const [method, setMethod] = useState<MethodFilter>("all");
  const [water, setWater] = useState<WaterFilter>("all");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["points-leaderboard", timeframe, method, water],
    queryFn: async () => {
      let q = supabase
        .from("catches")
        .select("user_id, computed_score, catch_method, caught_at, is_verified, species:fish_species(water_type)")
        .not("computed_score", "is", null)
        .eq("is_verified", true)
        .limit(2000);

      if (timeframe !== "all") {
        const since = new Date();
        if (timeframe === "year") since.setFullYear(since.getFullYear() - 1);
        if (timeframe === "month") since.setMonth(since.getMonth() - 1);
        q = q.gte("caught_at", since.toISOString());
      }
      if (method !== "all") q = q.eq("catch_method", method);

      const { data, error } = await q;
      if (error) throw error;

      const map = new Map<string, Row>();
      (data || []).forEach((c: any) => {
        if (water !== "all" && c.species?.water_type !== water) return;
        const cur = map.get(c.user_id) || { user_id: c.user_id, total_score: 0, catches: 0 };
        cur.total_score += Number(c.computed_score) || 0;
        cur.catches += 1;
        map.set(c.user_id, cur);
      });
      return Array.from(map.values()).sort((a, b) => b.total_score - a.total_score).slice(0, 25);
    },
  });

  const ids = useMemo(() => rows.map((r) => r.user_id), [rows]);
  const { data: profiles = {} } = useQuery({
    queryKey: ["points-leaderboard-profiles", ids.join(",")],
    queryFn: async () => {
      if (!ids.length) return {};
      const { data } = await supabase.from("profiles_safe").select("id, display_name, photos").in("id", ids);
      const m: Record<string, any> = {};
      (data || []).forEach((p: any) => { m[p.id] = p; });
      return m;
    },
    enabled: ids.length > 0,
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Award className="h-5 w-5 sb-cyan" />
          Points Leaderboard
        </h2>
        <button onClick={() => navigate("/app/scoring-rules")} className="text-xs sb-cyan hover:underline font-medium">
          How scoring works →
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        timeframe={timeframe} setTimeframe={setTimeframe}
        method={method} setMethod={setMethod}
        water={water} setWater={setWater}
      />

      <div className="sb-card overflow-hidden">
        <div className="hidden sm:grid grid-cols-[60px_1fr_100px_120px] gap-2 px-4 py-2.5 bg-[hsl(var(--sb-surface-2))] text-[10px] sb-text-muted uppercase tracking-widest font-semibold">
          <span>Rank</span><span>Angler</span><span>Catches</span><span className="text-right">Points</span>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 bg-[hsl(var(--sb-surface-2))]" />)}</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center sb-text-muted text-sm">No scored catches match these filters yet.</div>
        ) : (
          rows.map((r, i) => {
            const p = profiles[r.user_id];
            const rankColor = i === 0 ? "sb-gold" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-700" : "sb-text-muted";
            return (
              <button key={r.user_id} onClick={() => navigate(`/app/u/${r.user_id}`)} className="w-full flex items-center gap-3 px-4 py-3 border-t sb-border hover:bg-[hsl(var(--sb-surface-2))] transition-colors text-left">
                <span className={`w-8 text-center font-bold text-sm ${rankColor}`}>
                  {i < 3 ? <Medal className={`h-4 w-4 inline ${rankColor}`} /> : `#${i + 1}`}
                </span>
                <Avatar className="h-9 w-9 ring-1 ring-[hsl(var(--sb-border))]">
                  <AvatarImage src={p?.photos?.[0] || ""} />
                  <AvatarFallback className="text-xs bg-[hsl(var(--sb-surface-2))]">{(p?.display_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p?.display_name || "Angler"}</p>
                  <p className="text-[11px] sb-text-muted sm:hidden">{r.catches} catches</p>
                </div>
                <span className="hidden sm:inline text-sm sb-text-muted">{r.catches}</span>
                <div className="text-right shrink-0 min-w-[80px]">
                  <p className="text-sm font-bold sb-cyan">{r.total_score.toFixed(1)}</p>
                  <p className="text-[10px] sb-text-muted uppercase tracking-wider">pts</p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

function FilterBar({
  timeframe, setTimeframe, method, setMethod, water, setWater,
}: {
  timeframe: Timeframe; setTimeframe: (v: Timeframe) => void;
  method: MethodFilter; setMethod: (v: MethodFilter) => void;
  water: WaterFilter; setWater: (v: WaterFilter) => void;
}) {
  const dirty = timeframe !== "all" || method !== "all" || water !== "all";
  const triggerCls = "h-9 text-xs font-semibold bg-[hsl(var(--sb-surface))] border-[hsl(var(--sb-border))] hover:bg-[hsl(var(--sb-surface-2))]";
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Select value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
        <SelectTrigger className={`${triggerCls} w-[130px]`}><SelectValue /></SelectTrigger>
        <SelectContent>
          {TIMEFRAMES.map((o) => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={method} onValueChange={(v) => setMethod(v as MethodFilter)}>
        <SelectTrigger className={`${triggerCls} w-[160px]`}>
          <span className="truncate">Method: {METHODS.find((m) => m.key === method)?.label.replace(/^All Methods$/, "All")}</span>
        </SelectTrigger>
        <SelectContent>
          {METHODS.map((o) => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={water} onValueChange={(v) => setWater(v as WaterFilter)}>
        <SelectTrigger className={`${triggerCls} w-[150px]`}>
          <span className="truncate">Water: {WATERS.find((w) => w.key === water)?.label.replace(/^All Water$/, "All")}</span>
        </SelectTrigger>
        <SelectContent>
          {WATERS.map((o) => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {dirty && (
        <button
          onClick={() => { setTimeframe("all"); setMethod("all"); setWater("all"); }}
          className="text-xs sb-text-muted hover:text-foreground underline ml-auto"
        >
          Reset
        </button>
      )}
    </div>
  );
}