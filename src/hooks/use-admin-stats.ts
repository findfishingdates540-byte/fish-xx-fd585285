import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfDay, format } from 'date-fns';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsers30d: number;
  premiumUsers: number;
  totalMatches: number;
  totalSpots: number;
  totalCatches: number;
  totalTrips: number;
  totalPosts: number;
  pendingReports: number;
  modeDistribution: { dating: number; fishing: number; both: number };
}

interface DailyStats {
  date: string;
  signups: number;
  activeUsers: number;
}

const head = { count: 'exact' as const, head: true };

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const since30 = subDays(new Date(), 30).toISOString();
      const r = await Promise.all([
        supabase.from('profiles').select('id', head),
        supabase.from('profiles').select('id', head).gte('last_active_at', since30),
        supabase.from('profiles').select('id', head).gte('created_at', since30),
        supabase.from('profiles').select('id', head).eq('is_premium', true),
        supabase.from('matches').select('id', head).eq('is_match', true),
        supabase.from('fishing_spots').select('id', head),
        supabase.from('catches').select('id', head),
        supabase.from('fishing_trips').select('id', head),
        supabase.from('feed_posts').select('id', head),
        supabase.from('reports').select('id', head).eq('status', 'pending'),
        supabase.from('profiles').select('id', head).eq('account_mode', 'dating'),
        supabase.from('profiles').select('id', head).eq('account_mode', 'fishing'),
        supabase.from('profiles').select('id', head).eq('account_mode', 'both'),
      ]);
      const c = (i: number) => r[i].count || 0;
      return {
        totalUsers: c(0),
        activeUsers: c(1),
        newUsers30d: c(2),
        premiumUsers: c(3),
        totalMatches: c(4),
        totalSpots: c(5),
        totalCatches: c(6),
        totalTrips: c(7),
        totalPosts: c(8),
        pendingReports: c(9),
        modeDistribution: { dating: c(10), fishing: c(11), both: c(12) },
      };
    },
    staleTime: 30000,
  });
}

async function fetchAllDates(column: 'created_at' | 'last_active_at', since: string) {
  const out: string[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from('profiles')
      .select(column)
      .gte(column, since)
      .range(from, from + page - 1);
    if (error || !data) break;
    data.forEach((row: any) => row[column] && out.push(row[column]));
    if (data.length < page) break;
  }
  return out;
}

export function useEngagementTrends(days: number = 30) {
  return useQuery({
    queryKey: ['engagement-trends', days],
    queryFn: async (): Promise<DailyStats[]> => {
      const since = startOfDay(subDays(new Date(), days - 1)).toISOString();
      const [signups, actives] = await Promise.all([
        fetchAllDates('created_at', since),
        fetchAllDates('last_active_at', since),
      ]);
      const daily: Record<string, DailyStats> = {};
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
        daily[date] = { date, signups: 0, activeUsers: 0 };
      }
      signups.forEach(d => { const k = format(new Date(d), 'yyyy-MM-dd'); if (daily[k]) daily[k].signups++; });
      actives.forEach(d => { const k = format(new Date(d), 'yyyy-MM-dd'); if (daily[k]) daily[k].activeUsers++; });
      return Object.values(daily);
    },
    staleTime: 60000,
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
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
      if (search) query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
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
        .gt('rating_count', 0)
        .order('rating_count', { ascending: false })
        .order('rating_avg', { ascending: false })
        .limit(5);
      return data || [];
    },
    staleTime: 60000,
  });
}
