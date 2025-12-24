import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, format } from 'date-fns';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalMatches: number;
  totalSpots: number;
  totalCatches: number;
  totalTrips: number;
  totalPosts: number;
  pendingReports: number;
  modeDistribution: {
    dating: number;
    fishing: number;
    both: number;
  };
}

interface DailyStats {
  date: string;
  signups: number;
  activeUsers: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      // Fetch all stats in parallel
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: premiumUsers },
        { count: totalMatches },
        { count: totalSpots },
        { count: totalCatches },
        { count: totalTrips },
        { count: totalPosts },
        { count: pendingReports },
        { data: profiles }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_match', true),
        supabase.from('fishing_spots').select('*', { count: 'exact', head: true }),
        supabase.from('catches').select('*', { count: 'exact', head: true }),
        supabase.from('fishing_trips').select('*', { count: 'exact', head: true }),
        supabase.from('feed_posts').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('account_mode')
      ]);

      // Calculate mode distribution
      const modeDistribution = {
        dating: profiles?.filter(p => p.account_mode === 'dating').length || 0,
        fishing: profiles?.filter(p => p.account_mode === 'fishing').length || 0,
        both: profiles?.filter(p => p.account_mode === 'both').length || 0
      };

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        premiumUsers: premiumUsers || 0,
        totalMatches: totalMatches || 0,
        totalSpots: totalSpots || 0,
        totalCatches: totalCatches || 0,
        totalTrips: totalTrips || 0,
        totalPosts: totalPosts || 0,
        pendingReports: pendingReports || 0,
        modeDistribution
      };
    },
    staleTime: 30000, // 30 seconds
  });
}

export function useEngagementTrends(days: number = 30) {
  return useQuery({
    queryKey: ['engagement-trends', days],
    queryFn: async (): Promise<DailyStats[]> => {
      const startDate = startOfDay(subDays(new Date(), days));
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at, last_active_at')
        .gte('created_at', startDate.toISOString());

      // Group by day
      const dailyData: Record<string, DailyStats> = {};
      
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
        dailyData[date] = { date, signups: 0, activeUsers: 0 };
      }

      profiles?.forEach(profile => {
        const signupDate = format(new Date(profile.created_at), 'yyyy-MM-dd');
        if (dailyData[signupDate]) {
          dailyData[signupDate].signups++;
        }
        
        if (profile.last_active_at) {
          const activeDate = format(new Date(profile.last_active_at), 'yyyy-MM-dd');
          if (dailyData[activeDate]) {
            dailyData[activeDate].activeUsers++;
          }
        }
      });

      return Object.values(dailyData);
    },
    staleTime: 60000, // 1 minute
  });
}

export function useRecentPremiumSubscriptions() {
  return useQuery({
    queryKey: ['recent-premium-subscriptions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, photos, premium_expires_at, updated_at')
        .eq('is_premium', true)
        .order('updated_at', { ascending: false })
        .limit(10);

      return data || [];
    },
    staleTime: 30000,
  });
}

export function useAdminReports() {
  return useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(id, display_name, photos),
          reported_user:profiles!reports_reported_user_id_fkey(id, display_name, photos)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      return data || [];
    },
    staleTime: 30000,
  });
}

export function useAdminUsers(search?: string) {
  return useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (search) {
        query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data } = await query;
      return data || [];
    },
    staleTime: 30000,
  });
}

export function usePopularSpots() {
  return useQuery({
    queryKey: ['popular-spots'],
    queryFn: async () => {
      const { data } = await supabase
        .from('fishing_spots')
        .select('id, name, location_name, rating_avg, rating_count, location_lat, location_lng')
        .order('rating_count', { ascending: false })
        .limit(5);

      return data || [];
    },
    staleTime: 60000,
  });
}
