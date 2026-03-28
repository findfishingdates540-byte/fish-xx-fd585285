import { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Fish,
  Navigation,
  RefreshCw,
  Loader2,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface SharedCatch {
  id: string;
  species_name: string | null;
  weight_lbs: number | null;
  length_in: number | null;
  cover_photo_url: string | null;
  general_location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  caught_at: string | null;
  catch_status: string;
  user_id: string;
  profile?: {
    display_name: string | null;
    photos: string[] | null;
  } | null;
}

export default function Spots() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { token, isLoading: tokenLoading, error: tokenError } = useMapboxToken();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedCatch, setSelectedCatch] = useState<SharedCatch | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Fetch catches with share_location = true
  const { data: sharedCatches = [], isLoading, refetch } = useQuery({
    queryKey: ['shared-catches-map'],
    queryFn: async (): Promise<SharedCatch[]> => {
      const { data, error } = await (supabase
        .from('catches')
        .select('id, species_name, weight_lbs, length_in, cover_photo_url, general_location, location_lat, location_lng, caught_at, catch_status, user_id')
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null)
        .order('caught_at', { ascending: false })
        .limit(500) as any);

      if (error) {
        console.error('Error fetching shared catches:', error);
        return [];
      }

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      let profileMap = new Map<string, { display_name: string | null; photos: string[] | null }>();
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, photos')
          .in('id', userIds);
        
        profiles?.forEach(p => {
          profileMap.set(p.id, { display_name: p.display_name, photos: p.photos });
        });
      }

      return (data || []).map(c => ({
        ...c,
        profile: profileMap.get(c.user_id) || null,
      })) as SharedCatch[];
    },
    staleTime: 60 * 1000,
  });

  // Get user's location for centering map
  const { data: userProfile } = useQuery({
    queryKey: ['user-location-spots', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('location_lat, location_lng')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Initialize map
  useEffect(() => {
    if (!token || !mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [
        userProfile?.location_lng || -98.5795,
        userProfile?.location_lat || 39.8283,
      ],
      zoom: userProfile?.location_lat ? 8 : 4,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [token, userProfile?.location_lat, userProfile?.location_lng]);

  // Add markers for shared catches
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    sharedCatches.forEach(catchItem => {
      if (!catchItem.location_lat || !catchItem.location_lng) return;

      const el = document.createElement('div');
      el.className = 'catch-marker';
      el.style.cssText = `
        width: 32px; height: 32px; border-radius: 50%;
        background: hsl(var(--primary));
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px;
      `;
      el.textContent = '🐟';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([catchItem.location_lng, catchItem.location_lat])
        .addTo(mapRef.current!);

      el.addEventListener('click', () => {
        setSelectedCatch(catchItem);
        mapRef.current?.flyTo({
          center: [catchItem.location_lng!, catchItem.location_lat!],
          zoom: 12,
          duration: 800,
        });
      });

      markersRef.current.push(marker);
    });
  }, [sharedCatches, mapReady]);

  const handleLocateUser = useCallback(() => {
    if (!mapRef.current) return;
    if (userProfile?.location_lat && userProfile?.location_lng) {
      mapRef.current.flyTo({
        center: [userProfile.location_lng, userProfile.location_lat],
        zoom: 10,
        duration: 1000,
      });
    } else {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          mapRef.current?.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 10,
            duration: 1000,
          });
        },
        () => {}
      );
    }
  }, [userProfile]);

  if (tokenLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Map Unavailable</h2>
          <p className="text-sm text-muted-foreground">Unable to load the map. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 64px)' }}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Header Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between">
        <div className="bg-card/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border flex items-center gap-2">
          <Fish className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Community Catches</span>
          {!isLoading && (
            <span className="text-xs text-muted-foreground">({sharedCatches.length})</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm shadow-lg border"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm shadow-lg border"
            onClick={handleLocateUser}
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selected Catch Detail Panel */}
      {selectedCatch && (
        <div className="absolute bottom-4 left-3 right-3 z-10 bg-card rounded-xl shadow-xl border p-4 max-w-md mx-auto">
          <button
            onClick={() => setSelectedCatch(null)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex gap-3">
            {/* Catch Photo */}
            {selectedCatch.cover_photo_url && (
              <img
                src={selectedCatch.cover_photo_url}
                alt="Catch"
                className="w-20 h-20 rounded-lg object-cover shrink-0"
              />
            )}

            <div className="flex-1 min-w-0">
              {/* Species */}
              <h3 className="font-bold text-base truncate">
                {selectedCatch.species_name || 'Unknown Species'}
              </h3>

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                {selectedCatch.weight_lbs && (
                  <span>{selectedCatch.weight_lbs} lbs</span>
                )}
                {selectedCatch.length_in && (
                  <span>{selectedCatch.length_in}"</span>
                )}
                <span className="capitalize">{selectedCatch.catch_status}</span>
              </div>

              {/* Location */}
              {selectedCatch.general_location && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedCatch.general_location}
                </p>
              )}

              {/* Angler */}
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={selectedCatch.profile?.photos?.[0] || ''} />
                  <AvatarFallback className="text-[8px]">
                    {selectedCatch.profile?.display_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium truncate">
                  {selectedCatch.profile?.display_name || 'Anonymous'}
                </span>
                {selectedCatch.caught_at && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(selectedCatch.caught_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading catches...</span>
          </div>
        </div>
      )}

      {/* Empty state overlay when no catches */}
      {!isLoading && sharedCatches.length === 0 && mapReady && (
        <div className="absolute bottom-4 left-3 right-3 z-10">
          <div className="bg-card rounded-xl shadow-lg border p-6 text-center max-w-sm mx-auto">
            <Fish className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No shared catches yet</h3>
            <p className="text-sm text-muted-foreground">
              Be the first! Log a catch and toggle "Share on Spots Map" to pin your location.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
