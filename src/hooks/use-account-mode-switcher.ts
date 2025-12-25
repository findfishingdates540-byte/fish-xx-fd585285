import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type AccountMode = Database['public']['Enums']['account_mode'];

const modeLabels: Record<AccountMode, string> = {
  both: 'Combo Mode',
  dating: 'Dating Mode',
  fishing: 'Fishing Mode',
};

export function useAccountModeSwitcher(onSuccess?: (mode: AccountMode) => void) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newMode: AccountMode) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ account_mode: newMode })
        .eq('id', user.id);

      if (error) throw error;
      return newMode;
    },
    onSuccess: (newMode) => {
      // Invalidate profile queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      
      toast({
        title: 'Mode Switched',
        description: `You're now in ${modeLabels[newMode]}`,
      });

      onSuccess?.(newMode);
    },
    onError: (error) => {
      console.error('Failed to switch mode:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch mode. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    switchMode: mutation.mutate,
    isSwitching: mutation.isPending,
  };
}
