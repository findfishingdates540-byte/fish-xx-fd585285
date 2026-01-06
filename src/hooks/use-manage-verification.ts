import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditAction } from './use-audit-logs';

interface UpdateVerificationParams {
  userId: string;
  idVerified?: boolean;
  liveVerified?: boolean;
  notes?: string;
}

export function useManageVerification() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async ({ userId, idVerified, liveVerified, notes }: UpdateVerificationParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates: Record<string, unknown> = {};
      
      if (idVerified !== undefined) {
        updates.id_verified = idVerified;
        updates.id_verified_at = idVerified ? new Date().toISOString() : null;
        updates.id_verified_by = idVerified ? user.id : null;
      }
      
      if (liveVerified !== undefined) {
        updates.live_verified = liveVerified;
        updates.live_verified_at = liveVerified ? new Date().toISOString() : null;
        updates.live_verified_by = liveVerified ? user.id : null;
      }
      
      if (notes !== undefined) {
        updates.verification_notes = notes;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      return { userId, idVerified, liveVerified };
    },
    onSuccess: async ({ userId, idVerified, liveVerified }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      
      const changes = [];
      if (idVerified !== undefined) {
        changes.push(idVerified ? 'ID verification granted' : 'ID verification revoked');
      }
      if (liveVerified !== undefined) {
        changes.push(liveVerified ? 'Live verification granted' : 'Live verification revoked');
      }
      
      toast.success(changes.join(', '));
      
      await logAction(
        idVerified || liveVerified ? 'verification_granted' : 'verification_revoked',
        'user',
        userId,
        { idVerified, liveVerified }
      );
    },
    onError: (error) => {
      toast.error(`Failed to update verification: ${error.message}`);
    },
  });
}
