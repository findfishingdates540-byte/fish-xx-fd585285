import { useEffect, useState } from 'react';
import { Award, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface CatchMethod { key: string; label: string; multiplier: number; sort_order: number; }
interface TrophyBonus { level: string; label: string; bonus: number; sort_order: number; }
interface VarietyMilestone { species_count: number; bonus: number; }
interface StreakBonus { streak_type: string; label: string; bonus: number; }

function useScoringConfig() {
  return useQuery({
    queryKey: ['scoring-config'],
    queryFn: async () => {
      const [methods, trophies, variety, streaks] = await Promise.all([
        supabase.from('scoring_catch_methods').select('*').order('sort_order'),
        supabase.from('scoring_trophy_bonuses').select('*').order('sort_order'),
        supabase.from('scoring_variety_milestones').select('*').order('species_count'),
        supabase.from('scoring_streak_bonuses').select('*'),
      ]);
      return {
        methods: (methods.data || []) as CatchMethod[],
        trophies: (trophies.data || []) as TrophyBonus[],
        variety: (variety.data || []) as VarietyMilestone[],
        streaks: (streaks.data || []) as StreakBonus[],
      };
    },
  });
}

export default function AdminScoringSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useScoringConfig();
  const [methods, setMethods] = useState<CatchMethod[]>([]);
  const [trophies, setTrophies] = useState<TrophyBonus[]>([]);
  const [variety, setVariety] = useState<VarietyMilestone[]>([]);
  const [streaks, setStreaks] = useState<StreakBonus[]>([]);

  useEffect(() => {
    if (data) {
      setMethods(data.methods);
      setTrophies(data.trophies);
      setVariety(data.variety);
      setStreaks(data.streaks);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const ops: any[] = [];
      methods.forEach((m) => ops.push(
        supabase.from('scoring_catch_methods').update({ label: m.label, multiplier: m.multiplier, sort_order: m.sort_order }).eq('key', m.key)
      ));
      trophies.forEach((t) => ops.push(
        supabase.from('scoring_trophy_bonuses').update({ label: t.label, bonus: t.bonus, sort_order: t.sort_order }).eq('level', t.level)
      ));
      // Variety + streaks: delete-and-insert for simplicity
      ops.push(supabase.from('scoring_variety_milestones').delete().neq('species_count', -1));
      if (variety.length) ops.push(supabase.from('scoring_variety_milestones').insert(variety));
      streaks.forEach((s) => ops.push(
        supabase.from('scoring_streak_bonuses').update({ label: s.label, bonus: s.bonus }).eq('streak_type', s.streak_type)
      ));
      const results = await Promise.all(ops);
      const firstError = results.find((r: any) => r?.error);
      if (firstError?.error) throw firstError.error;
    },
    onSuccess: () => {
      toast.success('Scoring settings saved');
      qc.invalidateQueries({ queryKey: ['scoring-config'] });
    },
    onError: (e: any) => toast.error(`Failed to save: ${e.message}`),
  });

  if (isLoading) {
    return <div className="p-8 space-y-4"><Skeleton className="h-12 bg-slate-700" /><Skeleton className="h-64 bg-slate-700" /></div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Scoring Settings</h1>
          <p className="text-slate-400 mt-1">Tune multipliers, trophy bonuses, variety milestones, and streak rewards used by the IGFA-style scoring engine.</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-6xl">
        {/* Catch Methods */}
        <Section title="Catch Method Multipliers" icon={<Award className="w-5 h-5 text-cyan-400" />}>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_100px_70px] gap-2 text-xs text-slate-400 uppercase tracking-wider font-semibold pb-1">
              <span>Label</span><span>Multiplier</span><span>Order</span>
            </div>
            {methods.map((m, i) => (
              <div key={m.key} className="grid grid-cols-[1fr_100px_70px] gap-2">
                <Input value={m.label} onChange={(e) => setMethods((arr) => arr.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="bg-slate-700 border-slate-600 text-white" />
                <Input type="number" step="0.05" value={m.multiplier} onChange={(e) => setMethods((arr) => arr.map((x, j) => j === i ? { ...x, multiplier: parseFloat(e.target.value) || 0 } : x))} className="bg-slate-700 border-slate-600 text-white" />
                <Input type="number" value={m.sort_order} onChange={(e) => setMethods((arr) => arr.map((x, j) => j === i ? { ...x, sort_order: parseInt(e.target.value) || 0 } : x))} className="bg-slate-700 border-slate-600 text-white" />
              </div>
            ))}
          </div>
        </Section>

        {/* Trophy Bonuses */}
        <Section title="Trophy Class Bonuses" icon={<Award className="w-5 h-5 text-amber-400" />}>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_100px_70px] gap-2 text-xs text-slate-400 uppercase tracking-wider font-semibold pb-1">
              <span>Label</span><span>Bonus</span><span>Order</span>
            </div>
            {trophies.map((t, i) => (
              <div key={t.level} className="grid grid-cols-[1fr_100px_70px] gap-2">
                <Input value={t.label} onChange={(e) => setTrophies((arr) => arr.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="bg-slate-700 border-slate-600 text-white" />
                <Input type="number" step="0.1" value={t.bonus} onChange={(e) => setTrophies((arr) => arr.map((x, j) => j === i ? { ...x, bonus: parseFloat(e.target.value) || 0 } : x))} className="bg-slate-700 border-slate-600 text-white" />
                <Input type="number" value={t.sort_order} onChange={(e) => setTrophies((arr) => arr.map((x, j) => j === i ? { ...x, sort_order: parseInt(e.target.value) || 0 } : x))} className="bg-slate-700 border-slate-600 text-white" />
              </div>
            ))}
          </div>
        </Section>

        {/* Variety Milestones */}
        <Section title="Species Variety Milestones" icon={<Award className="w-5 h-5 text-violet-400" />}>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_40px] gap-2 text-xs text-slate-400 uppercase tracking-wider font-semibold pb-1">
              <span>Species Count</span><span>Bonus</span><span></span>
            </div>
            {variety.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-2">
                <Input type="number" value={v.species_count} onChange={(e) => setVariety((arr) => arr.map((x, j) => j === i ? { ...x, species_count: parseInt(e.target.value) || 0 } : x))} className="bg-slate-700 border-slate-600 text-white" />
                <Input type="number" step="0.1" value={v.bonus} onChange={(e) => setVariety((arr) => arr.map((x, j) => j === i ? { ...x, bonus: parseFloat(e.target.value) || 0 } : x))} className="bg-slate-700 border-slate-600 text-white" />
                <Button variant="ghost" size="icon" onClick={() => setVariety((arr) => arr.filter((_, j) => j !== i))} className="text-slate-400 hover:text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setVariety((arr) => [...arr, { species_count: 0, bonus: 0 }])} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 gap-2">
              <Plus className="w-4 h-4" /> Add Milestone
            </Button>
          </div>
        </Section>

        {/* Streak Bonuses */}
        <Section title="Streak Bonuses" icon={<Award className="w-5 h-5 text-emerald-400" />}>
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_100px] gap-2 text-xs text-slate-400 uppercase tracking-wider font-semibold pb-1">
              <span>Label</span><span>Bonus</span>
            </div>
            {streaks.map((s, i) => (
              <div key={s.streak_type} className="grid grid-cols-[1fr_100px] gap-2">
                <Input value={s.label} onChange={(e) => setStreaks((arr) => arr.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="bg-slate-700 border-slate-600 text-white" />
                <Input type="number" step="0.1" value={s.bonus} onChange={(e) => setStreaks((arr) => arr.map((x, j) => j === i ? { ...x, bonus: parseFloat(e.target.value) || 0 } : x))} className="bg-slate-700 border-slate-600 text-white" />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-slate-700/50">{icon}</div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}