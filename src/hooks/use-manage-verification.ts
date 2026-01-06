import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditAction } from './use-audit-logs';
import { addYears } from 'date-fns';

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
      const now = new Date();
      const expiryDate = addYears(now, 1).toISOString(); // Verification expires in 1 year
      
      if (idVerified !== undefined) {
        updates.id_verified = idVerified;
        updates.id_verified_at = idVerified ? now.toISOString() : null;
        updates.id_verified_by = idVerified ? user.id : null;
        updates.id_verified_expires_at = idVerified ? expiryDate : null;
      }
      
      if (liveVerified !== undefined) {
        updates.live_verified = liveVerified;
        updates.live_verified_at = liveVerified ? now.toISOString() : null;
        updates.live_verified_by = liveVerified ? user.id : null;
        updates.live_verified_expires_at = liveVerified ? expiryDate : null;
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
      queryClient.invalidateQueries({ queryKey: ['admin-verified-members'] });
      
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
