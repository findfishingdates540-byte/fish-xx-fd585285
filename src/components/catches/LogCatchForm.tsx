import { useState, useCallback, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SpeciesCombobox } from "@/components/catches/SpeciesCombobox";
import { LiveCameraCapture, type CaptureMetadata } from "@/components/ui/live-camera-capture";
import { LiveVideoCapture, type VideoCaptureMetadata } from "@/components/ui/live-video-capture";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  MapPin,
  Save,
  Camera,
  Video,
  Trophy,
  Sparkles,
} from "lucide-react";

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

interface LogCatchFormProps {
  species: FishSpecies[];
  spots: FishingSpot[];
  isSubmitting: boolean;
  onSubmit: (data: LogCatchFormData) => void;
  onDiscard: () => void;
}

export interface LogCatchFormData {
  species_name: string;
  species_id: string;
  fishing_spot_id: string;
  custom_spot_name: string;
  weight_lbs: string;
  length_in: string;
  notes: string;
  bait_used: string;
  caught_at: string;
  catch_status: "released" | "harvested";
  general_location: string;
  share_location: boolean;
  is_private: boolean;
  location_lat: number | null;
  location_lng: number | null;
  coverPhoto: File | null;
  measurementPhoto: File | null;
  additionalPhotos: File[];
  videoFile: File | null;
  catch_method: string;
  trophy_level: string;
  is_estimated_size: boolean;
}

