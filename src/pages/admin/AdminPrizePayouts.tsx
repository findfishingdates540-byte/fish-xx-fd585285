import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Trophy } from "lucide-react";
import { formatPrizeDescription } from "@/lib/utils";
import { AdminPayoutDetailsDialog } from "@/components/admin/AdminPayoutDetailsDialog";

export default function AdminPrizePayouts() {
  const queryClient = useQueryClient();
  const [payoutNotes, setPayoutNotes] = useState("");
  const [viewingPayoutId, setViewingPayoutId] = useState<string | null>(null);

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ["admin-prize-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prize_payouts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = data || [];
      const winnerIds = [...new Set(rows.map((p: any) => p.winner_id).filter(Boolean))];
      const photoIds = [...new Set(rows.filter((p: any) => p.challenge_id).map((p: any) => p.challenge_id))];
      const fishingIds = [...new Set(rows.filter((p: any) => p.fishing_challenge_id).map((p: any) => p.fishing_challenge_id))];
      const tournamentIds = [...new Set(rows.filter((p: any) => p.tournament_id).map((p: any) => p.tournament_id))];

      const [profilesRes, photoRes, fishingRes, tournamentRes] = await Promise.all([
        supabase.from("profiles").select("id, display_name, photos").in("id", winnerIds.length > 0 ? winnerIds : ["none"]),
        supabase.from("photo_challenges").select("id, title").in("id", photoIds.length > 0 ? photoIds : ["none"]),
        supabase.from("fishing_challenges").select("id, title").in("id", fishingIds.length > 0 ? fishingIds : ["none"]),
        supabase.from("tournaments").select("id, title").in("id", tournamentIds.length > 0 ? tournamentIds : ["none"]),
      ]);

      const profileMap: Record<string, any> = {};
      (profilesRes.data || []).forEach((p: any) => (profileMap[p.id] = p));

      const titleOf = (p: any): string => {
        if (p.challenge_id) {
          const t = (photoRes.data || []).find((c: any) => c.id === p.challenge_id);
          return t?.title || "Photo Challenge";
        }
        if (p.fishing_challenge_id) {
          const t = (fishingRes.data || []).find((c: any) => c.id === p.fishing_challenge_id);
          return t?.title || "Fishing Challenge";
        }
        if (p.tournament_id) {
          const t = (tournamentRes.data || []).find((c: any) => c.id === p.tournament_id);
          return t?.title || "Tournament";
        }
        return "—";
      };

      return rows.map((p: any) => ({
        ...p,
        winner_profile: profileMap[p.winner_id] || null,
        challenge_title: titleOf(p),
      }));
    },
  });

  const markSentMutation = useMutation({
    mutationFn: async ({ payoutId, notes }: { payoutId: string; notes: string }) => {
      const { error } = await supabase
        .from("prize_payouts")
        .update({ status: "sent", sent_at: new Date().toISOString(), admin_notes: notes || null } as any)
        .eq("id", payoutId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Marked as sent" });
      queryClient.invalidateQueries({ queryKey: ["admin-prize-payouts"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Trophy className="h-6 w-6" /> Prize Payouts
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          All winner payouts across photo challenges, fishing challenges, championships, and tournaments.
        </p>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto [&_th]:text-slate-400 [&_th]:uppercase [&_th]:text-xs [&_td]:text-slate-200 [&_tr]:border-slate-700 [&_tbody_tr:hover]:bg-slate-800/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Winner</TableHead>
                <TableHead>Competition</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount / Prize</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No payouts yet</TableCell>
                </TableRow>
              ) : (
                payouts.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={p.winner_profile?.photos?.[0]} />
                          <AvatarFallback className="text-[10px]">{p.winner_profile?.display_name?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{p.winner_profile?.display_name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-[150px]">{p.challenge_title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize text-xs">{p.prize_type === "gift_card" ? "Gift Card" : "Cash"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.prize_type === "cash" ? `$${Number(p.prize_amount || 0).toFixed(0)}` : formatPrizeDescription(p.prize_description)}
                      {p.prize_type === "gift_card" && p.gift_card_code && (
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{p.gift_card_code}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.status === "claimed" ? "default" : "secondary"}
                        className="capitalize text-xs"
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs mr-1"
                        onClick={() => setViewingPayoutId(p.id)}
                      >
                        View Details
                      </Button>
                      {p.status === "pending" && (
                        <div className="flex items-center gap-1 justify-end">
                          <Input
                            placeholder="Notes (optional)"
                            className="h-7 text-xs w-32"
                            value={payoutNotes}
                            onChange={(e) => setPayoutNotes(e.target.value)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              markSentMutation.mutate({ payoutId: p.id, notes: payoutNotes });
                              setPayoutNotes("");
                            }}
                            disabled={markSentMutation.isPending}
                          >
                            Mark Sent
                          </Button>
                        </div>
                      )}
                      {p.admin_notes && (
                        <p className="text-[10px] text-muted-foreground mt-1">{p.admin_notes}</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AdminPayoutDetailsDialog
        payoutId={viewingPayoutId}
        onOpenChange={(v) => !v && setViewingPayoutId(null)}
      />
    </div>
  );
}
