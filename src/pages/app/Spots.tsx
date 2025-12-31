import { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
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
  Map,
  Mountain,
  Satellite,
  CalendarPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { BuddySelectionDialog } from "@/components/buddies/BuddySelectionDialog";
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { token, isLoading: tokenLoading, error: tokenError } = useMapboxToken();
  const { isSpotSaved, toggleSaveSpot } = useSavedSpots();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const spotCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll to spot card in sidebar
  const scrollToSpotCard = useCallback((spotId: string) => {
    const cardElement = spotCardRefs.current[spotId];
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedSpot, setSelectedSpot] = useState<FishingSpot | null>(null);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showWithPhotosOnly, setShowWithPhotosOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapStyle, setMapStyle] = useState<'outdoors' | 'satellite' | 'streets'>('outdoors');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'loading'>('loading');
  const [showLocationBanner, setShowLocationBanner] = useState(true);

  // Calculate distance between two points in miles (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get all unique species from spots
  const allSpecies = [...new Set(spots.flatMap(s => s.species_available || []))].sort();

  const MAP_STYLES = {
    outdoors: { id: 'mapbox://styles/mapbox/outdoors-v12', label: 'Terrain', icon: Mountain },
    satellite: { id: 'mapbox://styles/mapbox/satellite-streets-v12', label: 'Satellite', icon: Satellite },
    streets: { id: 'mapbox://styles/mapbox/streets-v12', label: 'Streets', icon: Map },
  };

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

  // Check location permission and get user location
  useEffect(() => {
    const checkAndRequestLocation = async () => {
      if (!navigator.geolocation) {
        setLocationPermission('denied');
        return;
      }

      // Check permission state if available
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
          
          // Listen for permission changes
          result.onchange = () => {
            setLocationPermission(result.state as 'granted' | 'denied' | 'prompt');
            if (result.state === 'granted') {
              requestLocation();
            }
          };

          if (result.state === 'granted') {
            requestLocation();
          }
        } catch {
          // Fallback for browsers that don't support permissions API
          requestLocation();
        }
      } else {
        // Fallback for browsers that don't support permissions API
        requestLocation();
      }
    };

    checkAndRequestLocation();
  }, []);

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationPermission('granted');
        setShowLocationBanner(false);
      },
      (error) => {
        console.log("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied');
        }
        // Default to a central US location for map centering
        setUserLocation({ lat: 39.8283, lng: -98.5795 });
      }
    );
  };

  const handleEnableLocation = () => {
    setLocationPermission('loading');
    requestLocation();
  };

  // Initialize map (skip on mobile)
  useEffect(() => {
    if (isMobile || !mapContainer.current || !token || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[mapStyle].id,
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
  }, [token, userLocation, mapStyle, isMobile]);

  // Filter spots
  const filteredSpots = spots.filter((spot) => {
    const matchesSearch =
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.location_name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Apply chip filter
    if (activeFilter === "top-rated" && (spot.rating_avg || 0) < 4.0) {
      return false;
    }

    // Apply dropdown filters
    if (showVerifiedOnly && !spot.is_verified) return false;
    if (showWithPhotosOnly && (!spot.photos || spot.photos.length === 0)) return false;
    if (minRating && (spot.rating_avg || 0) < minRating) return false;
    
    // Distance filter
    if (maxDistance && userLocation) {
      const distance = calculateDistance(
        userLocation.lat, userLocation.lng,
        spot.location_lat, spot.location_lng
      );
      if (distance > maxDistance) return false;
    }
    
    // Species filter
    if (selectedSpecies && (!spot.species_available || !spot.species_available.includes(selectedSpecies))) {
      return false;
    }

    return true;
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

      // Create custom marker element with image card
      const el = document.createElement("div");
      el.className = "spot-marker-card";
      el.setAttribute("data-spot-id", spot.id);
      
      const spotImage = spot.photos?.[0] 
        ? `<img src="${spot.photos[0]}" style="width: 100%; height: 100%; object-fit: cover;" alt="${spot.name}" />`
        : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; font-size: 20px;">🎣</div>`;
      
      const rating = spot.rating_avg?.toFixed(1) || "New";
      const address = spot.location_name || "Location";
      
      el.innerHTML = `
        <div class="spot-card-marker" style="
          width: 160px;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.2s ease;
          transform-origin: bottom center;
        ">
          <div style="
            width: 100%;
            height: 80px;
            position: relative;
            overflow: hidden;
          ">
            ${spotImage}
            <div style="
              position: absolute;
              top: 6px;
              right: 6px;
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 3px;
            ">
              <span style="color: #fbbf24;">★</span>
              ${rating}
            </div>
          </div>
          <div style="padding: 8px;">
            <div style="
              font-weight: 600;
              font-size: 13px;
              color: #1f2937;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-bottom: 2px;
            ">${spot.name}</div>
            <div style="
              font-size: 11px;
              color: #6b7280;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              display: flex;
              align-items: center;
              gap: 4px;
            ">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/>
              </svg>
              ${address}
            </div>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid white;
            margin: 0 auto;
            position: relative;
            top: -1px;
          "></div>
        </div>
      `;

      el.addEventListener("mouseenter", () => {
        const card = el.querySelector(".spot-card-marker") as HTMLElement;
        if (card) {
          card.style.transform = "scale(1.05)";
          card.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
        }
      });

      el.addEventListener("mouseleave", () => {
        const card = el.querySelector(".spot-card-marker") as HTMLElement;
        if (card) {
          card.style.transform = "scale(1)";
          card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        }
      });

      el.addEventListener("click", () => {
        setSelectedSpot(spot);
        scrollToSpotCard(spot.id);
        if (map.current) {
          map.current.flyTo({
            center: [spot.location_lng, spot.location_lat],
            zoom: 14,
          });
        }
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
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

  const handleStyleChange = (style: 'outdoors' | 'satellite' | 'streets') => {
    if (map.current && style !== mapStyle) {
      // Store current view
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      
      // Remove old map
      map.current.remove();
      map.current = null;
      
      // Set new style - this will trigger the useEffect to reinitialize the map
      setMapStyle(style);
    }
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

  const getDistanceText = (spotLat: number, spotLng: number): string => {
    if (!userLocation) return "Unknown";
    const distance = calculateDistance(userLocation.lat, userLocation.lng, spotLat, spotLng);
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
      {/* Spot List - Full width on mobile, sidebar on desktop */}
      <aside className={`${isMobile ? 'w-full' : 'w-[480px] border-r'} bg-background overflow-y-auto`}>
        <div className="p-4 md:p-6">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className={showVerifiedOnly || showWithPhotosOnly || minRating || maxDistance || selectedSpecies ? "border-primary" : ""}>
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showVerifiedOnly}
                  onCheckedChange={setShowVerifiedOnly}
                >
                  Verified spots only
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showWithPhotosOnly}
                  onCheckedChange={setShowWithPhotosOnly}
                >
                  With photos only
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Distance</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={maxDistance === 10}
                  onCheckedChange={(checked) => setMaxDistance(checked ? 10 : null)}
                  disabled={!userLocation}
                >
                  Within 10 miles
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={maxDistance === 25}
                  onCheckedChange={(checked) => setMaxDistance(checked ? 25 : null)}
                  disabled={!userLocation}
                >
                  Within 25 miles
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={maxDistance === 50}
                  onCheckedChange={(checked) => setMaxDistance(checked ? 50 : null)}
                  disabled={!userLocation}
                >
                  Within 50 miles
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Min Rating</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={minRating === 4}
                  onCheckedChange={(checked) => setMinRating(checked ? 4 : null)}
                >
                  ★ 4.0+
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={minRating === 3}
                  onCheckedChange={(checked) => setMinRating(checked ? 3 : null)}
                >
                  ★ 3.0+
                </DropdownMenuCheckboxItem>
                {allSpecies.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs">Species</DropdownMenuLabel>
                    {allSpecies.slice(0, 10).map((species) => (
                      <DropdownMenuCheckboxItem
                        key={species}
                        checked={selectedSpecies === species}
                        onCheckedChange={(checked) => setSelectedSpecies(checked ? species : null)}
                      >
                        {species}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </>
                )}
                {(showVerifiedOnly || showWithPhotosOnly || minRating || maxDistance || selectedSpecies) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => {
                        setShowVerifiedOnly(false);
                        setShowWithPhotosOnly(false);
                        setMinRating(null);
                        setMaxDistance(null);
                        setSelectedSpecies(null);
                      }}
                      className="text-destructive"
                    >
                      Clear filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
                <div
                  key={spot.id}
                  ref={(el) => {
                    spotCardRefs.current[spot.id] = el;
                  }}
                >
                  <SpotCard
                    spot={spot}
                    distance={getDistanceText(spot.location_lat, spot.location_lng)}
                    isSelected={selectedSpot?.id === spot.id}
                    isHovered={hoveredSpotId === spot.id}
                    isSaved={isSpotSaved(spot.id)}
                    onToggleSave={() => toggleSaveSpot(spot.id)}
                    onClick={() => handleSpotClick(spot)}
                    onMouseEnter={() => {
                      setHoveredSpotId(spot.id);
                      // Highlight marker on map
                      const markerEl = document.querySelector(`[data-spot-id="${spot.id}"]`) as HTMLElement;
                      if (markerEl) {
                        markerEl.style.zIndex = "1000";
                        const card = markerEl.querySelector(".spot-card-marker") as HTMLElement;
                        if (card) {
                          card.style.transform = "scale(1.15)";
                          card.style.boxShadow = "0 8px 24px rgba(59, 130, 246, 0.5)";
                        }
                      }
                      // Pan map to show the spot
                      if (map.current) {
                        map.current.easeTo({
                          center: [spot.location_lng, spot.location_lat],
                          duration: 500,
                        });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredSpotId(null);
                      // Reset marker
                      const markerEl = document.querySelector(`[data-spot-id="${spot.id}"]`) as HTMLElement;
                      if (markerEl) {
                        markerEl.style.zIndex = "";
                        const card = markerEl.querySelector(".spot-card-marker") as HTMLElement;
                        if (card) {
                          card.style.transform = "scale(1)";
                          card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                        }
                      }
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Right Side - Map (hidden on mobile) */}
      {!isMobile && (
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
        <div className="absolute top-24 right-4 z-10 flex flex-col gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleCenterOnLocation}
            className="bg-background shadow-md"
          >
            <Navigation className="h-4 w-4" />
          </Button>
          
          {/* Map Style Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-background shadow-md"
              >
                {(() => {
                  const CurrentIcon = MAP_STYLES[mapStyle].icon;
                  return <CurrentIcon className="h-4 w-4" />;
                })()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {(Object.entries(MAP_STYLES) as [keyof typeof MAP_STYLES, typeof MAP_STYLES[keyof typeof MAP_STYLES]][]).map(([key, style]) => {
                const Icon = style.icon;
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleStyleChange(key)}
                    className={mapStyle === key ? "bg-accent" : ""}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {style.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Add Spot FAB */}
        <Button
          className="absolute bottom-6 right-6 z-10 shadow-lg"
          size="lg"
          onClick={() => navigate("/app/spots/new")}
        >
          <Fish className="h-5 w-5 mr-2" />
          Add Spot
        </Button>
      </div>
      )}
    </div>
  );
}

// Spot Card Component
interface SpotCardProps {
  spot: FishingSpot;
  distance: string;
  isSelected: boolean;
  isHovered: boolean;
  isSaved: boolean;
  onToggleSave: () => void;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function SpotCard({ spot, distance, isSelected, isHovered, isSaved, onToggleSave, onClick, onMouseEnter, onMouseLeave }: SpotCardProps) {
  const navigate = useNavigate();
  const [buddyDialogOpen, setBuddyDialogOpen] = useState(false);

  const getCrowdLevel = (): { label: string; color: string } => {
    // Mock crowd level based on rating count
    const count = spot.rating_count || 0;
    if (count < 10) return { label: "Low Crowd", color: "bg-green-500" };
    if (count < 50) return { label: "Moderate Crowd", color: "bg-amber-500" };
    return { label: "High Crowd", color: "bg-red-500" };
  };

  const crowd = getCrowdLevel();

  const handleSelectBuddy = (buddyId: string) => {
    setBuddyDialogOpen(false);
    navigate(`/app/buddy-trip/${buddyId}/${spot.id}`);
  };

  return (
    <>
      <div
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md ${
          isSelected ? "ring-2 ring-primary" : ""
        } ${isHovered ? "bg-accent/50" : ""}`}
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

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/app/spots/${spot.id}`);
              }}
            >
              View Details
            </Button>
            <Button 
              variant="secondary"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setBuddyDialogOpen(true);
              }}
              title="Plan Trip with Buddy"
            >
              <CalendarPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <BuddySelectionDialog
        open={buddyDialogOpen}
        onOpenChange={setBuddyDialogOpen}
        onSelectBuddy={handleSelectBuddy}
        spotName={spot.name}
      />
    </>
  );
}
