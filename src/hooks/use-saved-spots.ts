import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useSavedSpots = () => {
  const { user } = useAuth();
  const [savedSpotIds, setSavedSpotIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all saved spots for current user
  useEffect(() => {
    const fetchSavedSpots = async () => {
      if (!user?.id) {
        setSavedSpotIds(new Set());
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_saved_spots')
          .select('spot_id')
          .eq('user_id', user.id);

        if (error) throw error;

        const ids = new Set(data?.map(item => item.spot_id) || []);
        setSavedSpotIds(ids);
      } catch (err) {
        console.error('Error fetching saved spots:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedSpots();
  }, [user?.id]);

  const isSpotSaved = useCallback((spotId: string) => {
    return savedSpotIds.has(spotId);
  }, [savedSpotIds]);

  const saveSpot = useCallback(async (spotId: string) => {
    if (!user?.id) {
      toast.error('Please sign in to save spots');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_saved_spots')
        .insert({ user_id: user.id, spot_id: spotId });

      if (error) throw error;

      setSavedSpotIds(prev => new Set([...prev, spotId]));
      toast.success('Spot saved!');
      return true;
    } catch (err: any) {
      // Handle duplicate save attempt gracefully
      if (err.code === '23505') {
        setSavedSpotIds(prev => new Set([...prev, spotId]));
        return true;
      }
      console.error('Error saving spot:', err);
      toast.error('Failed to save spot');
      return false;
    }
  }, [user?.id]);

  const unsaveSpot = useCallback(async (spotId: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('user_saved_spots')
        .delete()
        .eq('user_id', user.id)
        .eq('spot_id', spotId);

      if (error) throw error;

      setSavedSpotIds(prev => {
        const next = new Set(prev);
        next.delete(spotId);
        return next;
      });
      toast.success('Spot removed from saved');
      return true;
    } catch (err) {
      console.error('Error unsaving spot:', err);
      toast.error('Failed to remove spot');
      return false;
    }
  }, [user?.id]);

  const toggleSaveSpot = useCallback(async (spotId: string) => {
    if (isSpotSaved(spotId)) {
      return unsaveSpot(spotId);
    } else {
      return saveSpot(spotId);
    }
  }, [isSpotSaved, saveSpot, unsaveSpot]);

  return {
    savedSpotIds,
    isLoading,
    isSpotSaved,
    saveSpot,
    unsaveSpot,
    toggleSaveSpot,
  };
};
