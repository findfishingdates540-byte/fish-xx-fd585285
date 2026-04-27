import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Returns whether the current user has an active premium subscription.
 * Used to gate ad rendering — non-premium users see ads, premium users don't.
 */
export function useIsPremium() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user-premium-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return { is_premium: false, premium_expires_at: null as string | null };
      const { data, error } = await supabase
        .from('profiles')
        .select('is_premium, premium_expires_at')
        .eq('id', user.id)
        .single();
      if (error) return { is_premium: false, premium_expires_at: null as string | null };
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const isPremium = (() => {
    if (!data?.is_premium) return false;
    if (!data.premium_expires_at) return true;
    return new Date(data.premium_expires_at).getTime() > Date.now();
  })();

  return { isPremium, isLoading };
}