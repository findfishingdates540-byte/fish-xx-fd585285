import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import { useSavedSpots } from "@/hooks/use-saved-spots";
import { useWeather, getWindDirection, getFishingConditions } from "@/hooks/use-weather";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Lightbox } from "@/components/ui/lightbox";
import { toast } from "sonner";
import { getShareBaseUrl } from "@/lib/config";
import { AdBanner } from "@/components/ads/AdBanner";
import {
  Star,
  MapPin,
  Heart,
  Share2,
  ChevronRight,
  Sun,
  Wind,
  Gauge,
  Cloud,
  CloudRain,
  Sunrise,
  Sunset,
  Navigation,
  Play,
  Fish,
  Clock,
  Users,
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  Scale,
  Ruler,
  Calendar,
  MessageSquare,
  Send,
  Camera,
  X,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface FishingSpot {
  id: string;
  name: string;
  description: string | null;
  location_name: string | null;
  location_lat: number;
  location_lng: number;
  species_available: string[] | null;
  is_public: boolean | null;
  is_verified: boolean | null;
  rating_avg: number | null;
  rating_count: number | null;
  photos: string[] | null;
  created_by: string | null;
  area_type: string | null;
}

interface SpotCatch {
  id: string;
  species_name: string | null;
  weight_lbs: number | null;
  length_in: number | null;
  photos: string[] | null;
  caught_at: string | null;
  user_id: string;
  profiles?: {
    display_name: string | null;
    photos: string[] | null;
  } | null;
}

interface SpotReview {
  id: string;
  rating: number;
  review: string | null;
  photos: string[] | null;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string | null;
    photos: string[] | null;
  } | null;
}

// Helper to get weather icon based on condition
const getConditionIcon = (condition: string) => {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return 'rain';
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) return 'cloud';
  return 'sun';
};

// Fish species type
interface FishSpecies {
  id: string;
  name: string;
  scientific_name: string | null;
  image_url: string | null;
}

