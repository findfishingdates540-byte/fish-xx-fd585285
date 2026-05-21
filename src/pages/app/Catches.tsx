import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LogCatchForm, type LogCatchFormData } from "@/components/catches/LogCatchForm";
import { ApprovalBadge } from "@/components/competition/ApprovalBadge";
import {
  Plus,
  Fish,
  Scale,
  Ruler,
  MapPin,
  Calendar,
  Trash2,
  MoreVertical,
  Share2,
  ArrowLeft,
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
  weight_lbs: number | null;
  length_in: number | null;
  photos: string[] | null;
  notes: string | null;
  bait_used: string | null;
  gear_used: string[] | null;
  caught_at: string | null;
  location_lat: number | null;
  location_lng: number | null;
  fishing_spot_id: string | null;
  created_at: string;
  catch_status: string;
  cover_photo_url: string | null;
  measurement_photo_url: string | null;
  general_location: string | null;
  is_verified: boolean;
  challenge_id?: string | null;
  tournament_id?: string | null;
  approval_status?: string | null;
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
  const queryClient = useQueryClient();
  const [catches, setCatches] = useState<Catch[]>([]);
  const [species, setSpecies] = useState<FishSpecies[]>([]);
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [catchesRes, speciesRes, spotsRes] = await Promise.all([
          supabase.from("catches").select("*").eq("user_id", user.id).order("caught_at", { ascending: false }),
          supabase.from("fish_species").select("*").order("name"),
          supabase.from("fishing_spots").select("id, name, location_name").eq("is_public", true).order("name"),
        ]);
        if (catchesRes.error) throw catchesRes.error;
        if (speciesRes.error) throw speciesRes.error;
        if (spotsRes.error) throw spotsRes.error;
        setCatches((catchesRes.data as Catch[]) || []);
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

  const uploadSingleFile = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { data, error } = await supabase.storage.from("catch-photos").upload(fileName, file, {
      contentType: file.type || undefined,
    });
    if (error) { console.error("Upload error:", error); return null; }
    const { data: urlData } = supabase.storage.from("catch-photos").getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (data: LogCatchFormData) => {
    if (!user) return;
    if (!data.species_name && !data.species_id) {
      toast.error("Please select or enter a species");
      return;
    }

    setIsSubmitting(true);
    try {
      const [coverUrl, measurementUrl, videoUrl] = await Promise.all([
        data.coverPhoto ? uploadSingleFile(data.coverPhoto) : Promise.resolve(null),
        data.measurementPhoto ? uploadSingleFile(data.measurementPhoto) : Promise.resolve(null),
        data.videoFile ? uploadSingleFile(data.videoFile) : Promise.resolve(null),
      ]);

      // Upload additional photos in parallel
      const additionalUrls = data.additionalPhotos.length > 0
        ? (await Promise.all(data.additionalPhotos.map((f) => uploadSingleFile(f)))).filter(
            (u): u is string => !!u,
          )
        : [];

      let speciesName = data.species_name;
      let speciesId: string | null = data.species_id || null;

      if (data.species_id) {
        const selectedSpecies = species.find((s) => s.id === data.species_id);
        speciesName = selectedSpecies?.name || data.species_name;
      } else if (data.species_name) {
        const trimmedName = data.species_name.trim();
        const existingSpecies = species.find(
          (s) => s.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (existingSpecies) {
          speciesId = existingSpecies.id;
          speciesName = existingSpecies.name;
        } else {
          const { data: newSpecies, error: speciesError } = await supabase
            .from("fish_species")
            .insert({ name: trimmedName })
            .select()
            .single();
          if (!speciesError && newSpecies) {
            speciesId = newSpecies.id;
            speciesName = newSpecies.name;
            setSpecies((prev) => [...prev, newSpecies].sort((a, b) => a.name.localeCompare(b.name)));
          }
        }
      }

      const caughtAtISO = data.caught_at ? new Date(data.caught_at).toISOString() : null;

      const { data: insertedCatch, error } = await supabase.from("catches").insert({
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
      } as any).select("id").single();
      if (error) throw error;

      // Persist additional photos to catch_photos
      if (insertedCatch?.id && additionalUrls.length > 0) {
        await supabase.from("catch_photos").insert(
          additionalUrls.map((url) => ({
            catch_id: insertedCatch.id,
            photo_url: url,
            photo_type: "general" as const,
          })),
        );
      }

      // Refresh community map so new catch appears immediately
      queryClient.invalidateQueries({ queryKey: ['shared-catches-map'] });

      if (data.fishing_spot_id && speciesName) {
        try {
          const { data: spotData } = await supabase
            .from("fishing_spots")
            .select("species_available")
            .eq("id", data.fishing_spot_id)
            .single();
          const currentSpecies = spotData?.species_available || [];
          if (!currentSpecies.some((s: string) => s.toLowerCase() === speciesName!.toLowerCase())) {
            await supabase
              .from("fishing_spots")
              .update({ species_available: [...currentSpecies, speciesName] })
              .eq("id", data.fishing_spot_id);
          }
        } catch {}
      }

      if (speciesId) {
        try {
          await supabase.rpc("refresh_leaderboard_entries", { p_species_id: speciesId });
          await supabase.rpc("check_and_award_badges", { p_user_id: user.id });
        } catch {}
      }

      toast.success("Catch logged successfully!");
      setShowForm(false);

      const { data: newCatches } = await supabase
        .from("catches")
        .select("*")
        .eq("user_id", user.id)
        .order("caught_at", { ascending: false });
      if (newCatches) setCatches(newCatches as Catch[]);
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
      const catchToDelete = catches.find((c) => c.id === catchId);
      const { error } = await supabase.from("catches").delete().eq("id", catchId);
      if (error) throw error;
      setCatches((prev) => prev.filter((c) => c.id !== catchId));
      toast.success("Catch deleted");
      if (catchToDelete?.species_id && user) {
        try { await supabase.rpc("refresh_leaderboard_entries", { p_species_id: catchToDelete.species_id }); } catch {}
      }
    } catch (err) {
      toast.error("Failed to delete catch");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Unknown date";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

  // Show full-page form
  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <button
          onClick={() => setShowForm(false)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Catches
        </button>
        <LogCatchForm
          species={species}
          spots={spots}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onDiscard={() => setShowForm(false)}
        />
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
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Log Catch
        </Button>
      </div>

      {/* Catches Grid */}
      {catches.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-muted/30">
          <Fish className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No catches yet</h3>
          <p className="text-muted-foreground mb-4">
            Start logging your fishing catches to track your progress
          </p>
          <Button onClick={() => setShowForm(true)}>
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
      const spot = spots.find((s) => s.id === catchData.fishing_spot_id);
      const locationName = spot?.name || spot?.location_name || undefined;
      await createPost.mutateAsync({
        catchId: catchData.id,
        content: catchData.notes || undefined,
        locationName,
      });
      toast.success("Shared to feed!");
    } catch {
      toast.error("Failed to share to feed");
    } finally {
      setIsSharing(false);
    }
  };

  const displayPhoto = catchData.cover_photo_url || catchData.photos?.[0];

  return (
    <div className="rounded-xl border overflow-hidden bg-background">
      <div className="relative h-48 bg-muted">
        {displayPhoto ? (
          <img src={displayPhoto} alt={catchData.species_name || "Catch"} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Fish className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <Badge
          className={`absolute top-2 left-2 ${
            catchData.catch_status === "released"
              ? "bg-emerald-600/90 text-white border-0"
              : "bg-amber-600/90 text-white border-0"
          }`}
        >
          {catchData.catch_status === "released" ? "🐟 Released" : "🎣 Harvested"}
        </Badge>
        {catchData.is_verified && (
          <Badge className="absolute top-2 left-24 bg-blue-600/90 text-white border-0">✓ Verified</Badge>
        )}
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
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{catchData.species_name || "Unknown Species"}</h3>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(catchData.caught_at)}
          </span>
          {catchData.general_location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {catchData.general_location}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {catchData.weight_lbs && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Scale className="h-3 w-3" />
              {catchData.weight_lbs} lbs
            </Badge>
          )}
          {catchData.length_in && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              {catchData.length_in} in
            </Badge>
          )}
          {catchData.bait_used && <Badge variant="outline">{catchData.bait_used}</Badge>}
        </div>
        {catchData.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">{catchData.notes}</p>
        )}
      </div>
    </div>
  );
}
