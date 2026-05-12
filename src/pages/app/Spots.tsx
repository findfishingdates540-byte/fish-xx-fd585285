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
  Loader2,
  X,
  Mountain,
  Satellite,
  Map,
  Layers,
  Waves,
  Compass,
  Sparkles,
  Crosshair,
  Pencil,
} from "lucide-react";
import { Filter, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getCurrentPosition } from "@/lib/location";
import { AdBanner } from "@/components/ads/AdBanner";
import { FishXIcon } from "@/components/ui/fishx-icon";
import { useWeather } from "@/hooks/use-weather";
import { Anchor } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import boatSpotIconUrl from "@/assets/icons/fishx_icon_boat_spots.png";

// Heuristic: a spot is "boat-only" (cannot be reached from shore) when
// it sits in deeper water, is offshore, or its area type implies open water.
const isBoatOnlySpot = (s: { area_type?: string | null; depth_ft?: number | null; coast?: string | null; name?: string | null; description?: string | null; location_name?: string | null }) => {
  const at = (s.area_type || "").toLowerCase();
  const co = (s.coast || "").toLowerCase();
  if (at && /(offshore|reef|wreck|oil|rig|buoy|deep|open[-_ ]?water|nearshore)/.test(at)) return true;
  if (co && /offshore/.test(co)) return true;
  if (typeof s.depth_ft === "number" && s.depth_ft >= 30) return true;
  // Detect imported offshore datasets by name / description / location signals
  const haystack = `${s.name || ""} ${s.description || ""} ${s.location_name || ""}`.toLowerCase();
  if (/(pulley ridge|hogfish spot|red snapper snapper|warsaw grouper|hog-\d|warsaw-\d|snapper-\d)/.test(haystack)) return true;
  if (/(artificial reef|patch reef|coral rubble|hard bottom|rock pile|ledge|wreck|canyon|drop ?-?off|shelf edge|deep drop)/.test(haystack)) return true;
  return false;
};

const boatIconMissingBoundMaps = new WeakSet<mapboxgl.Map>();

const ensureBoatIcon = (map: mapboxgl.Map) => {
  if (map.hasImage("boat-spot-icon")) return;
  const size = 64;
  const img = new Image();
  img.width = size;
  img.height = size;
  img.decoding = "async";
  img.onload = () => {
    try {
      if (!map.hasImage("boat-spot-icon")) {
        map.addImage("boat-spot-icon", img, { pixelRatio: 2 });
      }
    } catch (e) {
      console.warn("Failed to add boat-spot-icon", e);
    }
  };
  img.onerror = (e) => console.warn("boat-spot-icon failed to load", e);
  img.src = boatSpotIconUrl;
  // Fallback handler in case the icon is requested before load completes
  if (!boatIconMissingBoundMaps.has(map)) {
    boatIconMissingBoundMaps.add(map);
    map.on("styleimagemissing", (ev) => {
      if (ev.id === "boat-spot-icon") ensureBoatIcon(map);
    });
  }
};

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