export default function SpotDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { token: mapboxToken } = useMapboxToken();
  const { isSpotSaved, toggleSaveSpot } = useSavedSpots();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [spot, setSpot] = useState<FishingSpot | null>(null);
  const [catches, setCatches] = useState<SpotCatch[]>([]);
  const [reviews, setReviews] = useState<SpotReview[]>([]);
  const [allSpecies, setAllSpecies] = useState<FishSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState<SpotReview | null>(null);
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([]);
  const [reviewPhotoPreviewUrls, setReviewPhotoPreviewUrls] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showSpeciesDialog, setShowSpeciesDialog] = useState(false);
  const [speciesSearch, setSpeciesSearch] = useState("");
  const [addingSpecies, setAddingSpecies] = useState(false);
  const reviewPhotoInputRef = useRef<HTMLInputElement>(null);

  const isSaved = id ? isSpotSaved(id) : false;
  
  // Fetch weather data using spot coordinates
  const { data: weather, isLoading: weatherLoading } = useWeather(
    spot?.location_lat,
    spot?.location_lng
  );
  
  const fishingConditions = weather ? getFishingConditions(weather) : null;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        // Fetch spot, catches, reviews, and all species in parallel
        const [spotRes, catchesRes, reviewsRes, speciesRes] = await Promise.all([
          supabase
            .from("fishing_spots")
            .select("*")
            .eq("id", id)
            .maybeSingle(),
          supabase
            .from("catches")
            .select(`
              id,
              species_name,
              weight_lbs,
              length_in,
              photos,
              caught_at,
              user_id,
              profiles:user_id (
                display_name,
                photos
              )
            `)
            .eq("fishing_spot_id", id)
            .order("caught_at", { ascending: false })
            .limit(10),
          supabase
            .from("spot_ratings")
            .select(`
              id,
              rating,
              review,
              photos,
              created_at,
              user_id,
              profiles:user_id (
                display_name,
                photos
              )
            `)
            .eq("spot_id", id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("fish_species")
            .select("*")
            .order("name"),
        ]);

        if (spotRes.error) throw spotRes.error;
        setSpot(spotRes.data);
        setCatches((catchesRes.data as SpotCatch[]) || []);
        const reviewsData = (reviewsRes.data as SpotReview[]) || [];
        setReviews(reviewsData);
        setAllSpecies((speciesRes.data as FishSpecies[]) || []);
        
        // Check if current user has already reviewed
        if (user) {
          const existingReview = reviewsData.find(r => r.user_id === user.id);
          if (existingReview) {
            setUserReview(existingReview);
            setNewRating(existingReview.rating);
            setNewReview(existingReview.review || "");
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  // Initialize mini map (skip on mobile)
  useEffect(() => {
    if (isMobile || !mapContainer.current || !mapboxToken || !spot || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [spot.location_lng, spot.location_lat],
      zoom: 12,
      interactive: false,
    });

    // Add marker
    new mapboxgl.Marker({ color: "#000" })
      .setLngLat([spot.location_lng, spot.location_lat])
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, spot, isMobile]);

  const handleShare = async () => {
    const url = `${getShareBaseUrl()}/app/spots/${spot?.id}`;
    if (navigator.share) {
      await navigator.share({
        title: spot?.name,
        text: `Check out this fishing spot: ${spot?.name}`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const handleGetDirections = () => {
    if (spot) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.location_lat},${spot.location_lng}`;
      window.open(url, "_blank");
    }
  };

  const formatCoordinates = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? "N" : "S";
    const lngDir = lng >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
  };

  const getWeatherIcon = (type: string) => {
    switch (type) {
      case "sun": return <Sun className="h-5 w-5 text-amber-500" />;
      case "cloud": return <Cloud className="h-5 w-5 text-muted-foreground" />;
      case "rain": return <CloudRain className="h-5 w-5 text-blue-500" />;
      default: return <Sun className="h-5 w-5 text-amber-500" />;
    }
  };

  const handleReviewPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + reviewPhotos.length > 4) {
      toast.error("Maximum 4 photos per review");
      return;
    }

    setReviewPhotos((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewPhotoPreviewUrls((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReviewPhoto = (index: number) => {
    setReviewPhotos((prev) => prev.filter((_, i) => i !== index));
    setReviewPhotoPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadReviewPhotos = async (): Promise<string[]> => {
    if (!user || reviewPhotos.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const photo of reviewPhotos) {
      const fileExt = photo.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("review-photos")
        .upload(fileName, photo);

      if (error) {
        console.error("Upload error:", error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("review-photos")
        .getPublicUrl(data.path);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmitReview = async () => {
    if (!user || !id || newRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmittingReview(true);
    try {
      // Upload photos first
      const photoUrls = await uploadReviewPhotos();

      if (userReview) {
        // Update existing review - merge existing photos with new ones
        const existingPhotos = userReview.photos || [];
        const allPhotos = [...existingPhotos, ...photoUrls];
        
        const { error } = await supabase
          .from("spot_ratings")
          .update({ 
            rating: newRating, 
            review: newReview || null,
            photos: allPhotos.length > 0 ? allPhotos : null
          })
          .eq("id", userReview.id);

        if (error) throw error;
        toast.success("Review updated!");
      } else {
        // Create new review
        const { error } = await supabase
          .from("spot_ratings")
          .insert({
            spot_id: id,
            user_id: user.id,
            rating: newRating,
            review: newReview || null,
            photos: photoUrls.length > 0 ? photoUrls : null,
          });

        if (error) throw error;
        toast.success("Review submitted!");
      }

      // Clear photo state
      setReviewPhotos([]);
      setReviewPhotoPreviewUrls([]);

      // Refetch reviews
      const { data: reviewsData } = await supabase
        .from("spot_ratings")
        .select(`
          id,
          rating,
          review,
          photos,
          created_at,
          user_id,
          profiles:user_id (
            display_name,
            photos
          )
        `)
        .eq("spot_id", id)
        .order("created_at", { ascending: false })
        .limit(20);

      setReviews((reviewsData as SpotReview[]) || []);
      const existingReview = reviewsData?.find((r: any) => r.user_id === user.id);
      setUserReview(existingReview as SpotReview || null);
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Calculate actual rating distribution
  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating as keyof typeof distribution]++;
      }
    });
    const total = reviews.length || 1;
    return {
      5: Math.round((distribution[5] / total) * 100),
      4: Math.round((distribution[4] / total) * 100),
      3: Math.round((distribution[3] / total) * 100),
      2: Math.round((distribution[2] / total) * 100),
      1: Math.round((distribution[1] / total) * 100),
    };
  };

  const ratingDistribution = getRatingDistribution();

  // Handle adding a species to the spot
  const handleAddSpecies = async (speciesName: string) => {
    if (!spot || !id) return;
    
    setAddingSpecies(true);
    try {
      const currentSpecies = spot.species_available || [];
      
      // Check if already added
      if (currentSpecies.some(s => s.toLowerCase() === speciesName.toLowerCase())) {
        toast.info(`${speciesName} is already in common catches`);
        setAddingSpecies(false);
        return;
      }

      const updatedSpecies = [...currentSpecies, speciesName];
      
      const { error } = await supabase
        .from("fishing_spots")
        .update({ species_available: updatedSpecies })
        .eq("id", id);

      if (error) throw error;

      setSpot({ ...spot, species_available: updatedSpecies });
      toast.success(`Added ${speciesName} to common catches`);
      setShowSpeciesDialog(false);
      setSpeciesSearch("");
    } catch (err) {
      console.error("Error adding species:", err);
      toast.error("Failed to add species");
    } finally {
      setAddingSpecies(false);
    }
  };

  // Handle removing a species from the spot
  const handleRemoveSpecies = async (speciesName: string) => {
    if (!spot || !id) return;
    
    try {
      const updatedSpecies = (spot.species_available || []).filter(
        s => s.toLowerCase() !== speciesName.toLowerCase()
      );
      
      const { error } = await supabase
        .from("fishing_spots")
        .update({ species_available: updatedSpecies })
        .eq("id", id);

      if (error) throw error;

      setSpot({ ...spot, species_available: updatedSpecies });
      toast.success(`Removed ${speciesName} from common catches`);
    } catch (err) {
      console.error("Error removing species:", err);
      toast.error("Failed to remove species");
    }
  };

  // Filter species for search
  const filteredSpecies = allSpecies.filter(s => 
    s.name.toLowerCase().includes(speciesSearch.toLowerCase()) &&
    !(spot?.species_available || []).some(existing => existing.toLowerCase() === s.name.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-96" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-80 w-full rounded-xl" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Fish className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Spot Not Found</h2>
          <p className="text-muted-foreground mb-4">This fishing spot doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/app/spots")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Spots
          </Button>
        </div>
      </div>
    );
  }

  const photos = spot.photos?.length ? spot.photos : ["/placeholder.svg"];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/app/discover" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/app/spots" className="hover:text-foreground">Find Spots</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{spot.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{spot.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{spot.rating_avg?.toFixed(1) || "N/A"}</span>
                <span className="text-muted-foreground">({spot.rating_count || 0} reviews)</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {spot.location_name || "Unknown Location"}
              </div>
              <span className="text-muted-foreground">•</span>
              <Badge 
                variant="outline"
                className={spot.area_type === 'saltwater' 
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20" 
                  : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20"
                }
              >
                {spot.area_type === 'saltwater' ? 'Saltwater' : 'Freshwater'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              size="sm"
              onClick={() => id && toggleSaveSpot(id)}
              className={isSaved ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
              {isSaved ? "Saved" : "Save Spot"}
            </Button>
          </div>
        </div>

        {/* Photo Gallery - Full Width */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="col-span-2 relative rounded-2xl overflow-hidden bg-muted aspect-[4/3]">
            {photos[selectedPhoto] !== "/placeholder.svg" ? (
              <img
                src={photos[selectedPhoto]}
                alt={spot.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Fish className="h-20 w-20 text-muted-foreground" />
              </div>
            )}
            <button className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <ImageIcon className="h-3 w-3" />
              View all photos
            </button>
          </div>
          <div className="space-y-4">
            {photos.slice(1, 3).map((photo, index) => (
              <div
                key={index}
                onClick={() => setSelectedPhoto(index + 1)}
                className="relative rounded-2xl overflow-hidden bg-muted aspect-[4/3] cursor-pointer hover:opacity-90 transition-opacity"
              >
                {photo !== "/placeholder.svg" ? (
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Fish className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {index === 1 && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="h-5 w-5 text-foreground ml-0.5" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sponsored banner under photo gallery — hidden for premium users */}
        <AdBanner variant="inline" className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-background rounded-xl p-6 border">
              <h2 className="text-lg font-semibold mb-3">About this spot</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {spot.description || 
                  "This fishing spot offers great opportunities for anglers of all skill levels. The waters are home to various fish species and feature accessible shoreline fishing points. Check local regulations before fishing."}
              </p>
            </div>

            {/* Common Catches */}
            <div className="bg-background rounded-xl p-6 border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Common Catches</h2>
                {user && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSpeciesDialog(true)}
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Add Species
                  </Button>
                )}
              </div>
              
              {spot.species_available?.length ? (
                <div className="flex flex-wrap gap-3">
                  {spot.species_available.map((speciesName) => {
                    const speciesInfo = allSpecies.find(s => s.name.toLowerCase() === speciesName.toLowerCase());
                    return (
                      <div
                        key={speciesName}
                        className="group flex items-center gap-3 p-3 rounded-xl border bg-muted/30 min-w-[160px] relative"
                      >
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {speciesInfo?.image_url ? (
                            <img 
                              src={speciesInfo.image_url} 
                              alt={speciesName} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Fish className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{speciesName}</p>
                          {speciesInfo?.scientific_name && (
                            <p className="text-xs text-muted-foreground italic truncate">
                              {speciesInfo.scientific_name}
                            </p>
                          )}
                        </div>
                        {user && (
                          <button
                            onClick={() => handleRemoveSpecies(speciesName)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove species"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Fish className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No species reported yet</p>
                  {user && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Be the first to add a fish species caught here!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Add Species Dialog */}
            <Dialog open={showSpeciesDialog} onOpenChange={setShowSpeciesDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Species to Common Catches</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search species..."
                      value={speciesSearch}
                      onChange={(e) => setSpeciesSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {filteredSpecies.length > 0 ? (
                      filteredSpecies.slice(0, 20).map((species) => (
                        <button
                          key={species.id}
                          onClick={() => handleAddSpecies(species.name)}
                          disabled={addingSpecies}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            {species.image_url ? (
                              <img 
                                src={species.image_url} 
                                alt={species.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <Fish className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{species.name}</p>
                            {species.scientific_name && (
                              <p className="text-xs text-muted-foreground italic truncate">
                                {species.scientific_name}
                              </p>
                            )}
                          </div>
                          {addingSpecies && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </button>
                      ))
                    ) : speciesSearch ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-2">No species found</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSpecies(speciesSearch)}
                          disabled={addingSpecies}
                          className="gap-1.5"
                        >
                          {addingSpecies ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Add "{speciesSearch}" as custom species
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Start typing to search species...
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Location */}
            <div className="bg-background rounded-xl p-6 border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Location</h2>
                <button 
                  onClick={handleGetDirections}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {isMobile ? 'Get Directions' : 'View larger map'}
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              {!isMobile && (
                <div ref={mapContainer} className="w-full h-48 rounded-xl overflow-hidden mb-3 bg-muted" />
              )}
              <p className="text-sm text-muted-foreground">
                Coordinates: {formatCoordinates(spot.location_lat, spot.location_lng)}
              </p>
            </div>

            {/* Reviews & Ratings */}
            <div className="bg-background rounded-xl p-6 border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Reviews & Ratings</h2>
                <Badge variant="secondary" className="gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {reviews.length} reviews
                </Badge>
              </div>
              
              <div className="flex gap-8 mb-6">
                <div className="text-center">
                  <div className="text-5xl font-bold">{spot.rating_avg?.toFixed(1) || "N/A"}</div>
                  <div className="text-sm text-muted-foreground">/ 5</div>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(spot.rating_avg || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {spot.rating_count || 0} reviews
                  </p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="w-3 text-sm text-muted-foreground">{rating}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${ratingDistribution[rating as keyof typeof ratingDistribution]}%` }}
                        />
                      </div>
                      <span className="w-10 text-xs text-muted-foreground text-right">
                        {ratingDistribution[rating as keyof typeof ratingDistribution]}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Write a Review */}
              {user ? (
                <div className="border-t pt-4 mb-6">
                  <h3 className="font-medium mb-3">
                    {userReview ? "Update your review" : "Write a review"}
                  </h3>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setNewRating(star)}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= (hoverRating || newRating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {newRating > 0 ? `${newRating} star${newRating !== 1 ? "s" : ""}` : "Select rating"}
                    </span>
                  </div>
                  <Textarea
                    placeholder="Share your experience at this spot... (optional)"
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    className="mb-3 resize-none"
                    rows={3}
                  />
                  
                  {/* Photo Upload */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Add photos (max 4)</p>
                    <div className="flex flex-wrap gap-2">
                      {reviewPhotoPreviewUrls.map((url, index) => (
                        <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeReviewPhoto(index)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                      ))}
                      {reviewPhotos.length < 4 && (
                        <button
                          type="button"
                          onClick={() => reviewPhotoInputRef.current?.click()}
                          className="w-16 h-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Camera className="h-4 w-4" />
                          <span className="text-[10px] mt-0.5">Add</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={reviewPhotoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleReviewPhotoSelect}
                      className="hidden"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSubmitReview} 
                    disabled={newRating === 0 || submittingReview}
                    className="gap-2"
                  >
                    {submittingReview ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {submittingReview ? "Submitting..." : userReview ? "Update Review" : "Submit Review"}
                  </Button>
                </div>
              ) : (
                <div className="border-t pt-4 mb-6">
                  <p className="text-sm text-muted-foreground">
                    <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to leave a review
                  </p>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const profile = review.profiles;
                    const avatarUrl = profile?.photos?.[0];
                    const initials = profile?.display_name?.charAt(0)?.toUpperCase() || "U";
                    const isOwnReview = user?.id === review.user_id;
                    
                    return (
                      <div 
                        key={review.id} 
                        className={`p-4 rounded-lg ${isOwnReview ? "bg-primary/5 border border-primary/20" : "bg-muted/30"}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarUrl || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {profile?.display_name || "Anonymous"}
                                  {isOwnReview && <Badge variant="secondary" className="ml-2 text-xs">You</Badge>}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3.5 w-3.5 ${
                                    star <= review.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                            {review.review && (
                              <p className="text-sm text-muted-foreground mb-2">{review.review}</p>
                            )}
                            {/* Review Photos */}
                            {review.photos && review.photos.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {review.photos.map((photoUrl, index) => (
                                  <div 
                                    key={index} 
                                    className="w-20 h-20 rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => {
                                      setLightboxImages(review.photos!);
                                      setLightboxIndex(index);
                                      setLightboxOpen(true);
                                    }}
                                  >
                                    <img 
                                      src={photoUrl} 
                                      alt={`Review photo ${index + 1}`} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No reviews yet. Be the first to review this spot!</p>
                </div>
              )}

              {/* Lightbox for review photos */}
              <Lightbox
                images={lightboxImages}
                initialIndex={lightboxIndex}
                open={lightboxOpen}
                onOpenChange={setLightboxOpen}
              />
            </div>

            {/* Recent Catches at this Spot */}
            {catches.length > 0 && (
              <div className="bg-background rounded-xl p-6 border">
                <h2 className="text-lg font-semibold mb-4">Recent Catches Here</h2>
                <div className="space-y-4">
                  {catches.map((catchItem) => {
                    const profile = catchItem.profiles;
                    const avatarUrl = profile?.photos?.[0];
                    const initials = profile?.display_name?.charAt(0)?.toUpperCase() || "U";
                    
                    return (
                      <div key={catchItem.id} className="flex gap-4 p-3 rounded-lg bg-muted/30">
                        {/* Catch Photo */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {catchItem.photos?.[0] ? (
                            <img
                              src={catchItem.photos[0]}
                              alt={catchItem.species_name || "Catch"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Fish className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        {/* Catch Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {catchItem.species_name || "Unknown Species"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {catchItem.weight_lbs && (
                              <span className="flex items-center gap-1">
                                <Scale className="h-3 w-3" />
                                {catchItem.weight_lbs} lbs
                              </span>
                            )}
                            {catchItem.length_in && (
                              <span className="flex items-center gap-1">
                                <Ruler className="h-3 w-3" />
                                {catchItem.length_in} in
                              </span>
                            )}
                            {catchItem.caught_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(catchItem.caught_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                          
                          {/* User */}
                          <div className="flex items-center gap-1.5 mt-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={avatarUrl || undefined} />
                              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {profile?.display_name || "Angler"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Weather Widget */}
            <div className="bg-background rounded-xl p-5 border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">Weather</span>
                </div>
                {fishingConditions && (
                  <Badge className={`${fishingConditions.rating === 'Excellent' || fishingConditions.rating === 'Good' ? 'bg-green-100 text-green-700' : fishingConditions.rating === 'Fair' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'} border-0`}>
                    {fishingConditions.rating} Conditions
                  </Badge>
                )}
              </div>
              {weatherLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ) : weather ? (
                <>
                  <div className="flex items-start gap-2 mb-4">
                    <span className="text-5xl font-light">{Math.round(weather.temperature)}°</span>
                    <div className="pt-2">
                      <p className="font-medium">{weather.condition}</p>
                      <p className="text-xs text-muted-foreground">
                        {weather.description}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Wind className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">WIND</p>
                        <p className="font-medium">{Math.round(weather.wind.speed)} mph {getWindDirection(weather.wind.direction)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">PRESSURE</p>
                        <p className="font-medium">{weather.pressure} hPa</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Sunrise className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">SUNRISE</p>
                        <p className="font-medium">{new Date(weather.sunrise * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Sunset className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">SUNSET</p>
                        <p className="font-medium">{new Date(weather.sunset * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Weather data unavailable</p>
              )}
            </div>

            {/* Best Fishing Times */}
            <div className="bg-background rounded-xl p-5 border">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">Best Fishing Times</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Sunrise className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Early Morning</p>
                      <p className="text-xs text-muted-foreground">5:00 AM - 8:00 AM</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-0 hover:bg-green-100">Peak</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Sunset className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Dusk / Evening</p>
                      <p className="text-xs text-muted-foreground">6:30 PM - 8:30 PM</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Good</Badge>
                </div>
              </div>
            </div>

            {/* Combo Mode - Who's fishing */}
            <div className="bg-background rounded-xl p-5 border">
              <p className="text-xs font-medium text-muted-foreground mb-1">COMBO MODE</p>
              <p className="text-sm mb-3">See who else is planning to fish here this week!</p>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <Avatar key={i} className="h-8 w-8 border-2 border-background">
                      <AvatarFallback className="text-xs">U{i}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">+12</span>
                <button className="ml-auto text-sm text-primary hover:underline">View All</button>
              </div>
              <Button variant="outline" className="w-full">
                Check Availability
              </Button>
            </div>

            {/* Get Directions CTA */}
            <Button className="w-full" size="lg" onClick={handleGetDirections}>
              <Navigation className="h-5 w-5 mr-2" />
              Get Directions
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              2.4 miles away • Approx 15 mins
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
