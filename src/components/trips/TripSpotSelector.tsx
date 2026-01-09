import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Bookmark, Globe } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FishingSpot {
  id: string;
  name: string;
  location_lat: number;
  location_lng: number;
  location_name: string | null;
  rating_avg: number | null;
  species_available: string[] | null;
  photos: string[] | null;
}

interface TripSpotSelectorProps {
  selectedSpotId: string | null;
  onSpotSelect: (spot: FishingSpot | null) => void;
  locationName: string;
  onLocationNameChange: (name: string) => void;
}

export function TripSpotSelector({
  selectedSpotId,
  onSpotSelect,
  locationName,
  onLocationNameChange,
}: TripSpotSelectorProps) {
  const { token, isLoading: tokenLoading, error: tokenError } = useMapboxToken();
  const { user } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [view, setView] = useState<"saved" | "all">("saved");
  // Track the actual selected spot data to persist across view changes
  const [selectedSpotData, setSelectedSpotData] = useState<FishingSpot | null>(null);

  // Fetch user's saved spot IDs
  const { data: savedSpotIds } = useQuery({
    queryKey: ["saved-spot-ids", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_saved_spots")
        .select("spot_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((s) => s.spot_id);
    },
    enabled: !!user?.id,
  });

  // Fetch fishing spots
  const { data: spots, isLoading: spotsLoading } = useQuery({
    queryKey: ["fishing-spots-for-trip", view, savedSpotIds],
    queryFn: async () => {
      let query = supabase
        .from("fishing_spots")
        .select("id, name, location_lat, location_lng, location_name, rating_avg, species_available, photos")
        .eq("is_public", true);

      if (view === "saved" && savedSpotIds && savedSpotIds.length > 0) {
        query = query.in("id", savedSpotIds);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as FishingSpot[];
    },
    enabled: view === "all" || (view === "saved" && !!savedSpotIds),
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !token || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-98.5795, 39.8283],
      zoom: 3,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [token]);

  // Add markers for spots
  useEffect(() => {
    if (!map.current || !spots) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (spots.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    spots.forEach((spot) => {
      bounds.extend([spot.location_lng, spot.location_lat]);

      const isSelected = spot.id === selectedSpotId;
      const featuredImage = spot.photos?.[0];

      const el = document.createElement("div");
      el.className = "trip-spot-marker";
      
      if (featuredImage) {
        // Use featured image as marker
        el.innerHTML = `
          <div style="
            width: 44px;
            height: 44px;
            background: white;
            border: ${isSelected ? "3px solid #000" : "2px solid #666"};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
            overflow: hidden;
          ">
            <img 
              src="${featuredImage}" 
              alt="${spot.name}"
              style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
            />
          </div>
        `;
      } else {
        // Fallback to pin icon
        el.innerHTML = `
          <div style="
            width: 32px;
            height: 32px;
            background: ${isSelected ? "#000" : "white"};
            border: 2px solid #000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? "white" : "currentColor"}" stroke-width="2">
              <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
        `;
      }

      el.addEventListener("click", () => {
        setSelectedSpotData(spot);
        onSpotSelect(spot);
        onLocationNameChange(spot.location_name || spot.name);
      });

      el.addEventListener("mouseenter", () => {
        if (!isSelected) {
          const div = el.querySelector("div");
          if (div) div.style.transform = "scale(1.1)";
        }
      });

      el.addEventListener("mouseleave", () => {
        const div = el.querySelector("div");
        if (div) div.style.transform = "scale(1)";
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([spot.location_lng, spot.location_lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds with padding
    if (spots.length > 1) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    } else if (spots.length === 1) {
      map.current.flyTo({
        center: [spots[0].location_lng, spots[0].location_lat],
        zoom: 10,
      });
    }
  }, [spots, selectedSpotId, onSpotSelect, onLocationNameChange]);

  // Use selectedSpotData if available, otherwise try to find from spots array
  const displaySpot = selectedSpotData || spots?.find((s) => s.id === selectedSpotId);

  if (tokenLoading || spotsLoading) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Unable to load map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Tabs value={view} onValueChange={(v) => setView(v as "saved" | "all")}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="saved" className="flex items-center gap-1.5 text-xs">
            <Bookmark className="h-3.5 w-3.5" />
            Saved Spots
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-1.5 text-xs">
            <Globe className="h-3.5 w-3.5" />
            All Spots
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="aspect-video rounded-lg overflow-hidden border relative">
        {displaySpot?.photos?.[0] ? (
          <img 
            src={displaySpot.photos[0]} 
            alt={displaySpot.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div ref={mapContainer} className="w-full h-full" />
        )}
      </div>

      {spots && spots.length > 0 && (
        <ScrollArea className="h-32">
          <div className="space-y-1">
            {spots.map((spot) => (
              <button
                key={spot.id}
                onClick={() => {
                  setSelectedSpotData(spot);
                  onSpotSelect(spot);
                  onLocationNameChange(spot.location_name || spot.name);
                }}
                className={`w-full text-left p-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                  spot.id === selectedSpotId
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {spot.photos?.[0] ? (
                  <img 
                    src={spot.photos[0]} 
                    alt={spot.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    spot.id === selectedSpotId ? "bg-primary-foreground/20" : "bg-muted"
                  }`}>
                    <MapPin className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{spot.name}</div>
                  <div className={`text-xs ${spot.id === selectedSpotId ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {spot.location_name || "Unknown location"}
                    {spot.rating_avg && ` • ★ ${spot.rating_avg.toFixed(1)}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {view === "saved" && (!spots || spots.length === 0) && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          <p>No saved spots yet.</p>
          <button
            onClick={() => setView("all")}
            className="text-primary hover:underline mt-1"
          >
            Browse all spots
          </button>
        </div>
      )}

      {displaySpot && (
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <div className="text-sm font-medium">{displaySpot.name}</div>
          <div className="text-xs text-muted-foreground">
            {displaySpot.species_available?.slice(0, 3).join(", ") || "Various species"}
          </div>
        </div>
      )}
    </div>
  );
}
