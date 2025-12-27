import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditAction } from './use-audit-logs';

interface AdminSpot {
  id: string;
  name: string;
  description: string | null;
  location_name: string | null;
  location_lat: number;
  location_lng: number;
  photos: string[] | null;
  species_available: string[] | null;
  is_public: boolean | null;
  is_verified: boolean | null;
  rating_avg: number | null;
  rating_count: number | null;
  created_at: string;
  created_by: string | null;
  creator: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
  } | null;
}

export function useAdminSpots(search?: string) {
  return useQuery({
    queryKey: ['admin-spots', search],
    queryFn: async (): Promise<AdminSpot[]> => {
      let query = supabase
        .from('fishing_spots')
        .select(`
          *,
          creator:profiles!fishing_spots_created_by_fkey(id, display_name, photos)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (search) {
        query = query.or(`name.ilike.%${search}%,location_name.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });
}

export function useVerifySpot() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async ({ spotId, verified }: { spotId: string; verified: boolean }) => {
      const { error } = await supabase
        .from('fishing_spots')
        .update({ is_verified: verified })
        .eq('id', spotId);

      if (error) throw error;
      return { spotId, verified };
    },
    onSuccess: async ({ spotId, verified }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-spots'] });
      toast.success(verified ? 'Spot verified successfully' : 'Spot unverified');
      await logAction(
        verified ? 'spot_verified' : 'spot_unverified',
        'spot',
        spotId,
        { verified }
      );
    },
    onError: (error) => {
      toast.error(`Failed to update spot: ${error.message}`);
    },
  });
}

export function useDeleteSpot() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async (spotId: string) => {
      const { error } = await supabase
        .from('fishing_spots')
        .delete()
        .eq('id', spotId);

      if (error) throw error;
      return spotId;
    },
    onSuccess: async (spotId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-spots'] });
      toast.success('Spot deleted successfully');
      await logAction('spot_deleted', 'spot', spotId);
    },
    onError: (error) => {
      toast.error(`Failed to delete spot: ${error.message}`);
    },
  });
}

export function useToggleSpotPublic() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async ({ spotId, isPublic }: { spotId: string; isPublic: boolean }) => {
      const { error } = await supabase
        .from('fishing_spots')
        .update({ is_public: isPublic })
        .eq('id', spotId);

      if (error) throw error;
      return { spotId, isPublic };
    },
    onSuccess: async ({ spotId, isPublic }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-spots'] });
      toast.success(isPublic ? 'Spot made public' : 'Spot made private');
      await logAction('spot_visibility_changed', 'spot', spotId, { isPublic });
    },
    onError: (error) => {
      toast.error(`Failed to update spot: ${error.message}`);
    },
  });
}
