import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  location_name: string | null;
  fishing_experience: string | null;
  preferred_species: string[] | null;
  bio: string | null;
  id_verified?: boolean;
  live_verified?: boolean;
}

interface BuddyRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  created_at: string;
  profile: Profile;
}

interface MyBuddy extends Profile {
  buddyId: string;
}

interface BuddyPageData {
  discover_profiles: Profile[];
  received_requests: BuddyRequest[];
  sent_requests: BuddyRequest[];
  my_buddies: MyBuddy[];
  catch_counts: Record<string, number>;
  requested_ids: string[];
}

export function useBuddyData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['buddy-page-data', user?.id],
    queryFn: async (): Promise<BuddyPageData> => {
      if (!user?.id) {
        return {
          discover_profiles: [],
          received_requests: [],
          sent_requests: [],
          my_buddies: [],
          catch_counts: {},
          requested_ids: [],
        };
      }

      const { data, error } = await supabase.rpc('get_buddy_page_data', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching buddy data:', error);
        throw error;
      }

      // Parse the JSONB response
      const result = data as unknown as BuddyPageData;
      
      return {
        discover_profiles: result.discover_profiles || [],
        received_requests: result.received_requests || [],
        sent_requests: result.sent_requests || [],
        my_buddies: result.my_buddies || [],
        catch_counts: result.catch_counts || {},
        requested_ids: result.requested_ids || [],
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // Data fresh for 30 seconds
  });
}
