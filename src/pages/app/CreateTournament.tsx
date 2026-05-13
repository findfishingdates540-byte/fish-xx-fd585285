import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Swords, Lock } from "lucide-react";
import { toast } from "sonner";
import { usePlatformFeePercent } from "@/hooks/use-platform-fee";
import { useCanCreateTournament } from "@/hooks/use-tournament-creator-requirement";

const CreateTournament = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canCreate, requirement, isLoading: gateLoading } = useCanCreateTournament();
  const { data: platformFeePercent = 10 } = usePlatformFeePercent();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("single_elimination");
  const [seeding, setSeeding] = useState("random");
  const [scoring, setScoring] = useState("biggest_catch");
  const [maxParticipants, setMaxParticipants] = useState("16");
  const [entryFeeEnabled, setEntryFeeEnabled] = useState(false);
  const [entryFee, setEntryFee] = useState("5");
  const [prizeType, setPrizeType] = useState<"cash" | "gift_card">("cash");
  const [prizeDescription, setPrizeDescription] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login required");
      if (!title.trim()) throw new Error("Title is required");
      if (!registrationEnd) throw new Error("Registration end date is required");
      if (!startDate) throw new Error("Start date is required");

      const { data, error } = await supabase.from("tournaments").insert({
        title: title.trim(),
        description: description.trim() || null,
        format,
        seeding_method: seeding,
        scoring_method: scoring,
        max_participants: parseInt(maxParticipants),
        entry_fee: entryFeeEnabled && prizeType === "cash" ? parseFloat(entryFee) || 0 : 0,
        entry_fee_enabled: entryFeeEnabled && prizeType === "cash",
        prize_type: prizeType,
        prize_description: prizeDescription.trim() || null,
        gift_card_code: prizeType === "gift_card" ? giftCardCode.trim() || null : null,
        registration_end: new Date(registrationEnd).toISOString(),
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        status: "registration",
        created_by: user.id,
      } as any).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success("Tournament created!");
      navigate(`/app/tournaments/${data.id}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (gateLoading) {
    return <div className="max-w-lg mx-auto px-4 py-12 text-center text-muted-foreground">Loading…</div>;
  }

  if (!canCreate) {
    const requirementLabel =
      requirement === "premium" ? "Premium members" :
      requirement === "verified" ? "Verified users" :
      requirement === "admin" ? "Admins" : "logged-in users";
    return (
      <div className="max-w-lg mx-auto px-4 pb-32">
        <div className="flex items-center gap-3 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Create Tournament</h1>
        </div>
        <div className="rounded-xl border bg-card p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Tournament hosting is restricted</h2>
          <p className="text-sm text-muted-foreground">
            Only {requirementLabel} can create tournaments right now.
          </p>
          {requirement === "premium" && (
            <Button asChild className="w-full">
              <Link to="/pricing">Upgrade to Premium</Link>
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={() => navigate("/app/tournaments")}>
            Back to tournaments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-32">
      <div className="flex items-center gap-3 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Create Tournament</h1>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Spring Bass Showdown" />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tournament details..." rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single_elimination">Single Elimination</SelectItem>
                <SelectItem value="double_elimination">Double Elimination</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Seeding</Label>
            <Select value={seeding} onValueChange={setSeeding}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="ranked">Ranked</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Scoring Method</Label>
            <Select value={scoring} onValueChange={setScoring}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="biggest_catch">Biggest Catch</SelectItem>
                <SelectItem value="total_weight">Total Weight</SelectItem>
                <SelectItem value="most_catches">Most Catches</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Max Participants</Label>
            <Select value={maxParticipants} onValueChange={setMaxParticipants}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="16">16</SelectItem>
                <SelectItem value="32">32</SelectItem>
                <SelectItem value="64">64</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Prize Type</Label>
            <Select value={prizeType} onValueChange={(v) => setPrizeType(v as "cash" | "gift_card")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash (paid pool)</SelectItem>
                <SelectItem value="gift_card">Gift Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prize Description</Label>
            <Input value={prizeDescription} onChange={(e) => setPrizeDescription(e.target.value)} placeholder="$500 cash" />
          </div>
        </div>

        {prizeType === "gift_card" && (
          <div>
            <Label>Gift Card Code (sent to winner)</Label>
            <Input value={giftCardCode} onChange={(e) => setGiftCardCode(e.target.value)} placeholder="XXXX-XXXX-XXXX" />
          </div>
        )}

        {prizeType === "cash" && (
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Charge entry fee</Label>
                <p className="text-xs text-muted-foreground">Players pay via Stripe to register</p>
              </div>
              <Switch checked={entryFeeEnabled} onCheckedChange={setEntryFeeEnabled} />
            </div>
            {entryFeeEnabled && (
              <>
                <div>
                  <Label>Entry Fee ($)</Label>
                  <Input type="number" min="1" step="0.01" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
                </div>
                <div className="text-xs text-muted-foreground rounded-lg bg-background p-3">
                  ℹ️ A {platformFeePercent}% platform fee is deducted from the prize pool.
                  The winner receives {100 - platformFeePercent}% of total entries collected.
                  No fee applies to gift card prizes.
                </div>
              </>
            )}
          </div>
        )}

        <div>
          <Label>Registration Closes *</Label>
          <Input type="datetime-local" value={registrationEnd} onChange={(e) => setRegistrationEnd(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start Date *</Label>
            <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <Button
          className="w-full mt-4"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !title.trim() || !registrationEnd || !startDate}
        >
          {createMutation.isPending ? "Creating..." : "Create Tournament"}
        </Button>
      </div>
    </div>
  );
};

export default CreateTournament;