interface FishingSpot {
  id: string;
  name: string | null;
  description: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_name: string | null;
  county: string | null;
  depth_ft: number | null;
  relief_ft: number | null;
  primary_material: string | null;
  jurisdiction: string | null;
  coast: string | null;
  deploy_date: string | null;
  source: string | null;
  area_type: string | null;
  location_accuracy: string | null;
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

const triggerMapResize = (map: mapboxgl.Map) => {
  map.resize();
  requestAnimationFrame(() => map.resize());
  window.setTimeout(() => map.resize(), 250);
  window.setTimeout(() => map.resize(), 750);
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
  const [crosshair, setCrosshair] = useState<{ lat: number; lng: number }>({ lat: 39.8283, lng: -98.5795 });
  const [bearing, setBearing] = useState(0);
  const [showWeather, setShowWeather] = useState(false);
  const weatherQuery = useWeather(showWeather ? crosshair.lat : null, showWeather ? crosshair.lng : null);
  const [selectedSpot, setSelectedSpot] = useState<FishingSpot | null>(null);
  const [showReefs, setShowReefs] = useState(true);
  const [showReefFilters, setShowReefFilters] = useState(false);
  const [filterCounty, setFilterCounty] = useState<string>('all');
  const [filterCoast, setFilterCoast] = useState<string>('all');
  const [filterDepthMin, setFilterDepthMin] = useState<number>(0);
  const [filterDepthMax, setFilterDepthMax] = useState<number>(500);
  const [filterSearch, setFilterSearch] = useState('');

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
          .from('profiles_safe')
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

  // Fetch fishing spots (reefs)
  const { data: fishingSpots = [] } = useQuery({
    queryKey: ['map-fishing-spots'],
    queryFn: async () => {
      const { data } = await supabase
        .from('fishing_spots')
        .select('id, name, description, location_lat, location_lng, location_name, county, depth_ft, relief_ft, primary_material, jurisdiction, coast, deploy_date, source, area_type, location_accuracy')
        .eq('is_public', true)
        .not('location_lat', 'is', null)
        .not('location_lng', 'is', null)
        .limit(5000);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Derive unique counties from data
  const countyOptions = Array.from(new Set(fishingSpots.map(s => s.county).filter(Boolean) as string[])).sort();

  // Filtered spots
  const filteredSpots = fishingSpots.filter(spot => {
    if (filterCounty !== 'all' && spot.county !== filterCounty) return false;
    if (filterCoast !== 'all' && spot.coast !== filterCoast) return false;
    if (spot.depth_ft != null) {
      if (spot.depth_ft < filterDepthMin || spot.depth_ft > filterDepthMax) return false;
    }
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const nameMatch = spot.name?.toLowerCase().includes(q);
      const descMatch = spot.description?.toLowerCase().includes(q);
      const matMatch = (spot.primary_material as string | null)?.toLowerCase().includes(q);
      if (!nameMatch && !descMatch && !matMatch) return false;
    }
    return true;
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
    map.setTerrain(null);
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
      projection: 'mercator',
    });

    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100 }), 'bottom-left');

    const updateCrosshair = () => {
      const c = map.getCenter();
      setCrosshair({ lat: +c.lat.toFixed(6), lng: +c.lng.toFixed(6) });
      setBearing(map.getBearing());
    };
    map.on('move', updateCrosshair);
    updateCrosshair();

    map.on('load', () => {
      setMapReady(true);
      if (activeStyle === 'terrain') enableTerrain(map);
      if (activeStyle === 'bathymetry') {
        enableTerrain(map);
        enableBathymetry(map);
      }
      triggerMapResize(map);
    });

    map.on('styledata', () => triggerMapResize(map));

    mapRef.current = map;

    // Resize map whenever the container changes size (e.g. after PageTransition
    // finishes animating from scale(0.98) → scale(1), or on window resize).
    const ro = new ResizeObserver(() => {
      try { map.resize(); } catch { /* map removed */ }
    });
    ro.observe(mapContainerRef.current);

