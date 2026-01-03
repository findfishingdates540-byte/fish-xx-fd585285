import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Fish,
  Scale,
  Ruler,
  MapPin,
  Calendar,
  Camera,
  X,
  Loader2,
  Trash2,
  MoreVertical,
  Share2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreatePost } from "@/hooks/use-feed";

interface Catch {
  id: string;
  species_name: string | null;
  species_id: string | null;
  weight_kg: number | null;
  length_cm: number | null;
  photos: string[] | null;
  notes: string | null;
  bait_used: string | null;
  gear_used: string[] | null;
  caught_at: string | null;
  location_lat: number | null;
  location_lng: number | null;
  fishing_spot_id: string | null;
  created_at: string;
}

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

export default function Catches() {
  const { user } = useAuth();
  const [catches, setCatches] = useState<Catch[]>([]);
  const [species, setSpecies] = useState<FishSpecies[]>([]);
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    species_name: "",
    species_id: "",
    fishing_spot_id: "",
    weight_kg: "",
    length_cm: "",
    notes: "",
    bait_used: "",
    caught_at: new Date().toISOString().split("T")[0],
  });
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  // Fetch catches and species
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [catchesRes, speciesRes, spotsRes] = await Promise.all([
          supabase
            .from("catches")
            .select("*")
            .eq("user_id", user.id)
            .order("caught_at", { ascending: false }),
          supabase.from("fish_species").select("*").order("name"),
          supabase.from("fishing_spots").select("id, name, location_name").eq("is_public", true).order("name"),
        ]);

        if (catchesRes.error) throw catchesRes.error;
        if (speciesRes.error) throw speciesRes.error;
        if (spotsRes.error) throw spotsRes.error;

        setCatches(catchesRes.data || []);
        setSpecies(speciesRes.data || []);
        setSpots(spotsRes.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load catches");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedPhotos.length > 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }

    setSelectedPhotos((prev) => [...prev, ...files]);

    // Create preview URLs
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviewUrls((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!user || selectedPhotos.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const photo of selectedPhotos) {
      const fileExt = photo.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("catch-photos")
        .upload(fileName, photo);

      if (error) {
        console.error("Upload error:", error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("catch-photos")
        .getPublicUrl(data.path);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.species_name && !formData.species_id) {
      toast.error("Please select or enter a species");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photos first
      const photoUrls = await uploadPhotos();

      // Get species name if selected from dropdown
      let speciesName = formData.species_name;
      if (formData.species_id) {
        const selectedSpecies = species.find((s) => s.id === formData.species_id);
        speciesName = selectedSpecies?.name || formData.species_name;
      }

      const { error } = await supabase.from("catches").insert({
        user_id: user.id,
        species_name: speciesName || null,
        species_id: formData.species_id || null,
        fishing_spot_id: formData.fishing_spot_id || null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        length_cm: formData.length_cm ? parseFloat(formData.length_cm) : null,
        notes: formData.notes || null,
        bait_used: formData.bait_used || null,
        caught_at: formData.caught_at ? new Date(formData.caught_at).toISOString() : null,
        photos: photoUrls.length > 0 ? photoUrls : null,
      });

      if (error) throw error;

      toast.success("Catch logged successfully!");
      setIsDialogOpen(false);
      resetForm();

      // Refresh catches
      const { data: newCatches } = await supabase
        .from("catches")
        .select("*")
        .eq("user_id", user.id)
        .order("caught_at", { ascending: false });

      if (newCatches) setCatches(newCatches);
    } catch (err) {
      console.error("Error logging catch:", err);
      toast.error("Failed to log catch");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (catchId: string) => {
    if (!confirm("Are you sure you want to delete this catch?")) return;

    try {
      const { error } = await supabase.from("catches").delete().eq("id", catchId);

      if (error) throw error;

      setCatches((prev) => prev.filter((c) => c.id !== catchId));
      toast.success("Catch deleted");
    } catch (err) {
      console.error("Error deleting catch:", err);
      toast.error("Failed to delete catch");
    }
  };

  const resetForm = () => {
    setFormData({
      species_name: "",
      species_id: "",
      fishing_spot_id: "",
      weight_kg: "",
      length_cm: "",
      notes: "",
      bait_used: "",
      caught_at: new Date().toISOString().split("T")[0],
    });
    setSelectedPhotos([]);
    setPhotoPreviewUrls([]);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Catches</h1>
          <p className="text-muted-foreground">
            {catches.length} {catches.length === 1 ? "catch" : "catches"} logged
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Log Catch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log a New Catch</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Photo Upload */}
              <div>
                <Label className="mb-2 block">Photos (max 5)</Label>
                <div className="flex flex-wrap gap-2">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {selectedPhotos.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <Camera className="h-5 w-5" />
                      <span className="text-xs mt-1">Add</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              {/* Species Selection */}
              <div>
                <Label htmlFor="species">Species</Label>
                <Select
                  value={formData.species_id}
                  onValueChange={(val) => setFormData({ ...formData, species_id: val, species_name: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    {species.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Or enter a custom species name below
                </p>
                <Input
                  placeholder="Custom species name"
                  value={formData.species_name}
                  onChange={(e) => setFormData({ ...formData, species_name: e.target.value, species_id: "" })}
                  className="mt-2"
                />
              </div>

              {/* Fishing Spot Selection */}
              <div>
                <Label htmlFor="spot">Fishing Spot (optional)</Label>
                <Select
                  value={formData.fishing_spot_id || "none"}
                  onValueChange={(val) => setFormData({ ...formData, fishing_spot_id: val === "none" ? "" : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a spot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No spot selected</SelectItem>
                    {spots.map((spot) => (
                      <SelectItem key={spot.id} value={spot.id}>
                        {spot.name} {spot.location_name && `• ${spot.location_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Weight & Length */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="length">Length (in)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={formData.length_cm}
                    onChange={(e) => setFormData({ ...formData, length_cm: e.target.value })}
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <Label htmlFor="date">Date Caught</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.caught_at}
                  onChange={(e) => setFormData({ ...formData, caught_at: e.target.value })}
                />
              </div>

              {/* Bait Used */}
              <div>
                <Label htmlFor="bait">Bait/Lure Used</Label>
                <Input
                  id="bait"
                  placeholder="e.g., Nightcrawlers, Spinner"
                  value={formData.bait_used}
                  onChange={(e) => setFormData({ ...formData, bait_used: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional details about your catch..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging Catch...
                  </>
                ) : (
                  <>
                    <Fish className="h-4 w-4 mr-2" />
                    Log Catch
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Catches Grid */}
      {catches.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-muted/30">
          <Fish className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No catches yet</h3>
          <p className="text-muted-foreground mb-4">
            Start logging your fishing catches to track your progress
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log Your First Catch
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catches.map((catchItem) => (
            <CatchCard
              key={catchItem.id}
              catchData={catchItem}
              onDelete={() => handleDelete(catchItem.id)}
              formatDate={formatDate}
              spots={spots}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Catch Card Component
interface CatchCardProps {
  catchData: Catch;
  onDelete: () => void;
  formatDate: (date: string | null) => string;
  spots: FishingSpot[];
}

function CatchCard({ catchData, onDelete, formatDate, spots }: CatchCardProps) {
  const createPost = useCreatePost();
  const [isSharing, setIsSharing] = useState(false);

  const handleShareToFeed = async () => {
    setIsSharing(true);
    try {
      // Get spot name if available
      const spot = spots.find(s => s.id === catchData.fishing_spot_id);
      const locationName = spot?.name || spot?.location_name || undefined;

      await createPost.mutateAsync({
        catchId: catchData.id,
        content: catchData.notes || undefined,
        locationName
      });
      toast.success("Shared to feed!");
    } catch (error) {
      console.error("Failed to share:", error);
      toast.error("Failed to share to feed");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="rounded-xl border overflow-hidden bg-background">
      {/* Image */}
      <div className="relative h-48 bg-muted">
        {catchData.photos?.[0] ? (
          <img
            src={catchData.photos[0]}
            alt={catchData.species_name || "Catch"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Fish className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* More photos indicator */}
        {catchData.photos && catchData.photos.length > 1 && (
          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-0">
            +{catchData.photos.length - 1} more
          </Badge>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleShareToFeed} disabled={isSharing}>
              <Share2 className="h-4 w-4 mr-2" />
              {isSharing ? "Sharing..." : "Share to Feed"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">
          {catchData.species_name || "Unknown Species"}
        </h3>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(catchData.caught_at)}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-2 mb-3">
          {catchData.weight_kg && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Scale className="h-3 w-3" />
              {catchData.weight_kg} lbs
            </Badge>
          )}
          {catchData.length_cm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              {catchData.length_cm} in
            </Badge>
          )}
          {catchData.bait_used && (
            <Badge variant="outline">{catchData.bait_used}</Badge>
          )}
        </div>

        {/* Notes preview */}
        {catchData.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {catchData.notes}
          </p>
        )}
      </div>
    </div>
  );
}