export function LogCatchForm({ species, spots, isSubmitting, onSubmit, onDiscard }: LogCatchFormProps) {

  const [formData, setFormData] = useState({
    species_name: "",
    species_id: "",
    fishing_spot_id: "",
    custom_spot_name: "",
    weight_lbs: "",
    length_in: "",
    notes: "",
    bait_used: "",
    caught_at: new Date().toISOString().slice(0, 16),
    catch_status: "released" as "released" | "harvested",
    general_location: "",
    share_location: true,
    is_private: false,
    location_lat: null as number | null,
    location_lng: null as number | null,
    catch_method: "flats",
    trophy_level: "keeper",
    is_estimated_size: false,
  });

  // Scoring config + selected species details
  const [methods, setMethods] = useState<Array<{ key: string; label: string; multiplier: number }>>([]);
  const [bonuses, setBonuses] = useState<Array<{ level: string; label: string; bonus: number }>>([]);
  const [speciesMeta, setSpeciesMeta] = useState<{
    base_score: number | null;
    safe_release: boolean;
    measurement_type: string | null;
    trophy_unit: string | null;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const [m, b] = await Promise.all([
        supabase.from("scoring_catch_methods").select("key,label,multiplier").order("sort_order"),
        supabase.from("scoring_trophy_bonuses").select("level,label,bonus").order("sort_order"),
      ]);
      if (m.data) setMethods(m.data as any);
      if (b.data) setBonuses(b.data as any);
    })();
  }, []);

  useEffect(() => {
    if (!formData.species_id) { setSpeciesMeta(null); return; }
    (async () => {
      const { data } = await supabase
        .from("fish_species")
        .select("base_score,safe_release,measurement_type,trophy_unit")
        .eq("id", formData.species_id)
        .maybeSingle();
      if (data) setSpeciesMeta(data as any);
    })();
  }, [formData.species_id]);

  const previewScore = useMemo(() => {
    const base = speciesMeta?.base_score ?? 0;
    const mult = methods.find((m) => m.key === formData.catch_method)?.multiplier ?? 1;
    const bonus = bonuses.find((b) => b.level === formData.trophy_level)?.bonus ?? 0;
    return Math.round((base * Number(mult) + Number(bonus)) * 100) / 100;
  }, [speciesMeta, methods, bonuses, formData.catch_method, formData.trophy_level]);

  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
  const [measurementPhoto, setMeasurementPhoto] = useState<File | null>(null);
  const [measurementPhotoPreview, setMeasurementPhotoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [trophyMode, setTrophyMode] = useState<"photo" | "video">("photo");

  // Handle live camera capture for trophy photo — auto-fill time, GPS, location
  const handleTrophyCapture = useCallback((data: CaptureMetadata) => {
    setCoverPhoto(data.file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPhotoPreview(reader.result as string);
    reader.readAsDataURL(data.file);

    const localTime = new Date(data.capturedAt).toISOString().slice(0, 16);
    setFormData((prev) => ({
      ...prev,
      caught_at: localTime,
      location_lat: data.locationLat ?? prev.location_lat,
      location_lng: data.locationLng ?? prev.location_lng,
    }));
  }, []);

  const handleMeasurementCapture = useCallback((data: CaptureMetadata) => {
    setMeasurementPhoto(data.file);
    const reader = new FileReader();
    reader.onloadend = () => setMeasurementPhotoPreview(reader.result as string);
    reader.readAsDataURL(data.file);
    // Backfill GPS from measurement capture if trophy didn't capture
    setFormData((prev) => ({
      ...prev,
      location_lat: prev.location_lat ?? data.locationLat,
      location_lng: prev.location_lng ?? data.locationLng,
    }));
  }, []);

  const handleVideoCapture = useCallback((data: VideoCaptureMetadata) => {
    setVideoFile(data.file);
    setFormData((prev) => ({
      ...prev,
      location_lat: prev.location_lat ?? data.locationLat,
      location_lng: prev.location_lng ?? data.locationLng,
    }));
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      coverPhoto,
      measurementPhoto,
      additionalPhotos: [],
      videoFile,
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto pb-24">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-1">Log New Catch</h1>
        <p className="text-sm text-muted-foreground">
          Take a live photo — date, time and GPS are recorded automatically.
        </p>
      </div>

      {/* Trophy Photo or Video */}
      <div className="mb-6">
        <Label className="text-sm font-semibold mb-3 block">
          Catch Showcase (Trophy Shot)
        </Label>
        <div className="inline-flex rounded-lg overflow-hidden border border-border mb-3">
          <button
            type="button"
            onClick={() => setTrophyMode("photo")}
            className={`px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
              trophyMode === "photo"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Camera className="h-3.5 w-3.5" /> Photo
          </button>
          <button
            type="button"
            onClick={() => setTrophyMode("video")}
            className={`px-4 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
              trophyMode === "video"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="h-3.5 w-3.5" /> Video
          </button>
        </div>
        {trophyMode === "photo" ? (
          <LiveCameraCapture
            onCapture={handleTrophyCapture}
            preview={coverPhotoPreview}
            onClear={() => { setCoverPhoto(null); setCoverPhotoPreview(null); }}
            label="Take Trophy Photo"
            sublabel="Camera only — no gallery uploads allowed"
          />
        ) : (
          <LiveVideoCapture
            onCapture={handleVideoCapture}
            onClear={() => setVideoFile(null)}
            label="Record Trophy Video"
            sublabel="Capture the catch in 2K — under 200MB"
          />
        )}
        {(formData.location_lat !== null && formData.location_lng !== null) && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            <MapPin className="h-3 w-3" />
            GPS captured: {formData.location_lat.toFixed(3)}°, {formData.location_lng.toFixed(3)}°
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Species</Label>
            <SpeciesCombobox
              species={species}
              value={
                formData.species_id
                  ? species.find((s) => s.id === formData.species_id)?.name || ""
                  : formData.species_name
              }
              onSelect={(speciesId, speciesName) => {
                if (speciesId) {
                  setFormData({ ...formData, species_id: speciesId, species_name: "" });
                } else {
                  setFormData({ ...formData, species_id: "", species_name: speciesName });
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Length (in)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0.00"
                value={formData.length_in}
                onChange={(e) => setFormData({ ...formData, length_in: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Weight (lb)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.weight_lbs}
                onChange={(e) => setFormData({ ...formData, weight_lbs: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Catch Status</Label>
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, catch_status: "released" })}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  formData.catch_status === "released"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Released
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, catch_status: "harvested" })}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  formData.catch_status === "harvested"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Harvested
              </button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Date & Time</Label>
            <Input
              type="datetime-local"
              value={formData.caught_at}
              onChange={(e) => setFormData({ ...formData, caught_at: e.target.value })}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Catch Method</Label>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setFormData({ ...formData, catch_method: m.key })}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    formData.catch_method === m.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{m.label}</span>
                  <span className="ml-2 shrink-0 tabular-nums">×{Number(m.multiplier).toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" /> Trophy Class
              {speciesMeta?.safe_release && (
                <span className="ml-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600">
                  Safe-release · estimate ok
                </span>
              )}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {bonuses.map((b) => (
                <button
                  key={b.level}
                  type="button"
                  onClick={() => setFormData({ ...formData, trophy_level: b.level })}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium text-center transition-colors ${
                    formData.trophy_level === b.level
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="truncate">{b.label}</div>
                  <div className="text-[10px] opacity-70">+{Number(b.bonus)}</div>
                </button>
              ))}
            </div>
            {speciesMeta?.safe_release && (
              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_estimated_size}
                  onChange={(e) => setFormData({ ...formData, is_estimated_size: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-border text-primary"
                />
                Size is an estimate (no exact measurement taken)
              </label>
            )}
          </div>

          <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-primary/80 font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Score preview
              </div>
              <div className="text-2xl font-bold text-primary mt-0.5 tabular-nums">
                {previewScore.toFixed(2)} pts
              </div>
            </div>
            <div className="text-right text-[11px] text-muted-foreground leading-tight">
              {speciesMeta?.base_score != null ? (
                <>
                  Base {speciesMeta.base_score}
                  {speciesMeta.measurement_type && (
                    <> · {speciesMeta.measurement_type}{speciesMeta.trophy_unit ? ` / ${speciesMeta.trophy_unit}` : ""}</>
                  )}
                </>
              ) : (
                <>Pick a species to score</>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Body of Water</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g., Lake Champlain, VT/NY"
                value={formData.general_location}
                onChange={(e) =>
                  setFormData({ ...formData, general_location: e.target.value, fishing_spot_id: "" })
                }
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Bait / Lure Used</Label>
            <Input
              placeholder="e.g., Live shiner, jig, spinnerbait"
              value={formData.bait_used}
              onChange={(e) => setFormData({ ...formData, bait_used: e.target.value })}
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Verification Photo (Scale/Ruler)
            </Label>
            <LiveCameraCapture
              onCapture={handleMeasurementCapture}
              preview={measurementPhotoPreview}
              onClear={() => { setMeasurementPhoto(null); setMeasurementPhotoPreview(null); }}
              label="Take Measurement Photo"
              sublabel="Show catch against ruler/scale"
              aspectRatio="aspect-[4/3]"
            />
          </div>

          {/* Share Location Toggle */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3 mb-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-primary">Share on Spots Map?</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Let other anglers see your catch location on the community map.
                  Your exact GPS will show as a general area marker.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer rounded-lg bg-muted/60 p-3">
              <input
                type="checkbox"
                checked={formData.share_location}
                onChange={(e) => setFormData({ ...formData, share_location: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">
                {formData.share_location ? '📍 Location will be shared' : '🔒 Location stays private'}
              </span>
            </label>
          </div>

          {/* Private catch toggle */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mt-3">
            <div className="flex items-start gap-3 mb-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-primary">Keep this catch private?</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Private catches are only visible to you. They won't appear on the feed,
                  spot pages, or other anglers' profiles. Your scoreboard rank still counts.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer rounded-lg bg-muted/60 p-3">
              <input
                type="checkbox"
                checked={formData.is_private}
                onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">
                {formData.is_private ? '🔒 Only you can see this catch' : '👥 Visible to other anglers'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Catch Notes */}
      <div className="mt-8">
        <Label className="text-sm font-semibold mb-2 block">Catch Notes / Technique (Optional)</Label>
        <Textarea
          placeholder="Weather conditions, technique used, or the story behind the catch..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
        />
      </div>

      <div className="flex items-center justify-center gap-4 mt-8">
        <Button
          type="button"
          variant="ghost"
          onClick={onDiscard}
          className="text-muted-foreground"
        >
          Discard Draft
        </Button>
        <Button type="submit" disabled={isSubmitting} className="px-8">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Logging...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Log Catch to Board
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
