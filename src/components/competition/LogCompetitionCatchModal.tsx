import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LogCatchForm, type LogCatchFormData } from "@/components/catches/LogCatchForm";
import { toast } from "sonner";

interface FishSpecies {
  id: string;
  name: string;
  scientific_name: string | null;
  image_url: string | null;
}

interface FishingSpot {
  id: string;
  name: string;
  location_name: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition: { kind: "challenge" | "tournament"; id: string; name: string; speciesId?: string | null };
}

export function LogCompetitionCatchModal({ open, onOpenChange, competition }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [species, setSpecies] = useState<FishSpecies[]>([]);
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [s, sp] = await Promise.all([
        supabase.from("fish_species").select("id, name, scientific_name, image_url").order("name"),
        supabase.from("fishing_spots").select("id, name, location_name").eq("is_public", true).order("name"),
      ]);
      if (s.data) setSpecies(s.data as FishSpecies[]);
      if (sp.data) setSpots(sp.data as FishingSpot[]);
    })();
  }, [open]);

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage.from("catch-photos").upload(path, file, {
      contentType: file.type || undefined,
    });
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    return supabase.storage.from("catch-photos").getPublicUrl(data.path).data.publicUrl;
  };

  const handleSubmit = async (data: LogCatchFormData) => {
    if (!user) return;
    if (!data.coverPhoto && !data.videoFile) {
      toast.error("Trophy photo or video is required");
      return;
    }
    if (!data.species_name && !data.species_id) {
      toast.error("Please select a species");
      return;
    }
    if (!data.weight_lbs && !data.length_in) {
      toast.error("Weight or length is required for competition catches");
      return;
    }

    setIsSubmitting(true);
    try {
      const [coverUrl, measurementUrl, videoUrl] = await Promise.all([
        data.coverPhoto ? uploadFile(data.coverPhoto) : Promise.resolve(null),
        data.measurementPhoto ? uploadFile(data.measurementPhoto) : Promise.resolve(null),
        data.videoFile ? uploadFile(data.videoFile) : Promise.resolve(null),
      ]);
      const additionalUrls =
        data.additionalPhotos.length > 0
          ? (await Promise.all(data.additionalPhotos.map((f) => uploadFile(f)))).filter(
              (u): u is string => !!u,
            )
          : [];

      let speciesName = data.species_name;
      let speciesId: string | null = data.species_id || null;
      if (speciesId) {
        speciesName = species.find((s) => s.id === speciesId)?.name || speciesName;
      } else if (speciesName) {
        const existing = species.find((s) => s.name.toLowerCase() === speciesName.trim().toLowerCase());
        if (existing) {
          speciesId = existing.id;
          speciesName = existing.name;
        }
      }

      const caughtAtISO = data.caught_at ? new Date(data.caught_at).toISOString() : null;

      const payload: Record<string, any> = {
        user_id: user.id,
        species_name: speciesName || null,
        species_id: speciesId,
        fishing_spot_id: data.fishing_spot_id || null,
        location_name: data.custom_spot_name || null,
        weight_lbs: data.weight_lbs ? parseFloat(data.weight_lbs) : null,
        length_in: data.length_in ? parseFloat(data.length_in) : null,
        notes: data.notes || null,
        bait_used: data.bait_used || null,
        caught_at: caughtAtISO,
        catch_status: data.catch_status,
        cover_photo_url: coverUrl,
        measurement_photo_url: measurementUrl,
        video_url: videoUrl,
        general_location: data.general_location || null,
        share_location: data.share_location,
        is_private: data.is_private,
        location_lat: data.location_lat,
        location_lng: data.location_lng,
        catch_method: data.catch_method || null,
        trophy_level: data.trophy_level || null,
        is_estimated_size: data.is_estimated_size,
        // Competition context — trigger forces approval_status=pending
      };
      if (competition.kind === "challenge") payload.challenge_id = competition.id;
      else payload.tournament_id = competition.id;

      const { data: inserted, error } = await supabase
        .from("catches")
        .insert(payload as any)
        .select("id")
        .single();
      if (error) throw error;

      if (inserted?.id && additionalUrls.length > 0) {
        await supabase.from("catch_photos").insert(
          additionalUrls.map((url) => ({
            catch_id: inserted.id,
            photo_url: url,
            photo_type: "general" as const,
          })),
        );
      }

      toast.success("Submitted! An admin will review your catch shortly.");
      qc.invalidateQueries({ queryKey: ["my-competition-catches", competition.kind, competition.id, user.id] });
      onOpenChange(false);
    } catch (err: any) {
      console.error("Submit competition catch error:", err);
      toast.error(err?.message || "Failed to submit catch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 md:p-6">
        <div className="mb-4">
          <div className="text-xs uppercase tracking-wider text-primary font-semibold">
            {competition.kind === "challenge" ? "Challenge submission" : "Tournament submission"}
          </div>
          <h2 className="text-xl font-bold">{competition.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your catch goes to the admin queue. It only counts once approved.
          </p>
        </div>
        <LogCatchForm
          species={species}
          spots={spots}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onDiscard={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
