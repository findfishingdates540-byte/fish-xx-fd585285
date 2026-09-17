import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import { Loader2, MapPinOff } from "lucide-react";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string | null;
  kind: "catch" | "spot";
}

interface ExplorerMapProps {
  points: MapPoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * Shared map surface for the Catch Explorer.
 * Flies to the selected point with a cinematic ease and pulses its marker.
 */
export function ExplorerMap({ points, selectedId, onSelect, className }: ExplorerMapProps) {
  const { token, isLoading, error } = useMapboxToken();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Init map
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;

    if (typeof mapboxgl.supported === "function" && !mapboxgl.supported()) {
      setMapError("WebGL is not available in this browser.");
      return;
    }

    let map: mapboxgl.Map;
    try {
      mapboxgl.accessToken = token;
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: [-98.5795, 39.8283],
        zoom: 3.2,
        attributionControl: false,
      });
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
      map.on("load", () => setReady(true));
      map.on("error", (e) => console.warn("Mapbox error:", e?.error?.message));
    } catch (err) {
      console.error("Failed to initialize map:", err);
      setMapError("Map could not be initialized.");
      return;
    }
    mapRef.current = map;
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [token]);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    points.forEach((p) => {
      const el = document.createElement("button");
      el.type = "button";
      el.dataset.pointId = p.id;
      el.className = "explorer-marker";
      el.innerHTML = `<span class="explorer-marker__pulse"></span><span class="explorer-marker__dot">${
        p.kind === "catch" ? "🐟" : "📍"
      }</span>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelectRef.current(p.id);
      });
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      markersRef.current.set(p.id, marker);
    });

    // Fit to all points on first render of a dataset
    if (points.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      points.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 9, duration: 900 });
    }
  }, [points, ready]);

  // Fly to selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((marker, id) => {
      marker.getElement().classList.toggle("is-active", id === selectedId);
    });

    if (!selectedId) return;
    const point = points.find((p) => p.id === selectedId);
    if (!point) return;
    map.flyTo({
      center: [point.lng, point.lat],
      zoom: 13.5,
      pitch: 55,
      speed: 1.1,
      curve: 1.5,
      essential: true,
    });
  }, [selectedId, points, ready]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-muted ${className || ""}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {(isLoading || (!ready && !error)) && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/70 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <MapPinOff className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Map unavailable right now.</p>
        </div>
      )}
      {ready && points.length === 0 && !error && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border bg-background/85 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
          No mapped locations yet
        </div>
      )}
    </div>
  );
}