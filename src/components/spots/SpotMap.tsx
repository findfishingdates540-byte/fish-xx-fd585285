import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Tables } from '@/integrations/supabase/types';

interface SpotMapProps {
  spots: Tables<'fishing_spots'>[];
  onSpotSelect?: (spot: Tables<'fishing_spots'>) => void;
  mapboxToken: string;
  userLocation?: { lat: number; lng: number } | null;
}

const SpotMap = ({ spots, onSpotSelect, mapboxToken, userLocation }: SpotMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const center: [number, number] = userLocation 
      ? [userLocation.lng, userLocation.lat] 
      : [-95.7129, 37.0902]; // Default to US center

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      zoom: userLocation ? 10 : 4,
      center,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      'top-right'
    );

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, [mapboxToken, userLocation]);

  useEffect(() => {
    if (!map.current || !spots.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each spot
    spots.forEach((spot) => {
      const el = document.createElement('div');
      el.className = 'spot-marker';
      el.innerHTML = `
        <div class="w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([Number(spot.location_lng), Number(spot.location_lat)])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onSpotSelect?.(spot);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (spots.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      spots.forEach((spot) => {
        bounds.extend([Number(spot.location_lng), Number(spot.location_lat)]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    } else if (spots.length === 1) {
      map.current.flyTo({
        center: [Number(spots[0].location_lng), Number(spots[0].location_lat)],
        zoom: 12,
      });
    }
  }, [spots, onSpotSelect]);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-xl overflow-hidden" />
    </div>
  );
};

export default SpotMap;
