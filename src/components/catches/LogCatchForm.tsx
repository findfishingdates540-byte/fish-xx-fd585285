import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SpeciesCombobox } from "@/components/catches/SpeciesCombobox";
import { LiveCameraCapture, type CaptureMetadata } from "@/components/ui/live-camera-capture";
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
  coverPhoto: File | null;
  measurementPhoto: File | null;
  additionalPhotos: File[];
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
    share_location: false,
  });

  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
  const [measurementPhoto, setMeasurementPhoto] = useState<File | null>(null);
  const [measurementPhotoPreview, setMeasurementPhotoPreview] = useState<string | null>(null);

  // Handle live camera capture for trophy photo — auto-fill time & location
  const handleTrophyCapture = useCallback((data: CaptureMetadata) => {
    setCoverPhoto(data.file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPhotoPreview(reader.result as string);
    reader.readAsDataURL(data.file);

    // Auto-fill caught_at from capture timestamp
    const localTime = new Date(data.capturedAt).toISOString().slice(0, 16);
    setFormData((prev) => ({ ...prev, caught_at: localTime }));
  }, []);

  // Handle live camera capture for measurement photo
  const handleMeasurementCapture = useCallback((data: CaptureMetadata) => {
    setMeasurementPhoto(data.file);
    const reader = new FileReader();
    reader.onloadend = () => setMeasurementPhotoPreview(reader.result as string);
    reader.readAsDataURL(data.file);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      coverPhoto,
      measurementPhoto,
      additionalPhotos: [],
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto pb-24">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-1">Log New Catch</h1>
        <p className="text-sm text-muted-foreground">
          Take a live photo — date, time and GPS are recorded automatically.
        </p>
      </div>

      {/* Trophy Photo - Live Camera Only */}
      <div className="mb-8">
        <Label className="text-sm font-semibold mb-3 block">
          Catch Showcase (Trophy Shot)
        </Label>
        <LiveCameraCapture
          onCapture={handleTrophyCapture}
          preview={coverPhotoPreview}
          onClear={() => { setCoverPhoto(null); setCoverPhotoPreview(null); }}
          label="Take Trophy Photo"
          sublabel="Camera only — no gallery uploads allowed"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* LEFT COLUMN */}
        <div className="space-y-5">
          {/* Species */}
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

          {/* Length & Weight */}
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

          {/* Catch Status - Segmented buttons */}
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

          {/* Date & Time */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Date & Time</Label>
            <Input
              type="datetime-local"
              value={formData.caught_at}
              onChange={(e) => setFormData({ ...formData, caught_at: e.target.value })}
            />
          </div>

          {/* Body of Water */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Body of Water</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Select
                value={formData.fishing_spot_id || "custom"}
                onValueChange={(val) => {
                  if (val === "custom") {
                    setFormData({ ...formData, fishing_spot_id: "" });
                  } else {
                    const spot = spots.find(s => s.id === val);
                    setFormData({
                      ...formData,
                      fishing_spot_id: val,
                      general_location: spot?.location_name || spot?.name || "",
                    });
                  }
                }}
              >
                <SelectTrigger className="pl-9">
                  <SelectValue placeholder="Select body of water" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Enter manually</SelectItem>
                  {spots.map((spot) => (
                    <SelectItem key={spot.id} value={spot.id}>
                      {spot.name}{spot.location_name ? `, ${spot.location_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!formData.fishing_spot_id && (
              <Input
                placeholder="e.g., Lake Champlain, VT/NY"
                value={formData.general_location}
                onChange={(e) => setFormData({ ...formData, general_location: e.target.value })}
                className="mt-2"
              />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          {/* Verification Photo */}
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
        </div>
      </div>

      {/* Catch Notes */}
      <div className="mt-8">
        <Label className="text-sm font-semibold mb-2 block">Catch Notes (Optional)</Label>
        <Textarea
          placeholder="Weather conditions, gear used, or the story behind the catch..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
        />
      </div>

      {/* Action Buttons */}
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
