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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  challenge: any | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};

export function PhotoChallengeEditDialog({ challenge, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [votingEndDate, setVotingEndDate] = useState("");
  const [prizeDescription, setPrizeDescription] = useState("");

  useEffect(() => {
    if (challenge) {
      setTitle(challenge.title ?? "");
      setDescription(challenge.description ?? "");
      setStatus(challenge.status ?? "upcoming");
      setStartDate(toLocalInput(challenge.start_date));
      setEndDate(toLocalInput(challenge.end_date));
      setVotingEndDate(toLocalInput(challenge.voting_end_date));
      setPrizeDescription(challenge.prize_description ?? "");
    }
  }, [challenge]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!challenge) throw new Error("No challenge");
      if (!title.trim()) throw new Error("Title is required");
      if (!startDate || !endDate || !votingEndDate) throw new Error("All dates are required");
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      const v = new Date(votingEndDate).getTime();
      if (e <= s) throw new Error("Submissions end must be after start");
      if (v <= e) throw new Error("Voting end must be after submissions end");

      const { error } = await supabase
        .from("photo_challenges")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          status,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          voting_end_date: new Date(votingEndDate).toISOString(),
          prize_description: prizeDescription.trim() || null,
        } as any)
        .eq("id", challenge.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Photo challenge updated");
      qc.invalidateQueries({ queryKey: ["admin-photo-challenges"] });
      qc.invalidateQueries({ queryKey: ["photo-challenges"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message || "Update failed"),
  });

  if (!challenge) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit photo challenge</DialogTitle>
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
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="submissions_open">Submissions Open</SelectItem>
                <SelectItem value="voting">Voting</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Start</Label>
            <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Submissions end</Label>
            <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Voting end</Label>
            <Input type="datetime-local" value={votingEndDate} onChange={(e) => setVotingEndDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Prize description</Label>
            <Input value={prizeDescription} onChange={(e) => setPrizeDescription(e.target.value)} className="mt-1" />
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