    return () => {
      ro.disconnect();
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
      markersRef.current.forEach(m => m.remove());
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

      // Re-add spot GeoJSON layers after style change
      const sId = 'fishing-spots-source';
      const sg: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: (!showReefs ? [] : filteredSpots).filter(s => s.location_lat && s.location_lng).map(s => ({ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [s.location_lng, s.location_lat] }, properties: { spotId: s.id, boat: isBoatOnlySpot(s) } })) };
      ensureBoatIcon(map);
      map.addSource(sId, { type: 'geojson', data: sg, cluster: false });
      map.addLayer({ id: 'spot-unclustered', type: 'circle', source: sId, filter: ['!=', ['get', 'boat'], true], paint: { 'circle-color': '#ef4444', 'circle-radius': 7, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' } });
      map.addLayer({ id: 'spot-boat', type: 'symbol', source: sId, filter: ['==', ['get', 'boat'], true], layout: { 'icon-image': 'boat-spot-icon', 'icon-size': 0.55, 'icon-allow-overlap': true, 'icon-ignore-placement': true } });
    });
  }, [enableTerrain, disableTerrain, enableBathymetry, sharedCatches, filteredSpots, showReefs]);

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

  // Fishing spots as clustered GeoJSON layers (GPU-rendered for smooth panning)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const sourceId = 'fishing-spots-source';
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: (!showReefs ? [] : filteredSpots)
        .filter(s => s.location_lat && s.location_lng)
        .map(s => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [s.location_lng, s.location_lat] },
          properties: { spotId: s.id, boat: isBoatOnlySpot(s) },
        })),
    };

    const apply = () => {
      const existing = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
      if (existing) { existing.setData(geojson); return; }

      ensureBoatIcon(map);
      map.addSource(sourceId, { type: 'geojson', data: geojson, cluster: false });
      map.addLayer({ id: 'spot-unclustered', type: 'circle', source: sourceId, filter: ['!=', ['get', 'boat'], true], paint: { 'circle-color': '#ef4444', 'circle-radius': 7, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' } });
      map.addLayer({ id: 'spot-boat', type: 'symbol', source: sourceId, filter: ['==', ['get', 'boat'], true], layout: { 'icon-image': 'boat-spot-icon', 'icon-size': 0.55, 'icon-allow-overlap': true, 'icon-ignore-placement': true } });

      const handleSpotClick = (e: mapboxgl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['spot-unclustered', 'spot-boat'] });
        if (!features.length) return;
        const spot = fishingSpots.find(s => s.id === features[0].properties?.spotId);
        if (spot) { setSelectedCatch(null); setSelectedSpot(spot); map.flyTo({ center: [spot.location_lng, spot.location_lat], zoom: 12, duration: 800 }); }
      };
      map.on('click', 'spot-unclustered', handleSpotClick);
      map.on('click', 'spot-boat', handleSpotClick);

      const setPointer = () => { map.getCanvas().style.cursor = 'pointer'; };
      const clearPointer = () => { map.getCanvas().style.cursor = ''; };
      map.on('mouseenter', 'spot-unclustered', setPointer);
      map.on('mouseleave', 'spot-unclustered', clearPointer);
      map.on('mouseenter', 'spot-boat', setPointer);
      map.on('mouseleave', 'spot-boat', clearPointer);
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once('style.load', apply);
    }
  }, [filteredSpots, mapReady, showReefs, fishingSpots]);

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

      {/* Top-Left stacked controls */}
      <div className="absolute top-20 left-3 sm:top-24 sm:left-4 z-10 flex flex-col gap-2.5">
        <button
          onClick={() => navigate('/app/feed')}
          aria-label="Close map"
          className="h-11 w-11 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-white/90 transition active:scale-95"
        >
          <X className="h-5 w-5 text-slate-900" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowStylePicker(!showStylePicker)}
            aria-label="Map layers"
            className="h-11 w-11 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-white/90 transition active:scale-95 relative"
          >
            <Layers className="h-5 w-5 text-slate-900" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white" />
          </button>
          {showStylePicker && (
            <div className="absolute left-12 top-0 bg-card rounded-xl shadow-xl border p-2 min-w-[170px] z-20">
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
      </div>

      {/* Right-Side vertical toolbar pill */}
      <div className="absolute top-20 right-3 sm:top-24 sm:right-4 z-10 flex flex-col items-center gap-2 bg-white rounded-full shadow-xl px-1.5 py-2.5">
        <button
          onClick={() => setShowWeather((s) => !s)}
          aria-label="Weather"
          className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
        >
          <FishXIcon name="weather" size={28} />
        </button>
        <button
          onClick={() => {}}
          aria-label="AI suggestions (coming soon)"
          className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
        >
          <Sparkles className="h-5 w-5 text-slate-900" />
        </button>
        <button
          onClick={() => refetch()}
          aria-label="Refresh"
          className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
        >
          <Compass className="h-5 w-5 text-slate-900" />
        </button>
        <button
          onClick={() => {}}
          aria-label="Verified anglers (coming soon)"
          className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
        >
          <FishXIcon name="achievement" size={28} />
        </button>
        <button
          onClick={() => navigate(`/app/catches?lat=${crosshair.lat}&lng=${crosshair.lng}`)}
          aria-label="Drop pin and log catch"
          className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
        >
          <MapPin className="h-5 w-5 text-slate-900" />
        </button>
        <button
          onClick={() => setShowReefs(!showReefs)}
          aria-label="Toggle reef spots"
          className={`h-10 w-10 rounded-full flex items-center justify-center transition active:scale-95 ${showReefs ? 'bg-red-100' : 'hover:bg-slate-100'}`}
        >
          <Anchor className={`h-5 w-5 ${showReefs ? 'text-red-600' : 'text-slate-900'}`} />
        </button>
        {showReefs && (
          <button
            onClick={() => setShowReefFilters(!showReefFilters)}
            aria-label="Filter reef spots"
            className={`h-10 w-10 rounded-full flex items-center justify-center transition active:scale-95 ${showReefFilters ? 'bg-primary/10' : 'hover:bg-slate-100'}`}
          >
            <Filter className={`h-5 w-5 ${showReefFilters ? 'text-primary' : 'text-slate-900'}`} />
          </button>
        )}
      </div>

      {/* Reef filter panel */}
      {showReefs && showReefFilters && (
        <div className="absolute top-20 left-3 sm:top-24 sm:left-4 z-20 bg-white rounded-2xl shadow-2xl border p-4 w-72 text-slate-900">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm">Filter Reefs ({filteredSpots.length})</h4>
            <button onClick={() => setShowReefFilters(false)}><X className="h-4 w-4" /></button>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Search</Label>
              <Input
                placeholder="Name, material..."
                value={filterSearch}
                onChange={e => setFilterSearch(e.target.value)}
                className="h-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-500 mb-1 block">County</Label>
              <Select value={filterCounty} onValueChange={setFilterCounty}>
                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All Counties</SelectItem>
                  {countyOptions.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Coast</Label>
              <Select value={filterCoast} onValueChange={setFilterCoast}>
                <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coasts</SelectItem>
                  <SelectItem value="Gulf">Gulf</SelectItem>
                  <SelectItem value="Atlantic">Atlantic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Depth: {filterDepthMin}–{filterDepthMax} ft</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={filterDepthMin}
                  onChange={e => setFilterDepthMin(Number(e.target.value) || 0)}
                  className="h-7 w-16 text-xs bg-slate-50 border-slate-200"
                  min={0}
                />
                <span className="text-xs text-slate-400">to</span>
                <Input
                  type="number"
                  value={filterDepthMax}
                  onChange={e => setFilterDepthMax(Number(e.target.value) || 500)}
                  className="h-7 w-16 text-xs bg-slate-50 border-slate-200"
                  min={0}
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setFilterCounty('all');
                setFilterCoast('all');
                setFilterDepthMin(0);
                setFilterDepthMax(500);
                setFilterSearch('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}

      {/* Weather popover */}
      {showWeather && (
        <div className="absolute top-20 right-20 sm:top-24 sm:right-24 z-20 bg-white rounded-2xl shadow-2xl border p-4 w-64 text-slate-900">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-sm">Local conditions</h4>
            <button onClick={() => setShowWeather(false)}><X className="h-4 w-4" /></button>
          </div>
          {weatherQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {weatherQuery.data && (
            <div className="space-y-1 text-sm">
              <div className="text-2xl font-bold">{Math.round(weatherQuery.data.temperature)}°F</div>
              <div className="capitalize text-slate-600">{weatherQuery.data.description}</div>
              <div className="text-xs text-slate-500 mt-2">
                Wind {Math.round(weatherQuery.data.wind.speed)} mph · Humidity {weatherQuery.data.humidity}%
              </div>
              <div className="text-xs text-slate-400">{weatherQuery.data.location}</div>
            </div>
          )}
          {weatherQuery.error && (
            <p className="text-xs text-slate-500">Couldn't load weather for this location.</p>
          )}
        </div>
      )}

      {/* Center crosshair */}
      <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
        <Crosshair className="h-7 w-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" strokeWidth={2.25} />
      </div>

      {/* Bottom-right compass + recenter pill */}
      <div className="absolute bottom-6 right-3 sm:right-4 z-10 flex flex-col items-center gap-1 bg-white rounded-full shadow-xl px-1.5 py-2.5">
        <button
          onClick={() => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 600 })}
          aria-label="Reset north"
          className="h-10 w-10 rounded-full flex flex-col items-center justify-center hover:bg-slate-100 transition active:scale-95"
        >
          <span className="text-[10px] font-bold leading-none text-slate-900">N</span>
          <Navigation
            className="h-3.5 w-3.5 text-rose-500 fill-rose-500 mt-0.5"
            style={{ transform: `rotate(${-bearing}deg)` }}
          />
        </button>
        <button
          onClick={handleLocateUser}
          aria-label="Recenter to my location"
          className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition active:scale-95"
        >
          <Navigation className="h-5 w-5 text-slate-900" />
        </button>
      </div>

      {/* Bottom coordinates pill */}
      {!selectedCatch && !selectedSpot && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 max-w-[calc(100%-7rem)]">
          <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md text-white rounded-full px-4 py-2.5 shadow-xl">
            <span className="font-mono text-xs sm:text-sm tracking-tight tabular-nums truncate">
              {crosshair.lat.toFixed(6)}, {crosshair.lng.toFixed(6)}
            </span>
            <button
              onClick={() => navigate(`/app/catches?lat=${crosshair.lat}&lng=${crosshair.lng}`)}
              className="ml-1 p-1 rounded-full hover:bg-white/10 transition"
              aria-label="Save this location"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Selected Catch Detail Panel */}
      {selectedCatch && (
        <div className="absolute bottom-4 left-3 right-3 z-10 bg-card rounded-xl shadow-xl border p-4 max-w-md mx-auto">
          <button
            onClick={() => { setSelectedCatch(null); }}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex gap-3">
            {selectedCatch.cover_photo_url && (
              <div className="relative shrink-0">
                <img
                  src={selectedCatch.cover_photo_url}
                  alt="Catch"
                  className="w-20 h-20 rounded-lg object-cover"
                />
                {selectedCatch.video_url && (
                  <span className="absolute bottom-1 right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/70 text-white text-[10px]">
                    ▶
                  </span>
                )}
              </div>
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

          <Button
            size="sm"
            className="w-full mt-3"
            onClick={() => navigate(`/app/catches/${selectedCatch.id}`)}
          >
            View full details
          </Button>

          {/* Sponsored banner — hidden for premium users automatically */}
          <div className="mt-3">
            <AdBanner variant="compact" />
          </div>
        </div>
      )}

      {/* Selected Spot (Reef) Detail Panel */}
      {selectedSpot && (
        <div className="absolute bottom-4 left-3 right-3 z-10 bg-card rounded-xl shadow-xl border p-4 max-w-md mx-auto">
          <button
            onClick={() => setSelectedSpot(null)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⚓</span>
              <h3 className="font-bold text-base truncate">{selectedSpot.name}</h3>
            </div>

            {selectedSpot.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{selectedSpot.description}</p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {selectedSpot.depth_ft && <span>Depth: {selectedSpot.depth_ft}ft</span>}
              {selectedSpot.relief_ft && <span>Relief: {selectedSpot.relief_ft}ft</span>}
              {selectedSpot.county && <span>{selectedSpot.county} County</span>}
              {selectedSpot.coast && <span>{selectedSpot.coast} Coast</span>}
              {selectedSpot.jurisdiction && <span>{selectedSpot.jurisdiction}</span>}
            </div>

            {selectedSpot.primary_material && (
              <p className="text-xs text-muted-foreground mt-1">Material: {selectedSpot.primary_material}</p>
            )}

            {selectedSpot.deploy_date && (
              <p className="text-xs text-muted-foreground mt-1">
                Deployed: {new Date(selectedSpot.deploy_date).toLocaleDateString()}
              </p>
            )}

            {selectedSpot.source && (
              <p className="text-[10px] text-muted-foreground/60 mt-2">
                Source:{' '}
                {/^https?:\/\//.test(selectedSpot.source) ? (
                  <a href={selectedSpot.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                    {selectedSpot.source}
                  </a>
                ) : (
                  selectedSpot.source
                )}
              </p>
            )}

            {selectedSpot.location_lat != null && selectedSpot.location_lng != null && (
              <div className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                <span>{Number(selectedSpot.location_lat).toFixed(6)}, {Number(selectedSpot.location_lng).toFixed(6)}</span>
                {selectedSpot.location_accuracy && (
                  <span className="ml-2">±{selectedSpot.location_accuracy}</span>
                )}
              </div>
            )}
          </div>

          <Button
            size="sm"
            className="w-full mt-3"
            onClick={() => navigate(`/app/spots/${selectedSpot.id}`)}
          >
            View spot details
          </Button>
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
      {!isLoading && sharedCatches.length === 0 && fishingSpots.length === 0 && mapReady && (
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
