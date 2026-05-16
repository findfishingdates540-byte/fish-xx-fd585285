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
  tournament: {
    id: string;
    title: string;
    format: string;
    scoring_method: string;
    seeding_method: string;
    status: string;
  } | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function TournamentEditDialog({ tournament, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [format, setFormat] = useState("single_elimination");
  const [scoring, setScoring] = useState("biggest_catch");
  const [seeding, setSeeding] = useState("random");
  const [recalc, setRecalc] = useState(false);

  useEffect(() => {
    if (tournament) {
      setFormat(tournament.format ?? "single_elimination");
      setScoring(tournament.scoring_method ?? "biggest_catch");
      setSeeding(tournament.seeding_method ?? "random");
      setRecalc(false);
    }
  }, [tournament]);

  const locked = tournament?.status === "completed" || tournament?.status === "cancelled";

  const mutation = useMutation({
    mutationFn: async () => {
      if (!tournament) throw new Error("No tournament");
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
      <DialogContent className="max-w-md">
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