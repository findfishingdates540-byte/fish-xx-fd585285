import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LogCatchForm, type LogCatchFormData } from "@/components/catches/LogCatchForm";
import { EditCatchDialog } from "@/components/catches/EditCatchDialog";
import { ApprovalBadge } from "@/components/competition/ApprovalBadge";
import { thumb } from "@/lib/image-url";
import { ExplorerMap, type MapPoint } from "@/components/catches/ExplorerMap";
import { PhotoLightbox, type LightboxPhoto } from "@/components/catches/PhotoLightbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useSavedSpots } from "@/hooks/use-saved-spots";
import { useNavigate } from "react-router-dom";
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
  Pencil,
  Bookmark,
  Images,
  Star,
  Anchor,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
  approval_notes?: string | null;
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
  const navigate = useNavigate();

  // Explorer state
  const [tab, setTab] = useState<"catches" | "spots">("catches");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { savedSpotIds, isLoading: savedLoading } = useSavedSpots();
  const savedIdList = Array.from(savedSpotIds);

  // Saved spots detail
  const { data: savedSpots = [], isLoading: savedSpotsLoading } = useQuery({
    queryKey: ["explorer-saved-spots", savedIdList.sort().join(",")],
    queryFn: async () => {
      if (savedIdList.length === 0) return [];
      const { data } = await supabase
        .from("fishing_spots")
        .select("id, name, location_name, location_lat, location_lng, photos, description, area_type, depth_ft, rating_avg, rating_count, species_available")
        .in("id", savedIdList);
      return data || [];
    },
    enabled: savedIdList.length > 0,
  });

  // Photos for the selected catch
  const { data: extraPhotos = [] } = useQuery({
    queryKey: ["explorer-catch-photos", tab === "catches" ? selectedId : null],
    queryFn: async () => {
      const { data } = await supabase
        .from("catch_photos")
        .select("photo_url, photo_type")
        .eq("catch_id", selectedId!)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: tab === "catches" && !!selectedId,
  });

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

  const q = search.trim().toLowerCase();
  const filteredCatches = q
    ? catches.filter((c) =>
        [c.species_name, c.general_location, c.notes, c.bait_used]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      )
    : catches;
  const filteredSpots = q
    ? savedSpots.filter((sp: any) =>
        [sp.name, sp.location_name, sp.description]
          .filter(Boolean)
          .some((v: string) => String(v).toLowerCase().includes(q)),
      )
    : savedSpots;

  const points: MapPoint[] =
    tab === "catches"
      ? filteredCatches
          .filter((c) => c.location_lat != null && c.location_lng != null)
          .map((c) => ({
            id: c.id,
            lat: Number(c.location_lat),
            lng: Number(c.location_lng),
            label: c.species_name || "Catch",
            sublabel: c.general_location,
            kind: "catch" as const,
          }))
      : filteredSpots.map((sp: any) => ({
          id: sp.id,
          lat: Number(sp.location_lat),
          lng: Number(sp.location_lng),
          label: sp.name,
          sublabel: sp.location_name,
          kind: "spot" as const,
        }));

  const selectedCatch = tab === "catches" ? catches.find((c) => c.id === selectedId) : undefined;
  const selectedSpot: any = tab === "spots" ? savedSpots.find((sp: any) => sp.id === selectedId) : undefined;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    // Let the map begin its flight, then reveal the lightbox
    setTimeout(() => setLightboxOpen(true), 900);
  };

  const catchPhotos: LightboxPhoto[] = (() => {
    if (!selectedCatch) return [];
    const seen = new Set<string>();
    const out: LightboxPhoto[] = [];
    const push = (url?: string | null, label?: string) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      out.push({ url, label });
    };
    push(selectedCatch.cover_photo_url, "Trophy Shot");
    push(selectedCatch.measurement_photo_url, "Measurement");
    (extraPhotos as any[]).forEach((p) =>
      push(p.photo_url, p.photo_type === "scale" ? "On the Scale" : p.photo_type === "measurement" ? "Measurement" : "Additional"),
    );
    (selectedCatch.photos || []).forEach((u) => push(u, "Additional"));
    return out;
  })();

  const spotPhotos: LightboxPhoto[] = (selectedSpot?.photos || []).map((u: string) => ({ url: u, label: "Spot" }));

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-card to-card p-5 md:p-6 mb-5">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-1">
              Catch Explorer
            </p>
            <h1 className="text-2xl md:text-3xl font-bold">My Catches &amp; Spots</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {catches.length} {catches.length === 1 ? "catch" : "catches"} logged ·{" "}
              {savedSpots.length} saved {savedSpots.length === 1 ? "spot" : "spots"} · tap any card to fly the map
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-8 w-44"
              />
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Catch
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as "catches" | "spots");
          setSelectedId(null);
        }}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="catches" className="gap-1.5">
            <Fish className="h-4 w-4" /> Catches
            <span className="ml-1 text-[11px] text-muted-foreground">{catches.length}</span>
          </TabsTrigger>
          <TabsTrigger value="spots" className="gap-1.5">
            <Bookmark className="h-4 w-4" /> Saved Spots
            <span className="ml-1 text-[11px] text-muted-foreground">{savedSpots.length}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-5 lg:grid-cols-[minmax(340px,38%)_1fr]">
        {/* LEFT: list */}
        <div className="space-y-3 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto lg:pr-1 no-scrollbar">
          {tab === "catches" ? (
            filteredCatches.length === 0 ? (
              <div className="text-center py-16 border rounded-2xl bg-muted/30">
                <Fish className="h-14 w-14 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-1">
                  {catches.length === 0 ? "No catches yet" : "No matches"}
                </h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  {catches.length === 0
                    ? "Start logging your catches to build your map."
                    : "Try a different search term."}
                </p>
                {catches.length === 0 && (
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Your First Catch
                  </Button>
                )}
              </div>
            ) : (
              filteredCatches.map((catchItem) => (
                <CatchCard
                  key={catchItem.id}
                  catchData={catchItem}
                  isActive={selectedId === catchItem.id}
                  onSelect={() => handleSelect(catchItem.id)}
                  onDelete={() => handleDelete(catchItem.id)}
                  onUpdated={(updates) =>
                    setCatches((prev) =>
                      prev.map((c) =>
                        c.id === catchItem.id ? { ...c, ...(updates as Partial<Catch>) } : c,
                      ),
                    )
                  }
                  species={species}
                  formatDate={formatDate}
                  spots={spots}
                />
              ))
            )
          ) : savedLoading || savedSpotsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : filteredSpots.length === 0 ? (
            <div className="text-center py-16 border rounded-2xl bg-muted/30">
              <Bookmark className="h-14 w-14 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No saved spots</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Save spots from the map to build your personal fishing atlas.
              </p>
              <Button variant="outline" onClick={() => navigate("/app/spots")}>
                <MapPin className="h-4 w-4 mr-2" />
                Explore Spots
              </Button>
            </div>
          ) : (
            filteredSpots.map((sp: any) => (
              <SpotCard
                key={sp.id}
                spot={sp}
                isActive={selectedId === sp.id}
                onSelect={() => handleSelect(sp.id)}
                onOpen={() => navigate(`/app/spots/${sp.id}`)}
              />
            ))
          )}
        </div>

        {/* RIGHT: map */}
        <div className="lg:sticky lg:top-20 h-[380px] lg:h-[calc(100vh-16rem)]">
          <ExplorerMap points={points} selectedId={selectedId} onSelect={handleSelect} className="h-full" />
        </div>
      </div>

      {/* Lightbox */}
      <PhotoLightbox
        open={lightboxOpen && (!!selectedCatch || !!selectedSpot)}
        onClose={() => setLightboxOpen(false)}
        title={
          selectedCatch
            ? selectedCatch.species_name || "Unknown Species"
            : selectedSpot?.name || "Saved Spot"
        }
        subtitle={
          selectedCatch
            ? [formatDate(selectedCatch.caught_at), selectedCatch.general_location].filter(Boolean).join(" · ")
            : [selectedSpot?.location_name, selectedSpot?.area_type].filter(Boolean).join(" · ")
        }
        photos={selectedCatch ? catchPhotos : spotPhotos}
        notes={selectedCatch ? selectedCatch.notes : selectedSpot?.description}
        stats={
          selectedCatch
            ? [
                { label: "Weight", value: selectedCatch.weight_lbs ? `${selectedCatch.weight_lbs} lbs` : "—" },
                { label: "Length", value: selectedCatch.length_in ? `${selectedCatch.length_in} in` : "—" },
                { label: "Status", value: selectedCatch.catch_status === "released" ? "Released" : "Harvested" },
                { label: "Bait", value: selectedCatch.bait_used || "—" },
              ]
            : selectedSpot
              ? [
                  { label: "Depth", value: selectedSpot.depth_ft ? `${selectedSpot.depth_ft} ft` : "—" },
                  { label: "Type", value: selectedSpot.area_type || "—" },
                  {
                    label: "Rating",
                    value: selectedSpot.rating_avg
                      ? `${Number(selectedSpot.rating_avg).toFixed(1)} (${selectedSpot.rating_count || 0})`
                      : "—",
                  },
                  { label: "Species", value: String(selectedSpot.species_available?.length || 0) },
                ]
              : []
        }
        footer={
          selectedCatch ? (
            <Button variant="outline" className="w-full" onClick={() => navigate(`/app/catches/${selectedCatch.id}`)}>
              <Images className="h-4 w-4 mr-2" />
              Open full catch page
            </Button>
          ) : selectedSpot ? (
            <Button variant="outline" className="w-full" onClick={() => navigate(`/app/spots/${selectedSpot.id}`)}>
              <MapPin className="h-4 w-4 mr-2" />
              Open spot page
            </Button>
          ) : null
        }
      />
    </div>
  );
}

