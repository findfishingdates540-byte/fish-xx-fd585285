import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditAction } from './use-audit-logs';

export interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  photos: string[];
  ad_type: string;
  sponsor_name: string;
  sponsor_logo: string | null;
  website_url: string | null;
  cta_text: string;
  cta_url: string | null;
  fishing_spot_id: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  impressions: number;
  clicks: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Targeting fields
  target_genders: string[] | null;
  target_age_min: number | null;
  target_age_max: number | null;
  target_experience_levels: string[] | null;
  target_interests: string[] | null;
  target_location_radius_miles: number | null;
  target_location_lat: number | null;
  target_location_lng: number | null;
  fishing_spots?: {
    id: string;
    name: string;
  } | null;
}

export type AdType = 'fishing_spot' | 'bait_shop' | 'gear_store' | 'charter' | 'tournament' | 'general';

export const adTypeLabels: Record<AdType, string> = {
  fishing_spot: 'Fishing Spot',
  bait_shop: 'Bait & Tackle Shop',
  gear_store: 'Gear Store',
  charter: 'Charter Service',
  tournament: 'Tournament',
  general: 'General',
};

export function useAdminAds(search?: string, typeFilter?: string, statusFilter?: string) {
  return useQuery({
    queryKey: ['admin-ads', search, typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('advertisements')
        .select('*, fishing_spots(id, name)')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,sponsor_name.ilike.%${search}%`);
      }

      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('ad_type', typeFilter);
      }

      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Advertisement[];
    },
  });
}

interface CreateAdData {
  title: string;
  description: string | null;
  photos: string[];
  ad_type: string;
  sponsor_name: string;
  sponsor_logo: string | null;
  website_url: string | null;
  cta_text: string;
  cta_url: string | null;
  fishing_spot_id: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
}

export function useCreateAd() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async (ad: CreateAdData) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('advertisements')
        .insert({ ...ad, created_by: user.user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      logAction('create', 'advertisement', data.id, { title: data.title, type: data.ad_type });
      toast.success('Advertisement created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create advertisement: ' + error.message);
    },
  });
}

export function useUpdateAd() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Advertisement> & { id: string }) => {
      const { data, error } = await supabase
        .from('advertisements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      logAction('update', 'advertisement', data.id, { title: data.title });
      toast.success('Advertisement updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update advertisement: ' + error.message);
    },
  });
}

export function useDeleteAd() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      logAction('delete', 'advertisement', id);
      toast.success('Advertisement deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete advertisement: ' + error.message);
    },
  });
}

export function useToggleAdActive() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('advertisements')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      logAction('update', 'advertisement', data.id, { 
        action: data.is_active ? 'activated' : 'deactivated',
        title: data.title 
      });
      toast.success(`Advertisement ${data.is_active ? 'activated' : 'deactivated'}`);
    },
    onError: (error) => {
      toast.error('Failed to update advertisement: ' + error.message);
    },
  });
}

export function useTrackAdClick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: ad } = await supabase
        .from('advertisements')
        .select('clicks')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('advertisements')
        .update({ clicks: (ad?.clicks || 0) + 1 })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
    },
  });
}

export function useActiveAds(userProfile?: {
  gender?: string | null;
  date_of_birth?: string | null;
  fishing_experience?: string | null;
  interests?: string[] | null;
  location_lat?: number | null;
  location_lng?: number | null;
} | null) {
  return useQuery({
    queryKey: ['active-ads', userProfile?.gender, userProfile?.date_of_birth, userProfile?.fishing_experience],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('advertisements')
        .select('*, fishing_spots(id, name, photos)')
        .eq('is_active', true)
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter ads based on user targeting
      let filteredAds = (data as Advertisement[]) || [];
      
      if (userProfile) {
        filteredAds = filteredAds.filter(ad => {
          // Gender targeting
          if (ad.target_genders && ad.target_genders.length > 0) {
            if (!userProfile.gender || !ad.target_genders.includes(userProfile.gender)) {
              return false;
            }
          }
          
          // Age targeting
          if (ad.target_age_min || ad.target_age_max) {
            if (!userProfile.date_of_birth) return false;
            const birthDate = new Date(userProfile.date_of_birth);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            
            if (ad.target_age_min && age < ad.target_age_min) return false;
            if (ad.target_age_max && age > ad.target_age_max) return false;
          }
          
          // Experience level targeting
          if (ad.target_experience_levels && ad.target_experience_levels.length > 0) {
            if (!userProfile.fishing_experience || 
                !ad.target_experience_levels.includes(userProfile.fishing_experience)) {
              return false;
            }
          }
          
          // Interest targeting
          if (ad.target_interests && ad.target_interests.length > 0) {
            if (!userProfile.interests || userProfile.interests.length === 0) return false;
            const hasMatchingInterest = ad.target_interests.some(
              interest => userProfile.interests?.includes(interest)
            );
            if (!hasMatchingInterest) return false;
          }
          
          // Location targeting
          if (ad.target_location_radius_miles && 
              ad.target_location_lat && 
              ad.target_location_lng) {
            if (!userProfile.location_lat || !userProfile.location_lng) return false;
            
            // Calculate distance using Haversine formula
            const R = 3959; // Earth's radius in miles
            const dLat = (userProfile.location_lat - ad.target_location_lat) * Math.PI / 180;
            const dLng = (userProfile.location_lng - ad.target_location_lng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(ad.target_location_lat * Math.PI / 180) * 
                      Math.cos(userProfile.location_lat * Math.PI / 180) *
                      Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            
            if (distance > ad.target_location_radius_miles) return false;
          }
          
          return true;
        });
      }
      
      return filteredAds;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
