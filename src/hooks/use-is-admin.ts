import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Shares the same query key as AppLayout's admin role check so both layouts
 * read from a single cached value. This prevents the preview "flicker" caused
 * by independent role queries each running their own loading state on remount.
 */
export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ['admin-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator'])
        .maybeSingle();
      if (error) {
        console.error('Error checking admin status:', error);
        return null;
      }
      return data?.role ?? null;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
    retry: 2,
  });

  return {
    isAdmin: !!role,
    isLoading: authLoading || (!!user?.id && isLoading),
  };
}
