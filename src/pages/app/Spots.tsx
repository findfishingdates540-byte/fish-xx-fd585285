import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import { useSavedSpots } from "@/hooks/use-saved-spots";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Filter,
  Star,
  MapPin,
  Heart,
  Plus,
  Minus,
  Navigation,
  RefreshCw,
  Fish,
} from "lucide-react";
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
}

const FILTER_OPTIONS = [
  { id: "all", label: "All Spots" },
  { id: "freshwater", label: "Freshwater" },
  { id: "top-rated", label: "Top Rated" },
];

export default function Spots() {
  const { user } = useAuth();
  const { token, isLoading: tokenLoading, error: tokenError } = useMapboxToken();
  const { isSpotSaved, toggleSaveSpot } = useSavedSpots();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedSpot, setSelectedSpot] = useState<FishingSpot | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch fishing spots
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const { data, error } = await supabase
          .from("fishing_spots")
          .select("*")
          .eq("is_public", true)
          .order("rating_avg", { ascending: false });

        if (error) throw error;
        setSpots(data || []);
      } catch (err) {
        console.error("Error fetching spots:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Default to a central US location
          setUserLocation({ lat: 39.8283, lng: -98.5795 });
        }
      );
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !token || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: userLocation ? [userLocation.lng, userLocation.lat] : [-98.5795, 39.8283],
      zoom: userLocation ? 10 : 4,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [token, userLocation]);

  // Filter spots
  const filteredSpots = spots.filter((spot) => {
    const matchesSearch =
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.location_name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === "top-rated") {
      return matchesSearch && (spot.rating_avg || 0) >= 4.0;
    }

    return matchesSearch;
  });

  // Add markers for filtered spots
  useEffect(() => {
    if (!map.current || !token) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (filteredSpots.length === 0) return;

    // Create bounds to fit all spots
    const bounds = new mapboxgl.LngLatBounds();

    filteredSpots.forEach((spot) => {
      // Extend bounds to include this spot
      bounds.extend([spot.location_lng, spot.location_lat]);

      // Create custom marker element
      const el = document.createElement("div");
      el.className = "spot-marker";
      el.innerHTML = `
        <div style="
          width: 36px;
          height: 36px;
          background: white;
          border: 2px solid #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: transform 0.2s ease;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
        </div>
      `;

      el.addEventListener("mouseenter", () => {
        el.querySelector("div")?.setAttribute("style", `
          width: 36px;
          height: 36px;
          background: #000;
          border: 2px solid #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          transform: scale(1.1);
          transition: transform 0.2s ease;
        `);
        const svg = el.querySelector("svg");
        if (svg) svg.setAttribute("stroke", "white");
      });

      el.addEventListener("mouseleave", () => {
        el.querySelector("div")?.setAttribute("style", `
          width: 36px;
          height: 36px;
          background: white;
          border: 2px solid #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transform: scale(1);
          transition: transform 0.2s ease;
        `);
        const svg = el.querySelector("svg");
        if (svg) svg.setAttribute("stroke", "currentColor");
      });

      el.addEventListener("click", () => {
        setSelectedSpot(spot);
        
        // Show popup
        if (popupRef.current) {
          popupRef.current.remove();
        }

        const popupContent = `
          <div style="padding: 8px; min-width: 180px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 40px; height: 40px; border-radius: 8px; background: #f0f0f0; overflow: hidden;">
                ${spot.photos?.[0] 
                  ? `<img src="${spot.photos[0]}" style="width: 100%; height: 100%; object-fit: cover;" />`
                  : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">🎣</div>`
                }
              </div>
              <div>
                <div style="font-weight: 600; font-size: 14px;">${spot.name}</div>
                <div style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: #666;">
                  <span style="color: #fbbf24;">★</span>
                  <span>${spot.rating_avg?.toFixed(1) || "N/A"}</span>
                  ${spot.species_available?.[0] ? `<span>• ${spot.species_available[0]}</span>` : ""}
                </div>
              </div>
            </div>
          </div>
        `;

        popupRef.current = new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setLngLat([spot.location_lng, spot.location_lat])
          .setHTML(popupContent)
          .addTo(map.current!);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([spot.location_lng, spot.location_lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit map to show all spots with padding
    if (filteredSpots.length > 1) {
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 12,
      });
    } else if (filteredSpots.length === 1) {
      map.current.flyTo({
        center: [filteredSpots[0].location_lng, filteredSpots[0].location_lat],
        zoom: 12,
      });
    }
  }, [filteredSpots, token]);


  const handleCenterOnLocation = () => {
    if (userLocation && map.current) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 12,
      });
    }
  };

  const handleSearchArea = () => {
    if (!map.current) return;
    const bounds = map.current.getBounds();
    // In a real app, we'd fetch spots within these bounds
    console.log("Search area bounds:", bounds);
  };

  const handleSpotClick = (spot: FishingSpot) => {
    setSelectedSpot(spot);
    if (map.current) {
      map.current.flyTo({
        center: [spot.location_lng, spot.location_lat],
        zoom: 14,
      });
    }
  };

  const calculateDistance = (spotLat: number, spotLng: number): string => {
    if (!userLocation) return "Unknown";
    
    const R = 3959; // Earth's radius in miles
    const dLat = (spotLat - userLocation.lat) * (Math.PI / 180);
    const dLng = (spotLng - userLocation.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * (Math.PI / 180)) *
        Math.cos(spotLat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return `${distance.toFixed(1)} miles away`;
  };

  if (tokenLoading || loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-[480px] border-r p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="space-y-4 mt-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Failed to load map</p>
          <p className="text-sm text-muted-foreground">{tokenError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Sidebar - Spot List */}
      <aside className="w-[480px] border-r bg-background overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Explore Nearby</h1>

          {/* Search */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lakes, rivers, or spots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === filter.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Spots Count */}
          <p className="text-sm text-muted-foreground mb-4">
            {filteredSpots.length} spots found near you
          </p>

          {/* Spot Cards */}
          <div className="space-y-4">
            {filteredSpots.length === 0 ? (
              <div className="text-center py-12">
                <Fish className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No fishing spots found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              filteredSpots.map((spot) => (
                <SpotCard
                  key={spot.id}
                  spot={spot}
                  distance={calculateDistance(spot.location_lat, spot.location_lng)}
                  isSelected={selectedSpot?.id === spot.id}
                  isSaved={isSpotSaved(spot.id)}
                  onToggleSave={() => toggleSaveSpot(spot.id)}
                  onClick={() => handleSpotClick(spot)}
                />
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Right Side - Map */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Search This Area Button */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearchArea}
            className="bg-background shadow-md"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Search this area
          </Button>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleCenterOnLocation}
            className="bg-background shadow-md"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>

        {/* Add Spot FAB */}
        <Button
          className="absolute bottom-6 right-6 z-10 shadow-lg"
          size="lg"
        >
          <Fish className="h-5 w-5 mr-2" />
          Add Spot
        </Button>
      </div>
    </div>
  );
}

// Spot Card Component
interface SpotCardProps {
  spot: FishingSpot;
  distance: string;
  isSelected: boolean;
  isSaved: boolean;
  onToggleSave: () => void;
  onClick: () => void;
}

function SpotCard({ spot, distance, isSelected, isSaved, onToggleSave, onClick }: SpotCardProps) {
  const navigate = useNavigate();
  const getCrowdLevel = (): { label: string; color: string } => {
    // Mock crowd level based on rating count
    const count = spot.rating_count || 0;
    if (count < 10) return { label: "Low Crowd", color: "bg-green-500" };
    if (count < 50) return { label: "Moderate Crowd", color: "bg-amber-500" };
    return { label: "High Crowd", color: "bg-red-500" };
  };

  const crowd = getCrowdLevel();

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
    >
      {/* Image */}
      <div className="relative h-48 bg-muted">
        {spot.photos?.[0] ? (
          <img
            src={spot.photos[0]}
            alt={spot.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Fish className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Crowd Badge */}
        <Badge className={`absolute top-3 left-3 ${crowd.color} text-white border-0`}>
          {crowd.label}
        </Badge>

        {/* Favorite Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
            isSaved 
              ? "bg-red-500 text-white hover:bg-red-600" 
              : "bg-background/80 hover:bg-background"
          }`}
        >
          <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-lg">{spot.name}</h3>
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-medium">{spot.rating_avg?.toFixed(1) || "N/A"}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
          <MapPin className="h-3 w-3" />
          {distance} • {spot.location_name || "Freshwater"}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {spot.species_available?.slice(0, 2).map((species) => (
            <Badge key={species} variant="secondary" className="text-xs">
              {species}
            </Badge>
          ))}
          {spot.is_verified && (
            <Badge variant="outline" className="text-xs text-primary border-primary">
              Verified
            </Badge>
          )}
        </div>

        {/* View Details Button */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/app/spots/${spot.id}`);
          }}
        >
          View Details
        </Button>
      </div>
    </div>
  );
}
