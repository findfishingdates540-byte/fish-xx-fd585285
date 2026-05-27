import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Camera, Plus, Upload, Trash2, Eye, Trophy, Users, DollarSign, Crown, Megaphone, Pencil } from "lucide-react";
import { formatPrizeDescription } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { PhotoChallengeEditDialog } from "@/components/admin/PhotoChallengeEditDialog";

export default function AdminPhotoChallenges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingChallenge, setViewingChallenge] = useState<any>(null);
  const [editingChallenge, setEditingChallenge] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [entryFee, setEntryFee] = useState("5");
  const [prizeType, setPrizeType] = useState("cash");
  const [prizeDescription, setPrizeDescription] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [votingEndDate, setVotingEndDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [payoutNotes, setPayoutNotes] = useState("");

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["admin-photo-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photo_challenges")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = (data || []).map((c: any) => c.id);
      const { data: entries } = await supabase
        .from("photo_challenge_entries")
        .select("challenge_id")
        .in("challenge_id", ids.length > 0 ? ids : ["none"]);

      const countMap: Record<string, number> = {};
      (entries || []).forEach((e: any) => {
        countMap[e.challenge_id] = (countMap[e.challenge_id] || 0) + 1;
      });

      return (data || []).map((c: any) => ({
        ...c,
        entry_count: countMap[c.id] || 0,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!title || !startDate || !endDate || !votingEndDate) {
        throw new Error("Please fill all required fields");
      }
      const { error } = await supabase.from("photo_challenges").insert({
        title,
        description: description || null,
        banner_url: bannerUrl || null,
        entry_fee: isFree ? 0 : (parseFloat(entryFee) || 0),
        prize_type: prizeType,
        prize_description: prizeDescription || null,
        gift_card_code: prizeType === "gift_card" ? (giftCardCode || null) : null,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        voting_end_date: new Date(votingEndDate).toISOString(),
        status: "upcoming",
        created_by: user.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Photo Challenge created!" });
      queryClient.invalidateQueries({ queryKey: ["admin-photo-challenges"] });
      resetForm();
      setCreateOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("photo_challenges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Challenge deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-photo-challenges"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const announceMutation = useMutation({
    mutationFn: async ({ id, force }: { id: string; force: boolean }) => {
      const { data, error } = await supabase.functions.invoke("send-event-announcement-email", {
        body: { event_type: "photo_challenge", event_id: id, force },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.skipped === "already_sent") {
        toast({ title: "Already announced", description: "An announcement email was already sent for this challenge." });
      } else if (data?.skipped === "no_recipients") {
        toast({ title: "No recipients", description: "No eligible members to email." });
      } else {
        toast({ title: "Announcement sent", description: `Emailed ${data?.sent ?? 0} members.` });
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("photo_challenges").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Status updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-photo-challenges"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Fetch entries for viewed challenge
  const { data: viewEntries = [] } = useQuery({
    queryKey: ["admin-challenge-entries", viewingChallenge?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photo_challenge_entries")
        .select("*")
        .eq("challenge_id", viewingChallenge!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data || []).map((e: any) => e.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, photos")
        .in("id", userIds.length > 0 ? userIds : ["none"]);

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => (profileMap[p.id] = p));

      return (data || []).map((e: any) => ({
        ...e,
        profile: profileMap[e.user_id] || null,
      }));
    },
    enabled: !!viewingChallenge?.id,
  });

  // Fetch tally for viewed challenge
  const { data: viewTally = [] } = useQuery({
    queryKey: ["admin-challenge-tally", viewingChallenge?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("tally_photo_challenge_votes", {
        p_challenge_id: viewingChallenge!.id,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!viewingChallenge?.id,
  });

  const setWinnerMutation = useMutation({
    mutationFn: async ({ challengeId, winnerId }: { challengeId: string; winnerId: string }) => {
      const { error } = await supabase
        .from("photo_challenges")
        .update({ winner_id: winnerId, status: "completed" })
        .eq("id", challengeId);
      if (error) throw error;

      // Auto-create prize payout record
      const challenge = challenges.find((c: any) => c.id === challengeId);
      if (challenge) {
        const prizeAmount = challenge.prize_type === "cash"
          ? challenge.entry_fee * (challenge.entry_count || 0) * 0.5
          : 0;

        await supabase.from("prize_payouts").insert({
          winner_id: winnerId,
          challenge_id: challengeId,
          prize_type: challenge.prize_type || "cash",
          prize_amount: prizeAmount,
          prize_description: challenge.prize_description || (prizeAmount > 0 ? `$${prizeAmount.toFixed(0)} cash prize` : null),
          gift_card_code: (challenge as any).gift_card_code || null,
          status: "pending",
          notified_at: new Date().toISOString(),
        } as any);

        // Notify winner
        await supabase.from("notifications").insert({
          user_id: winnerId,
          type: "prize_won",
          title: "🏆 You Won!",
          body: `Congratulations! You won "${challenge.title}"!`,
          data: { challenge_id: challengeId, prize_type: challenge.prize_type },
        });
      }
    },
    onSuccess: () => {
      toast({ title: "Winner set!" });
      queryClient.invalidateQueries({ queryKey: ["admin-photo-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["admin-challenge-tally", viewingChallenge?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-prize-payouts"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setBannerUrl("");
    setIsFree(false);
    setEntryFee("5");
    setPrizeType("cash");
    setPrizeDescription("");
    setGiftCardCode("");
    setStartDate("");
    setEndDate("");
    setVotingEndDate("");
  };

  // Prize payouts query
  const { data: payouts = [] } = useQuery({
    queryKey: ["admin-prize-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prize_payouts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const winnerIds = [...new Set((data || []).map((p: any) => p.winner_id))];
      const challengeIds = [...new Set((data || []).filter((p: any) => p.challenge_id).map((p: any) => p.challenge_id))];

      const [{ data: profiles }, { data: challengeNames }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, photos").in("id", winnerIds.length > 0 ? winnerIds : ["none"]),
        supabase.from("photo_challenges").select("id, title").in("id", challengeIds.length > 0 ? challengeIds : ["none"]),
      ]);

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => (profileMap[p.id] = p));
      const challengeMap: Record<string, string> = {};
      (challengeNames || []).forEach((c: any) => (challengeMap[c.id] = c.title));

      return (data || []).map((p: any) => ({
        ...p,
        winner_profile: profileMap[p.winner_id] || null,
        challenge_title: p.challenge_id ? challengeMap[p.challenge_id] : "Tournament",
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

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/photo-challenge-banners/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("catch-photos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("catch-photos").getPublicUrl(path);
      setBannerUrl(data.publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "submissions_open": return "default";
      case "voting": return "secondary";
      case "completed": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Photo Challenges</h1>
          <p className="text-slate-400 mt-1">Create and manage photo challenges</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" /> New Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" /> Create Photo Challenge
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Banner */}
              <div className="space-y-2">
                <Label>Banner Image</Label>
                {bannerUrl ? (
                  <div className="relative h-32 rounded-lg overflow-hidden">
                    <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    <Button size="sm" variant="secondary" className="absolute bottom-2 right-2" onClick={() => fileRef.current?.click()}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 transition-colors"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">{uploading ? "Uploading..." : "Upload banner"}</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
              </div>

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input placeholder="e.g. Best Bass Shot March 2026" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Theme details, rules..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm">Free entry challenge</Label>
                  <p className="text-[11px] text-muted-foreground">No entry fee. Prize must be admin-funded (cash or gift card).</p>
                </div>
                <Switch checked={isFree} onCheckedChange={setIsFree} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entry Fee ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.50"
                    value={isFree ? "0" : entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    disabled={isFree}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prize Type</Label>
                  <Select value={prizeType} onValueChange={setPrizeType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{isFree ? "Cash (Admin Funded)" : "Cash (Half the Pot)"}</SelectItem>
                      <SelectItem value="gift_card">Gift Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isFree && prizeType === "cash" && (
                <div className="space-y-2">
                  <Label>Prize Description (admin-funded amount)</Label>
                  <Input placeholder="e.g. $100 cash prize" value={prizeDescription} onChange={(e) => setPrizeDescription(e.target.value)} />
                </div>
              )}

              {prizeType === "gift_card" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Prize Description</Label>
                    <Input placeholder="e.g. $50 Bass Pro Gift Card" value={prizeDescription} onChange={(e) => setPrizeDescription(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Gift Card Code</Label>
                    <Input placeholder="Enter the gift card code" value={giftCardCode} onChange={(e) => setGiftCardCode(e.target.value)} />
                    <p className="text-[10px] text-muted-foreground">This code will be revealed to the winner when declared.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Submissions End *</Label>
                  <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Voting End *</Label>
                  <Input type="datetime-local" value={votingEndDate} onChange={(e) => setVotingEndDate(e.target.value)} />
                </div>
              </div>

              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !title || !startDate || !endDate || !votingEndDate}
                className="w-full"
              >
                {createMutation.isPending ? "Creating..." : "Create Photo Challenge"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Challenges Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto [&_th]:text-slate-400 [&_th]:uppercase [&_th]:text-xs [&_td]:text-slate-200 [&_tr]:border-slate-700 [&_tbody_tr:hover]:bg-slate-800/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entry Fee</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Prize Pool</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : challenges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No photo challenges yet</TableCell>
                </TableRow>
              ) : (
                challenges.map((c: any) => {
                  const pool = c.entry_fee * (c.entry_count || 0) * 0.5;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{c.title}</TableCell>
                      <TableCell>
                        {c.status === "completed" ? (
                          <Badge variant={statusColor(c.status)} className="capitalize text-xs">
                            {c.status.replace("_", " ")}
                          </Badge>
                        ) : (
                          <Select
                            value={c.status}
                            onValueChange={(val) => updateStatusMutation.mutate({ id: c.id, status: val })}
                          >
                            <SelectTrigger className="w-[160px] h-8">
                              <Badge variant={statusColor(c.status)} className="capitalize text-xs">
                                {c.status.replace("_", " ")}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upcoming">Upcoming</SelectItem>
                              <SelectItem value="submissions_open">Submissions Open</SelectItem>
                              <SelectItem value="voting">Voting</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>${c.entry_fee}</TableCell>
                      <TableCell>{c.entry_count}</TableCell>
                      <TableCell>${pool.toFixed(0)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(c.start_date), "MMM d")} – {format(new Date(c.end_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingChallenge(c)}
                          title="View entries"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingChallenge(c)}
                          title="Edit challenge"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {c.status !== "completed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-sky-500 hover:text-sky-400"
                            title="Email announcement to all members"
                            disabled={announceMutation.isPending}
                            onClick={() => {
                              if (confirm(`Email an announcement about "${c.title}" to all eligible members? This sends real emails via Resend.`)) {
                                announceMutation.mutate({ id: c.id, force: false });
                              }
                            }}
                          >
                            <Megaphone className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Delete this challenge? This cannot be undone.")) {
                              deleteMutation.mutate(c.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View Entries Dialog */}
      <Dialog open={!!viewingChallenge} onOpenChange={(open) => !open && setViewingChallenge(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> {viewingChallenge?.title} — Entries
            </DialogTitle>
          </DialogHeader>

          {/* Tally / Winner section */}
          {viewTally.length > 0 && (
            <div className="space-y-2 mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-1">
                <Trophy className="h-4 w-4" /> Vote Tally
              </h3>
              {viewTally.slice(0, 5).map((t: any, i: number) => {
                const entry = viewEntries.find((e: any) => e.id === t.entry_id);
                const isCurrentWinner = viewingChallenge?.winner_id === t.user_id;
                return (
                  <div key={t.entry_id} className="flex items-center gap-3 text-sm">
                    <span className="font-bold w-6">#{t.rank}</span>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={entry?.profile?.photos?.[0]} />
                      <AvatarFallback className="text-xs">{entry?.profile?.display_name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate">{entry?.profile?.display_name || "Angler"}</span>
                    <Badge variant="secondary">{Number(t.vote_count)} votes</Badge>
                    {isCurrentWinner ? (
                      <Badge className="gap-1"><Crown className="h-3 w-3" /> Winner</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Set ${entry?.profile?.display_name || "this user"} as the winner?`)) {
                            setWinnerMutation.mutate({ challengeId: viewingChallenge!.id, winnerId: t.user_id });
                          }
                        }}
                        disabled={setWinnerMutation.isPending}
                      >
                        Set Winner
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Entries list */}
          <div className="space-y-3">
            {viewEntries.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No entries yet</p>
            ) : (
              viewEntries.map((e: any) => (
                <div key={e.id} className="flex items-center gap-3 border rounded-lg p-3">
                  <img src={e.photo_url} alt="" className="h-16 w-16 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={e.profile?.photos?.[0]} />
                        <AvatarFallback className="text-[10px]">{e.profile?.display_name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">{e.profile?.display_name || "Angler"}</span>
                    </div>
                    {e.caption && <p className="text-xs text-muted-foreground mt-1 truncate">{e.caption}</p>}
                  </div>
                  <Badge variant={e.has_paid ? "default" : "outline"}>
                    {e.has_paid ? "Paid" : "Unpaid"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Prize Payouts Management */}
      <div className="mt-8 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Trophy className="h-5 w-5" /> Prize Payouts
          </h2>
        </div>
        <div className="overflow-x-auto [&_th]:text-slate-400 [&_th]:uppercase [&_th]:text-xs [&_td]:text-slate-200 [&_tr]:border-slate-700 [&_tbody_tr:hover]:bg-slate-800/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Winner</TableHead>
                <TableHead>Challenge</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount / Prize</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.length === 0 ? (
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
      <PhotoChallengeEditDialog
        challenge={editingChallenge}
        open={!!editingChallenge}
        onOpenChange={(v) => !v && setEditingChallenge(null)}
      />
    </div>
  );
}
