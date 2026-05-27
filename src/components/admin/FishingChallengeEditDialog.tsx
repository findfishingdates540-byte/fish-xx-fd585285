import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  challenge: any | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const toDateInput = (iso?: string | null) =>
  iso ? new Date(iso).toISOString().split("T")[0] : "";

export function FishingChallengeEditDialog({ challenge, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [challengeType, setChallengeType] = useState("largest_fish");
  const [targetSpecies, setTargetSpecies] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [prizeDescription, setPrizeDescription] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [prizeType, setPrizeType] = useState<"cash" | "gift_card">("cash");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [location, setLocation] = useState("");
  const [rules, setRules] = useState("");
  const [isOfficial, setIsOfficial] = useState(false);
  const [isAdminFunded, setIsAdminFunded] = useState(false);
  const [entryFeeEnabled, setEntryFeeEnabled] = useState(false);
  const [entryFee, setEntryFee] = useState("");

  useEffect(() => {
    if (challenge) {
      setTitle(challenge.title ?? "");
      setDescription(challenge.description ?? "");
      setStatus(challenge.status ?? "upcoming");
      setChallengeType(challenge.challenge_type ?? "largest_fish");
      setTargetSpecies(challenge.target_species_name ?? "");
      setStartDate(toDateInput(challenge.start_date));
      setEndDate(toDateInput(challenge.end_date));
      setPrizeDescription(challenge.prize_description ?? "");
      setPrizePool(
        challenge.prizes?.total !== undefined && challenge.prizes?.total !== null
          ? String(challenge.prizes.total)
          : "",
      );
      setPrizeType((challenge.prize_type as any) ?? "cash");
      setMaxParticipants(
        challenge.prizes?.max_participants !== undefined && challenge.prizes?.max_participants !== null
          ? String(challenge.prizes.max_participants)
          : "",
      );
      setLocation(challenge.prizes?.location ?? "");
      setRules(challenge.rules?.description ?? "");
      setIsOfficial(!!challenge.is_official);
      setIsAdminFunded(!!challenge.is_admin_funded);
      setEntryFeeEnabled(!!challenge.entry_fee_enabled);
      setEntryFee(
        challenge.entry_fee !== undefined && challenge.entry_fee !== null
          ? String(challenge.entry_fee)
          : "",
      );
    }
  }, [challenge]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!challenge) throw new Error("No challenge");
      if (!title.trim()) throw new Error("Title is required");
      if (!startDate || !endDate) throw new Error("Start and end dates are required");
      if (new Date(endDate) <= new Date(startDate)) throw new Error("End must be after start");

      const prizes = { ...(challenge.prizes || {}) };
      if (prizePool.trim() === "") {
        delete prizes.total;
      } else {
        prizes.total = Number(prizePool);
      }
      if (maxParticipants.trim() === "") {
        delete prizes.max_participants;
      } else {
        prizes.max_participants = Number(maxParticipants);
      }
      if (location.trim() === "") {
        delete prizes.location;
      } else {
        prizes.location = location.trim();
      }

      const rulesObj = { ...(challenge.rules || {}) };
      if (rules.trim() === "") {
        delete rulesObj.description;
      } else {
        rulesObj.description = rules.trim();
      }

      const { error } = await supabase
        .from("fishing_challenges")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          status,
          challenge_type: challengeType as any,
          target_species_name: targetSpecies.trim() || null,
          start_date: startDate,
          end_date: endDate,
          prize_description: prizeDescription.trim() || null,
          prizes,
          rules: rulesObj,
          prize_type: prizeType,
          is_official: isOfficial,
          entry_fee_enabled: entryFeeEnabled,
          entry_fee: entryFeeEnabled ? Number(entryFee) || 0 : 0,
          is_admin_funded: !entryFeeEnabled ? isAdminFunded : false,
        } as any)
        .eq("id", challenge.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Challenge updated");
      qc.invalidateQueries({ queryKey: ["admin-fishing-challenges"] });
      qc.invalidateQueries({ queryKey: ["fishing-challenges"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message || "Update failed"),
  });

  if (!challenge) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit fishing challenge</DialogTitle>
          <DialogDescription className="text-xs">{challenge.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">End date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
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
              <Label className="text-xs">Type</Label>
              <Select value={challengeType} onValueChange={setChallengeType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="largest_fish">Largest Fish</SelectItem>
                  <SelectItem value="most_caught">Most Caught</SelectItem>
                  <SelectItem value="total_weight">Total Weight</SelectItem>
                  <SelectItem value="species_variety">Species Variety</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Target species</Label>
            <Input value={targetSpecies} onChange={(e) => setTargetSpecies(e.target.value)} placeholder="Any species" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lake Erie, Ohio" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Prize type</Label>
              <Select value={prizeType} onValueChange={(v) => setPrizeType(v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gift_card">Gift card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Max participants</Label>
              <Input type="number" min="0" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} placeholder="Unlimited" className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Prize description</Label>
            <Input value={prizeDescription} onChange={(e) => setPrizeDescription(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Prize pool ($)</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={prizePool}
              onChange={(e) => setPrizePool(e.target.value)}
              placeholder="0"
              className="mt-1"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-xs">Entry fee enabled</Label>
              <p className="text-[11px] text-muted-foreground">Participants pay to join</p>
            </div>
            <Switch checked={entryFeeEnabled} onCheckedChange={setEntryFeeEnabled} />
          </div>
          {entryFeeEnabled && (
            <div>
              <Label className="text-xs">Entry fee ($)</Label>
              <Input type="number" min="0" step="0.01" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} placeholder="5" className="mt-1" />
            </div>
          )}
          {!entryFeeEnabled && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-xs">Admin funded</Label>
                <p className="text-[11px] text-muted-foreground">Prize pool funded by the platform</p>
              </div>
              <Switch checked={isAdminFunded} onCheckedChange={setIsAdminFunded} />
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-xs">Official challenge</Label>
              <p className="text-[11px] text-muted-foreground">Marked as platform-official</p>
            </div>
            <Switch checked={isOfficial} onCheckedChange={setIsOfficial} />
          </div>
          <div>
            <Label className="text-xs">Rules</Label>
            <Textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} placeholder="Outline the rules…" className="mt-1" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}