// Saved Spot Card
function SpotCard({
  spot,
  isActive,
  onSelect,
  onOpen,
}: {
  spot: any;
  isActive: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const photo = spot.photos?.[0];
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex gap-3 rounded-2xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isActive ? "border-primary ring-2 ring-primary/40 shadow-lg" : "hover:border-primary/40"
      }`}
    >
      <div className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden bg-muted">
        {photo ? (
          <img src={thumb(photo)} alt={spot.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Anchor className="h-7 w-7 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight truncate">{spot.name}</h3>
          {spot.rating_avg ? (
            <span className="flex items-center gap-1 text-xs text-amber-500 shrink-0">
              <Star className="h-3.5 w-3.5 fill-current" />
              {Number(spot.rating_avg).toFixed(1)}
            </span>
          ) : null}
        </div>
        {spot.location_name && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {spot.location_name}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {spot.area_type && <Badge variant="secondary">{spot.area_type}</Badge>}
          {spot.depth_ft && <Badge variant="outline">{spot.depth_ft} ft</Badge>}
          {spot.species_available?.length ? (
            <Badge variant="outline">{spot.species_available.length} species</Badge>
          ) : null}
        </div>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
        >
          View spot →
        </span>
      </div>
    </button>
  );
}

// Catch Card Component
interface CatchCardProps {
  catchData: Catch;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdated: (updates: Partial<Catch>) => void;
  species: FishSpecies[];
  formatDate: (date: string | null) => string;
  spots: FishingSpot[];
}

function CatchCard({ catchData, isActive, onSelect, onDelete, onUpdated, species, formatDate, spots }: CatchCardProps) {
  const createPost = useCreatePost();
  const [isSharing, setIsSharing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleShareToFeed = async () => {
    setIsSharing(true);
    try {
      const spot = spots.find((s) => s.id === catchData.fishing_spot_id);
      const locationName = spot?.name || spot?.location_name || undefined;
      const photos = (catchData.photos && catchData.photos.length > 0)
        ? catchData.photos
        : (catchData.cover_photo_url ? [catchData.cover_photo_url] : undefined);
      const fallback = catchData.species_name
        ? `Caught a ${catchData.species_name}${catchData.length_in ? ` · ${Number(catchData.length_in).toFixed(1)} in` : ""}${catchData.weight_lbs ? ` · ${Number(catchData.weight_lbs).toFixed(1)} lbs` : ""}`
        : undefined;
      await createPost.mutateAsync({
        catchId: catchData.id,
        content: catchData.notes || fallback,
        photos,
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
  const hasCoords = catchData.location_lat != null && catchData.location_lng != null;

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group relative flex gap-3 rounded-2xl border bg-card p-3 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        isActive ? "border-primary ring-2 ring-primary/40 shadow-lg" : "hover:border-primary/40"
      }`}
    >
      <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-xl bg-muted">
        {displayPhoto ? (
          <img
            src={thumb(displayPhoto)}
            alt={catchData.species_name || "Catch"}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Fish className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <span
          className={`absolute bottom-1 left-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white ${
            catchData.catch_status === "released" ? "bg-emerald-600/90" : "bg-amber-600/90"
          }`}
        >
          {catchData.catch_status === "released" ? "Released" : "Harvested"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight">
              {catchData.species_name || "Unknown Species"}
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(catchData.caught_at)}
              </span>
              {catchData.general_location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {catchData.general_location}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {catchData.is_verified && (
              <Badge className="bg-blue-600/90 text-white border-0">✓</Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
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
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {catchData.weight_lbs && (
            <Badge variant="secondary" className="gap-1">
              <Scale className="h-3 w-3" />
              {catchData.weight_lbs} lbs
            </Badge>
          )}
          {catchData.length_in && (
            <Badge variant="secondary" className="gap-1">
              <Ruler className="h-3 w-3" />
              {catchData.length_in} in
            </Badge>
          )}
          {catchData.bait_used && <Badge variant="outline">{catchData.bait_used}</Badge>}
          {(catchData.challenge_id || catchData.tournament_id) && catchData.approval_status && (
            <ApprovalBadge status={catchData.approval_status} notes={catchData.approval_notes} />
          )}
        </div>

        {catchData.notes && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{catchData.notes}</p>
        )}

        <p className="mt-2 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {hasCoords ? "Fly to location & view photos →" : "View photos →"}
        </p>
      </div>

      <EditCatchDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        catchData={catchData}
        species={species}
        onSaved={(updates) => onUpdated(updates as Partial<Catch>)}
      />
    </div>
  );
}
