import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadTicketCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-ticket-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Count tickets that have new admin responses (status = awaiting_response means admin replied)
      const { count, error } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'awaiting_response');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
