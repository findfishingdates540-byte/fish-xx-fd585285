import { useState, useEffect } from 'react';
import { Map, List } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SpotMap,
  SpotList,
  AddSpotDialog,
  SpotDetailSheet,
  MapboxTokenInput,
  getMapboxToken,
} from '@/components/spots';

export default function Spots() {
  const [view, setView] = useState<'map' | 'list'>('map');
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<Tables<'fishing_spots'> | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const token = getMapboxToken();
    if (token) setMapboxToken(token);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {}
    );
  }, []);

  const { data: spots = [], isLoading, refetch } = useQuery({
    queryKey: ['fishing-spots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fishing_spots')
        .select('*')
        .eq('is_public', true)
        .order('rating_avg', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (!mapboxToken) {
    return <MapboxTokenInput onTokenSet={setMapboxToken} />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-bold">Fishing Spots</h1>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as 'map' | 'list')}>
            <TabsList className="h-9">
              <TabsTrigger value="map" className="px-3">
                <Map className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-3">
                <List className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {view === 'map' ? (
          <SpotMap
            spots={spots}
            onSpotSelect={setSelectedSpot}
            mapboxToken={mapboxToken}
            userLocation={userLocation}
          />
        ) : (
          <SpotList
            spots={spots}
            onSpotSelect={setSelectedSpot}
            isLoading={isLoading}
          />
        )}

        {/* Add Spot FAB */}
        <div className="absolute bottom-4 right-4 z-10">
          <AddSpotDialog onSpotAdded={() => refetch()} />
        </div>
      </div>

      {/* Spot Detail Sheet */}
      <SpotDetailSheet
        spot={selectedSpot}
        open={!!selectedSpot}
        onClose={() => setSelectedSpot(null)}
      />
    </div>
  );
}
