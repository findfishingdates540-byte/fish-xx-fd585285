import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ApprovalBadge } from '@/components/competition/ApprovalBadge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Fish, Scale, Ruler, MapPin, Calendar } from 'lucide-react';

type Row = {
  id: string;
  species_name: string | null;
  weight_lbs: number | null;
  length_in: number | null;
  cover_photo_url: string | null;
  measurement_photo_url: string | null;
  general_location: string | null;
  caught_at: string | null;
  created_at: string;
  approval_status: string;
  approval_notes: string | null;
  challenge_id: string | null;
  tournament_id: string | null;
  species_id: string | null;
  user: { id: string; display_name: string | null; photos: string[] | null } | null;
  challenge: { id: string; title: string } | null;
  tournament: { id: string; name: string } | null;
};

export default function AdminCompetitionCatches() {
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [kind, setKind] = useState<'challenge' | 'tournament'>('challenge');
  const [rejecting, setRejecting] = useState<Row | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin-competition-catches', kind, tab],
    queryFn: async (): Promise<Row[]> => {
      const col = kind === 'challenge' ? 'challenge_id' : 'tournament_id';
      const { data, error } = await supabase
        .from('catches')
        .select(`
          id, species_name, weight_lbs, length_in, cover_photo_url, measurement_photo_url,
          general_location, caught_at, created_at, approval_status, approval_notes,
          challenge_id, tournament_id, species_id,
          user:profiles!catches_user_id_fkey(id, display_name, photos),
          challenge:fishing_challenges!catches_challenge_id_fkey(id, title),
          tournament:tournaments!catches_tournament_id_fkey(id, name)
        `)
        .not(col, 'is', null)
        .eq('approval_status', tab)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as any) || [];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, status, notes, speciesId }: { id: string; status: 'approved' | 'rejected'; notes?: string; speciesId?: string | null }) => {
      const { error } = await supabase
        .from('catches')
        .update({
          approval_status: status,
          approval_notes: notes || null,
          approved_by: user?.id || null,
          approved_at: new Date().toISOString(),
        } as any)
        .eq('id', id);
      if (error) throw error;
      if (status === 'approved' && speciesId) {
        try { await supabase.rpc('refresh_leaderboard_entries', { p_species_id: speciesId }); } catch {}
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-competition-catches'] });
      toast.success(vars.status === 'approved' ? 'Catch approved' : 'Catch rejected');
      setRejecting(null);
      setRejectReason('');
    },
    onError: (e: any) => toast.error(e?.message || 'Failed'),
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 pt-20 lg:pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Competition Catches</h1>
        <p className="text-sm text-slate-400 mt-1">Review and approve catches submitted to challenges and tournaments.</p>
      </div>

      <Tabs value={kind} onValueChange={(v) => setKind(v as any)} className="mb-4">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="challenge">Challenges</TabsTrigger>
          <TabsTrigger value="tournament">Tournaments</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-4">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full bg-slate-800" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 border border-slate-800 rounded-xl bg-slate-900/50">
              <Fish className="h-12 w-12 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400">No {tab} {kind} submissions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => {
                const comp = r.challenge?.title || r.tournament?.name || '—';
                return (
                  <div key={r.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="md:w-48 shrink-0">
                      {r.cover_photo_url ? (
                        <img src={r.cover_photo_url} alt="" className="w-full h-32 object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-32 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Fish className="h-8 w-8 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white truncate">{r.species_name || 'Unknown species'}</h3>
                          <p className="text-xs text-slate-400 truncate">by {r.user?.display_name || 'Angler'}</p>
                          <p className="text-xs text-cyan-400 truncate mt-0.5">{kind === 'challenge' ? '🏆' : '⚔️'} {comp}</p>
                        </div>
                        <ApprovalBadge status={r.approval_status} notes={r.approval_notes} size="md" />
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-300 mb-3">
                        {r.weight_lbs != null && <Badge variant="secondary" className="bg-slate-800 text-slate-200"><Scale className="h-3 w-3 mr-1" />{r.weight_lbs} lbs</Badge>}
                        {r.length_in != null && <Badge variant="secondary" className="bg-slate-800 text-slate-200"><Ruler className="h-3 w-3 mr-1" />{r.length_in} in</Badge>}
                        {r.general_location && <Badge variant="secondary" className="bg-slate-800 text-slate-200"><MapPin className="h-3 w-3 mr-1" />{r.general_location}</Badge>}
                        {r.caught_at && <Badge variant="secondary" className="bg-slate-800 text-slate-200"><Calendar className="h-3 w-3 mr-1" />{new Date(r.caught_at).toLocaleDateString()}</Badge>}
                      </div>
                      {r.approval_notes && r.approval_status === 'rejected' && (
                        <p className="text-xs text-rose-300 mb-3">Reason: {r.approval_notes}</p>
                      )}
                      {tab === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => decide.mutate({ id: r.id, status: 'approved', speciesId: r.species_id })}
                            disabled={decide.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                            onClick={() => { setRejecting(r); setRejectReason(''); }}
                            disabled={decide.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejecting} onOpenChange={(v) => { if (!v) setRejecting(null); }}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Reject this catch?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">The angler will be notified with your reason.</p>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Photo doesn't show fish clearly, or weight not visible"
            className="bg-slate-800 border-slate-700 text-white"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => rejecting && decide.mutate({ id: rejecting.id, status: 'rejected', notes: rejectReason.trim() || 'Submission did not meet competition requirements.' })}
              disabled={decide.isPending}
            >
              Reject Catch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
