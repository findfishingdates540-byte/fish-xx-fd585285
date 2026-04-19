import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Fish,
  Navigation,
  RefreshCw,
  Loader2,
  X,
  Mountain,
  Satellite,
  Map,
  Layers,
  Waves,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getCurrentPosition } from "@/lib/location";

interface SharedCatch {
  id: string;
  species_name: string | null;
  weight_lbs: number | null;
  length_in: number | null;
  cover_photo_url: string | null;
  video_url: string | null;
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

type MapStyleKey = "outdoors" | "satellite" | "terrain" | "bathymetry";

const MAP_STYLES: Record<MapStyleKey, { label: string; icon: React.ReactNode; style: string }> = {
  outdoors: {
    label: "Outdoors",
    icon: <Map className="h-4 w-4" />,
    style: "mapbox://styles/mapbox/outdoors-v12",
  },
  satellite: {
    label: "Satellite",
    icon: <Satellite className="h-4 w-4" />,
    style: "mapbox://styles/mapbox/satellite-streets-v12",
  },
  terrain: {
    label: "3D Terrain",
    icon: <Mountain className="h-4 w-4" />,
    style: "mapbox://styles/mapbox/outdoors-v12",
  },
  bathymetry: {
    label: "Depth Map",
    icon: <Waves className="h-4 w-4" />,
    style: "mapbox://styles/mapbox/outdoors-v12",
  },
};

export default function Spots() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { token, isLoading: tokenLoading, error: tokenError } = useMapboxToken();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedCatch, setSelectedCatch] = useState<SharedCatch | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeStyle, setActiveStyle] = useState<MapStyleKey>("outdoors");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [terrainEnabled, setTerrainEnabled] = useState(false);

  // Fetch catches with share_location = true
  const { data: sharedCatches = [], isLoading, refetch } = useQuery({
    queryKey: ['shared-catches-map'],
    queryFn: async () => {
      const { data: catches } = await supabase
        .from('catches')
        .select('id, species_name, weight_lbs, length_in, cover_photo_url, video_url, general_location, location_lat, location_lng, caught_at, catch_status, user_id')
        .eq('share_location', true)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null)
        .order('caught_at', { ascending: false })
        .limit(200);

      if (!catches || catches.length === 0) return [];

      const userIds = [...new Set(catches.map(c => c.user_id))];
      const profileMap = new window.Map<string, { display_name: string | null; photos: string[] | null }>();

      for (let i = 0; i < userIds.length; i += 50) {
        const batch = userIds.slice(i, i + 50);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, photos')
          .in('id', batch);
        profiles?.forEach(p => {
          profileMap.set(p.id, { display_name: p.display_name, photos: p.photos });
        });
      }

      return (catches || []).map(c => ({
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

  // Helper: add terrain + sky to current map
  const enableTerrain = useCallback((map: mapboxgl.Map) => {
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
    }
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
    if (!map.getLayer('sky')) {
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      });
    }
    setTerrainEnabled(true);
  }, []);

  const disableTerrain = useCallback((map: mapboxgl.Map) => {
    map.setTerrain(null as any);
    if (map.getLayer('sky')) map.removeLayer('sky');
    setTerrainEnabled(false);
  }, []);

  // Helper: add bathymetry-like water depth colouring
  const enableBathymetry = useCallback((map: mapboxgl.Map) => {
    // Style water layers with depth-like colouring
    if (map.getLayer('water')) {
      map.setPaintProperty('water', 'fill-color', [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, '#0a3d62',
        5, '#0c5a8a',
        8, '#1289A7',
        12, '#38ada9',
        16, '#6ab8c4',
      ]);
    }
    // Add contour lines for terrain context
    if (!map.getSource('contours')) {
      map.addSource('contours', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-terrain-v2',
      });
    }
    if (!map.getLayer('contour-lines')) {
      map.addLayer({
        id: 'contour-lines',
        type: 'line',
        source: 'contours',
        'source-layer': 'contour',
        paint: {
          'line-color': 'hsl(200, 40%, 60%)',
          'line-width': ['match', ['get', 'index'], 5, 1.5, 10, 2, 0.8],
          'line-opacity': 0.45,
        },
      });
    }
    if (!map.getLayer('contour-labels')) {
      map.addLayer({
        id: 'contour-labels',
        type: 'symbol',
        source: 'contours',
        'source-layer': 'contour',
        filter: ['in', 'index', 5, 10],
        layout: {
          'symbol-placement': 'line',
          'text-field': '{ele} m',
          'text-size': 10,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        },
        paint: {
          'text-color': 'hsl(200, 30%, 50%)',
          'text-halo-color': 'hsl(0, 0%, 100%)',
          'text-halo-width': 1,
        },
      });
    }
  }, []);

  const disableBathymetry = useCallback((map: mapboxgl.Map) => {
    if (map.getLayer('contour-labels')) map.removeLayer('contour-labels');
    if (map.getLayer('contour-lines')) map.removeLayer('contour-lines');
    if (map.getSource('contours')) map.removeSource('contours');
    // Reset water colour
    if (map.getLayer('water')) {
      map.setPaintProperty('water', 'fill-color', '#aad3df');
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!token || !mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[activeStyle].style,
      center: [
        userProfile?.location_lng || -98.5795,
        userProfile?.location_lat || 39.8283,
      ],
      zoom: userProfile?.location_lat ? 8 : 4,
      pitch: activeStyle === 'terrain' ? 60 : 0,
      bearing: activeStyle === 'terrain' ? -17 : 0,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100 }), 'bottom-left');

    map.on('load', () => {
      setMapReady(true);
      if (activeStyle === 'terrain') enableTerrain(map);
      if (activeStyle === 'bathymetry') {
        enableTerrain(map);
        enableBathymetry(map);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userProfile?.location_lat, userProfile?.location_lng]);

  // Switch map styles
  const switchStyle = useCallback((key: MapStyleKey) => {
    const map = mapRef.current;
    if (!map) return;

    setActiveStyle(key);
    setShowStylePicker(false);

    const center = map.getCenter();
    const zoom = map.getZoom();

    map.setStyle(MAP_STYLES[key].style);

    map.once('style.load', () => {
      map.setCenter(center);
      map.setZoom(zoom);

      if (key === 'terrain' || key === 'bathymetry') {
        map.setPitch(60);
        map.setBearing(-17);
        enableTerrain(map);
      } else {
        map.setPitch(0);
        map.setBearing(0);
        disableTerrain(map);
      }

      if (key === 'bathymetry') {
        enableBathymetry(map);
      } else {
        // no-op – layers are gone after style change
      }

      // Re-add markers after style change
      markersRef.current = [];
      sharedCatches.forEach((catchItem) => {
        if (!catchItem.location_lat || !catchItem.location_lng) return;
        const el = createMarkerEl();
        const marker = new mapboxgl.Marker(el)
          .setLngLat([catchItem.location_lng, catchItem.location_lat])
          .addTo(map);
        el.addEventListener('click', () => {
          setSelectedCatch(catchItem);
          map.flyTo({
            center: [catchItem.location_lng!, catchItem.location_lat!],
            zoom: 12,
            duration: 800,
          });
        });
        markersRef.current.push(marker);
      });
    });
  }, [enableTerrain, disableTerrain, enableBathymetry, sharedCatches]);

  // Marker factory
  const createMarkerEl = () => {
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
    return el;
  };

  // Add markers for shared catches
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    sharedCatches.forEach(catchItem => {
      if (!catchItem.location_lat || !catchItem.location_lng) return;

      const el = createMarkerEl();
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
      getCurrentPosition()
        .then((coords) => {
          mapRef.current?.flyTo({
            center: [coords.lng, coords.lat],
            zoom: 10,
            duration: 1000,
          });
        })
        .catch(() => {});
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
          {/* Style Picker Toggle */}
          <div className="relative">
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full bg-card/90 backdrop-blur-sm shadow-lg border"
              onClick={() => setShowStylePicker(!showStylePicker)}
            >
              <Layers className="h-4 w-4" />
            </Button>

            {/* Style Picker Dropdown */}
            {showStylePicker && (
              <div className="absolute right-0 top-11 bg-card rounded-xl shadow-xl border p-2 min-w-[160px] z-20">
                {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => switchStyle(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      activeStyle === key
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {MAP_STYLES[key].icon}
                    {MAP_STYLES[key].label}
                  </button>
                ))}
              </div>
            )}
          </div>

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

      {/* Active Mode Badge */}
      <div className="absolute top-16 right-3 z-10">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md border text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          {MAP_STYLES[activeStyle].icon}
          {MAP_STYLES[activeStyle].label}
          {terrainEnabled && activeStyle !== 'terrain' && activeStyle !== 'bathymetry' ? '' : ''}
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
            {selectedCatch.cover_photo_url && (
              <img
                src={selectedCatch.cover_photo_url}
                alt="Catch"
                className="w-20 h-20 rounded-lg object-cover shrink-0"
              />
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base truncate">
                {selectedCatch.species_name || 'Unknown Species'}
              </h3>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                {selectedCatch.weight_lbs && (
                  <span>{selectedCatch.weight_lbs} lbs</span>
                )}
                {selectedCatch.length_in && (
                  <span>{selectedCatch.length_in}"</span>
                )}
                <span className="capitalize">{selectedCatch.catch_status}</span>
              </div>

              {selectedCatch.general_location && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedCatch.general_location}
                </p>
              )}

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

      {/* Empty state overlay */}
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
