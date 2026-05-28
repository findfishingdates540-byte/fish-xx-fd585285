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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  tournament: any | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const toDateTimeInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function TournamentEditDialog({ tournament, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState("single_elimination");
  const [scoring, setScoring] = useState("biggest_catch");
  const [seeding, setSeeding] = useState("random");
  const [maxParticipants, setMaxParticipants] = useState("16");
  const [prizeType, setPrizeType] = useState<"cash" | "gift_card">("cash");
  const [entryFeeEnabled, setEntryFeeEnabled] = useState(false);
  const [entryFee, setEntryFee] = useState("");
  const [prizeDescription, setPrizeDescription] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("registration");
  const [recalc, setRecalc] = useState(false);
  const [isJuniorOnly, setIsJuniorOnly] = useState(false);

  useEffect(() => {
    if (tournament) {
      setTitle(tournament.title ?? "");
      setDescription(tournament.description ?? "");
      setFormat(tournament.format ?? "single_elimination");
      setScoring(tournament.scoring_method ?? "biggest_catch");
      setSeeding(tournament.seeding_method ?? "random");
      setMaxParticipants(
        tournament.max_participants !== undefined && tournament.max_participants !== null
          ? String(tournament.max_participants)
          : "16",
      );
      setPrizeType((tournament.prize_type as any) ?? "cash");
      setEntryFeeEnabled(!!tournament.entry_fee_enabled);
      setEntryFee(
        tournament.entry_fee !== undefined && tournament.entry_fee !== null
          ? String(tournament.entry_fee)
          : "",
      );
      setPrizeDescription(tournament.prize_description ?? "");
      setGiftCardCode("");
      if (tournament.prize_type === "gift_card") {
        supabase
          .rpc("get_tournament_gift_card", { p_tournament_id: tournament.id })
          .then(({ data }) => setGiftCardCode((data as string | null) ?? ""));
      }
      setRegistrationEnd(toDateTimeInput(tournament.registration_end));
      setStartDate(toDateTimeInput(tournament.start_date));
      setEndDate(toDateTimeInput(tournament.end_date));
      setStatus(tournament.status ?? "registration");
      setRecalc(false);
      setIsJuniorOnly(!!tournament.is_junior_only);
    }
  }, [tournament]);

  const locked = tournament?.status === "completed" || tournament?.status === "cancelled";

  const mutation = useMutation({
    mutationFn: async () => {
      if (!tournament) throw new Error("No tournament");
      if (!title.trim()) throw new Error("Title is required");

      // 1) Update all editable fields directly
      const { error: updErr } = await supabase
        .from("tournaments")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          max_participants: parseInt(maxParticipants) || 0,
          prize_type: prizeType,
          entry_fee_enabled: entryFeeEnabled && prizeType === "cash",
          entry_fee: entryFeeEnabled && prizeType === "cash" ? Number(entryFee) || 0 : 0,
          prize_description: prizeDescription.trim() || null,
          gift_card_code: prizeType === "gift_card" ? giftCardCode.trim() || null : null,
          registration_end: registrationEnd ? new Date(registrationEnd).toISOString() : null,
          start_date: startDate ? new Date(startDate).toISOString() : null,
          end_date: endDate ? new Date(endDate).toISOString() : null,
          status,
          is_junior_only: isJuniorOnly,
        } as any)
        .eq("id", tournament.id);
      if (updErr) throw updErr;

      // 2) Apply bracket settings (and optionally rebuild) via edge function
      const { data, error } = await supabase.functions.invoke(
        "recalculate-tournament-bracket",
        {
          body: {
            tournament_id: tournament.id,
            format,
            scoring_method: scoring,
            seeding_method: seeding,
            recalculate: recalc,
          },
        },
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        data?.recalculated
          ? `Bracket rebuilt (${data.bracket_size} teams, ${data.rounds_created} rounds)`
          : "Tournament updated",
      );
      qc.invalidateQueries({ queryKey: ["admin-tournaments"] });
      qc.invalidateQueries({ queryKey: ["tournament", tournament?.id] });
      qc.invalidateQueries({ queryKey: ["tournament-rounds", tournament?.id] });
      qc.invalidateQueries({ queryKey: ["tournament-matchups", tournament?.id] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message || "Update failed"),
  });

  if (!tournament) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit tournament</DialogTitle>
          <DialogDescription className="text-xs">
            {tournament.title}
          </DialogDescription>
        </DialogHeader>

        {locked && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Completed/cancelled tournaments cannot be changed.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={locked} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={locked} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Registration end</Label>
              <Input type="datetime-local" value={registrationEnd} onChange={(e) => setRegistrationEnd(e.target.value)} disabled={locked} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Max participants</Label>
              <Input type="number" min="2" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} disabled={locked} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start date</Label>
              <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={locked} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">End date</Label>
              <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={locked} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus} disabled={locked}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="registration">Registration</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Bracket format</Label>
            <Select value={format} onValueChange={setFormat} disabled={locked}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single_elimination">Single elimination</SelectItem>
                <SelectItem value="double_elimination">Double elimination</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Scoring method</Label>
            <Select value={scoring} onValueChange={setScoring} disabled={locked}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="biggest_catch">Biggest catch</SelectItem>
                <SelectItem value="total_weight">Total weight</SelectItem>
                <SelectItem value="most_catches">Most catches</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Seeding</Label>
            <Select value={seeding} onValueChange={setSeeding} disabled={locked}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="ranked">Ranked (by seed #)</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Prize type</Label>
            <Select value={prizeType} onValueChange={(v) => setPrizeType(v as any)} disabled={locked}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="gift_card">Gift card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Prize description</Label>
            <Input value={prizeDescription} onChange={(e) => setPrizeDescription(e.target.value)} disabled={locked} className="mt-1" />
          </div>
          {prizeType === "gift_card" && (
            <div>
              <Label className="text-xs">Gift card code</Label>
              <Input value={giftCardCode} onChange={(e) => setGiftCardCode(e.target.value)} disabled={locked} className="mt-1" />
            </div>
          )}
          {prizeType === "cash" && (
            <>
              <label className="flex items-center gap-2 rounded-lg border p-3 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={entryFeeEnabled}
                  disabled={locked}
                  onChange={(e) => setEntryFeeEnabled(e.target.checked)}
                />
                <span className="font-medium">Entry fee enabled</span>
              </label>
              {entryFeeEnabled && (
                <div>
                  <Label className="text-xs">Entry fee ($)</Label>
                  <Input type="number" min="0" step="0.01" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} disabled={locked} className="mt-1" />
                </div>
              )}
            </>
          )}

          <label className="flex items-start gap-2 rounded-lg border p-3 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={recalc}
              disabled={locked}
              onChange={(e) => setRecalc(e.target.checked)}
              className="mt-0.5"
            />
            <div>
              <p className="font-medium">Recalculate bracket now</p>
              <p className="text-muted-foreground">
                Wipes current rounds & matchups and rebuilds them from registered teams using
                the selected format and seeding. Only allowed if no matchup is already completed.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2 rounded-lg border p-3 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={isJuniorOnly}
              disabled={locked}
              onChange={(e) => setIsJuniorOnly(e.target.checked)}
              className="mt-0.5"
            />
            <div>
              <p className="font-medium">Junior Anglers only (ages 13–17)</p>
              <p className="text-muted-foreground">
                Restricts this tournament to Junior Angler accounts. Adult users will not see it.
              </p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={locked || mutation.isPending}
          >
            {mutation.isPending ? (
              <><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Working…</>
            ) : recalc ? "Save & rebuild" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}