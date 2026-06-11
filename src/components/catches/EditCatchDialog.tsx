import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpeciesCombobox } from "@/components/catches/SpeciesCombobox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FishSpecies {
  id: string;
  name: string;
  scientific_name: string | null;
  image_url: string | null;
}

interface EditableCatch {
  id: string;
  species_id: string | null;
  species_name: string | null;
  weight_lbs: number | null;
  length_in: number | null;
  notes: string | null;
  bait_used: string | null;
  caught_at: string | null;
  catch_status: string;
  general_location: string | null;
}

interface EditCatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catchData: EditableCatch;
  species: FishSpecies[];
  onSaved: (updates: Partial<EditableCatch>) => void;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditCatchDialog({
  open,
  onOpenChange,
  catchData,
  species,
  onSaved,
}: EditCatchDialogProps) {
  const [speciesId, setSpeciesId] = useState(catchData.species_id || "");
  const [speciesName, setSpeciesName] = useState(catchData.species_name || "");
  const [weight, setWeight] = useState(
    catchData.weight_lbs != null ? String(catchData.weight_lbs) : "",
  );
  const [length, setLength] = useState(
    catchData.length_in != null ? String(catchData.length_in) : "",
  );
  const [notes, setNotes] = useState(catchData.notes || "");
  const [bait, setBait] = useState(catchData.bait_used || "");
  const [caughtAt, setCaughtAt] = useState(toLocalInput(catchData.caught_at));
  const [status, setStatus] = useState<"released" | "harvested">(
    (catchData.catch_status as "released" | "harvested") || "released",
  );
  const [location, setLocation] = useState(catchData.general_location || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSpeciesId(catchData.species_id || "");
      setSpeciesName(catchData.species_name || "");
      setWeight(catchData.weight_lbs != null ? String(catchData.weight_lbs) : "");
      setLength(catchData.length_in != null ? String(catchData.length_in) : "");
      setNotes(catchData.notes || "");
      setBait(catchData.bait_used || "");
      setCaughtAt(toLocalInput(catchData.caught_at));
      setStatus((catchData.catch_status as "released" | "harvested") || "released");
      setLocation(catchData.general_location || "");
    }
  }, [open, catchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalSpeciesId: string | null = speciesId || null;
      let finalSpeciesName: string | null = speciesName?.trim() || null;

      if (finalSpeciesId) {
        const match = species.find((s) => s.id === finalSpeciesId);
        if (match) finalSpeciesName = match.name;
      } else if (finalSpeciesName) {
        const existing = species.find(
          (s) => s.name.toLowerCase() === finalSpeciesName!.toLowerCase(),
        );
        if (existing) {
          finalSpeciesId = existing.id;
          finalSpeciesName = existing.name;
        }
      }

      const updates = {
        species_id: finalSpeciesId,
        species_name: finalSpeciesName,
        weight_lbs: weight ? parseFloat(weight) : null,
        length_in: length ? parseFloat(length) : null,
        notes: notes || null,
        bait_used: bait || null,
        caught_at: caughtAt ? new Date(caughtAt).toISOString() : null,
        catch_status: status,
        general_location: location || null,
      };

      const { error } = await supabase
        .from("catches")
        .update(updates)
        .eq("id", catchData.id);
      if (error) throw error;

      if (finalSpeciesId) {
        try {
          await supabase.rpc("refresh_leaderboard_entries", {
            p_species_id: finalSpeciesId,
          });
        } catch {}
      }

      toast.success("Catch updated");
      onSaved(updates);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to update catch:", err);
      toast.error("Failed to update catch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit catch</DialogTitle>
          <DialogDescription>
            Fix any details you mistyped. Photos and video can't be changed here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Species</Label>
            <SpeciesCombobox
              species={species}
              value={speciesName || ""}
              onSelect={(id, name) => {
                setSpeciesId(id || "");
                setSpeciesName(name);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-weight">Weight (lbs)</Label>
              <Input
                id="edit-weight"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-length">Length (in)</Label>
              <Input
                id="edit-length"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-bait">Bait used</Label>
            <Input
              id="edit-bait"
              value={bait}
              onChange={(e) => setBait(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="harvested">Harvested</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-caught-at">Caught at</Label>
            <Input
              id="edit-caught-at"
              type="datetime-local"
              value={caughtAt}
              onChange={(e) => setCaughtAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-location">General location</Label>
            <Input
              id="edit-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Lake Okeechobee, FL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}