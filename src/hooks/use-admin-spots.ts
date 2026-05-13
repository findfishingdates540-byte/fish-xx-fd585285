import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  area_type: string | null;
  created_at: string;
  created_by: string | null;
  creator: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
  } | null;
}

export const ADMIN_SPOTS_PAGE_SIZE = 60;

export function useAdminSpots(search?: string) {
  return useInfiniteQuery({
    queryKey: ['admin-spots', search ?? ''],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase.rpc('admin_search_spots', {
        p_search: search && search.trim() ? search.trim() : null,
        p_limit: ADMIN_SPOTS_PAGE_SIZE,
        p_offset: pageParam as number,
      });
      if (error) throw error;
      const rows = (data ?? []) as Array<AdminSpot & { total_count: number }>;
      const total = rows[0]?.total_count ?? 0;
      return {
        spots: rows.map(({ total_count, ...s }) => s as AdminSpot),
        total: Number(total),
        nextOffset: (pageParam as number) + rows.length,
      };
    },
    getNextPageParam: (last) =>
      last.nextOffset < last.total ? last.nextOffset : undefined,
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

// Bulk actions
export function useBulkDeleteSpots() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async (spotIds: string[]) => {
      const { error } = await supabase
        .from('fishing_spots')
        .delete()
        .in('id', spotIds);

      if (error) throw error;
      return spotIds;
    },
    onSuccess: async (spotIds) => {
      queryClient.invalidateQueries({ queryKey: ['admin-spots'] });
      toast.success(`${spotIds.length} spots deleted successfully`);
      for (const spotId of spotIds) {
        await logAction('spot_deleted', 'spot', spotId, { bulk: true });
      }
    },
    onError: (error) => {
      toast.error(`Failed to delete spots: ${error.message}`);
    },
  });
}

export function useBulkVerifySpots() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async ({ spotIds, verified }: { spotIds: string[]; verified: boolean }) => {
      const { error } = await supabase
        .from('fishing_spots')
        .update({ is_verified: verified })
        .in('id', spotIds);

      if (error) throw error;
      return { spotIds, verified };
    },
    onSuccess: async ({ spotIds, verified }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-spots'] });
      toast.success(`${spotIds.length} spots ${verified ? 'verified' : 'unverified'} successfully`);
      for (const spotId of spotIds) {
        await logAction(verified ? 'spot_verified' : 'spot_unverified', 'spot', spotId, { bulk: true });
      }
    },
    onError: (error) => {
      toast.error(`Failed to update spots: ${error.message}`);
    },
  });
}

export function useBulkTogglePublic() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async ({ spotIds, isPublic }: { spotIds: string[]; isPublic: boolean }) => {
      const { error } = await supabase
        .from('fishing_spots')
        .update({ is_public: isPublic })
        .in('id', spotIds);

      if (error) throw error;
      return { spotIds, isPublic };
    },
    onSuccess: async ({ spotIds, isPublic }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-spots'] });
      toast.success(`${spotIds.length} spots made ${isPublic ? 'public' : 'private'}`);
      for (const spotId of spotIds) {
        await logAction('spot_visibility_changed', 'spot', spotId, { isPublic, bulk: true });
      }
    },
    onError: (error) => {
      toast.error(`Failed to update spots: ${error.message}`);
    },
  });
}

export function useBulkUpdateAreaType() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async ({ spotIds, areaType }: { spotIds: string[]; areaType: string }) => {
      const { error } = await supabase
        .from('fishing_spots')
        .update({ area_type: areaType })
        .in('id', spotIds);

      if (error) throw error;
      return { spotIds, areaType };
    },
    onSuccess: async ({ spotIds, areaType }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-spots'] });
      toast.success(`${spotIds.length} spots updated to ${areaType}`);
      for (const spotId of spotIds) {
        await logAction('spot_area_type_changed', 'spot', spotId, { areaType, bulk: true });
      }
    },
    onError: (error) => {
      toast.error(`Failed to update spots: ${error.message}`);
    },
  });
}
