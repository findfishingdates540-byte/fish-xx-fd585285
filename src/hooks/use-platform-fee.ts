import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

const KEY = 'platform_fee_percent';
const DEFAULT_PERCENT = 10;

export function usePlatformFeePercent() {
  return useQuery({
    queryKey: ['app-setting', KEY],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', KEY)
        .maybeSingle();
      if (error) return DEFAULT_PERCENT;
      const pct = (data?.value as { percent?: number } | null)?.percent;
      return typeof pct === 'number' ? pct : DEFAULT_PERCENT;
    },
    staleTime: 60_000,
  });
}

export function useUpdatePlatformFeePercent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (percent: number) => {
      const clamped = Math.min(100, Math.max(0, Math.round(percent)));
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('app_settings')
        .update({
          value: { percent: clamped } as unknown as Json,
          updated_at: new Date().toISOString(),
          updated_by: user?.id ?? null,
        })
        .eq('key', KEY);
      if (error) throw error;
      return clamped;
    },
    onSuccess: (clamped) => {
      qc.invalidateQueries({ queryKey: ['app-setting', KEY] });
      qc.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success(`Platform fee set to ${clamped}%`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}