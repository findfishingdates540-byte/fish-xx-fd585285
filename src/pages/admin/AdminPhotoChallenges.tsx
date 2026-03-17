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
import { Camera, Plus, Upload, Trash2, Eye, Trophy, Users, DollarSign, Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function AdminPhotoChallenges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingChallenge, setViewingChallenge] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [entryFee, setEntryFee] = useState("5");
  const [prizeType, setPrizeType] = useState("cash");
  const [prizeDescription, setPrizeDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [votingEndDate, setVotingEndDate] = useState("");
  const [uploading, setUploading] = useState(false);

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
        entry_fee: parseFloat(entryFee) || 5,
        prize_type: prizeType,
        prize_description: prizeDescription || null,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        voting_end_date: new Date(votingEndDate).toISOString(),
        status: "upcoming",
        created_by: user.id,
      });
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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setBannerUrl("");
    setEntryFee("5");
    setPrizeType("cash");
    setPrizeDescription("");
    setStartDate("");
    setEndDate("");
    setVotingEndDate("");
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `photo-challenge-banners/${user.id}-${Date.now()}.${ext}`;
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
      case "completed": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Photo Challenges</h1>
          <p className="text-muted-foreground text-sm">Create and manage photo challenges</p>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entry Fee ($)</Label>
                  <Input type="number" min="0" step="0.50" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Prize Type</Label>
                  <Select value={prizeType} onValueChange={setPrizeType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash (Half the Pot)</SelectItem>
                      <SelectItem value="gift_card">Gift Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {prizeType === "gift_card" && (
                <div className="space-y-2">
                  <Label>Prize Description</Label>
                  <Input placeholder="e.g. $50 Bass Pro Gift Card" value={prizeDescription} onChange={(e) => setPrizeDescription(e.target.value)} />
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
      <Card>
        <CardContent className="p-0">
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
                      </TableCell>
                      <TableCell>${c.entry_fee}</TableCell>
                      <TableCell>{c.entry_count}</TableCell>
                      <TableCell>${pool.toFixed(0)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(c.start_date), "MMM d")} – {format(new Date(c.end_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
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
        </CardContent>
      </Card>
    </div>
  );
}
