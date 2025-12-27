import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Json;
  ip_address: string | null;
  created_at: string;
  user?: {
    display_name: string | null;
    email: string | null;
  };
}

export type AuditAction = 
  | 'user_banned'
  | 'user_unbanned'
  | 'role_changed'
  | 'premium_granted'
  | 'premium_revoked'
  | 'setting_updated'
  | 'spot_verified'
  | 'spot_unverified'
  | 'spot_deleted'
  | 'spot_visibility_changed'
  | 'catch_deleted'
  | 'post_deleted'
  | 'trip_deleted'
  | 'species_created'
  | 'species_updated'
  | 'species_deleted'
  | 'report_resolved';

export type EntityType = 
  | 'user'
  | 'setting'
  | 'spot'
  | 'catch'
  | 'post'
  | 'trip'
  | 'species'
  | 'report';

interface CreateAuditLogParams {
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, unknown>;
}

export function useAuditLogs(filters?: { 
  action?: string; 
  entityType?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async (): Promise<AuditLog[]> => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user details for each log
      const userIds = [...new Set((data || []).map(log => log.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map(log => ({
        ...log,
        details: log.details as Json,
        user: profileMap.get(log.user_id) || null,
      })) as AuditLog[];
    },
    staleTime: 30000,
  });
}

export function useCreateAuditLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, entityType, entityId, details }: CreateAuditLogParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: user.id,
          action,
          entity_type: entityType,
          entity_id: entityId || null,
          details: (details || {}) as Json,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

// Helper hook to log actions easily
export function useAuditAction() {
  const { mutateAsync } = useCreateAuditLog();

  const logAction = async (
    action: AuditAction,
    entityType: EntityType,
    entityId?: string,
    details?: Record<string, unknown>
  ) => {
    try {
      await mutateAsync({ action, entityType, entityId, details });
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  };

  return { logAction };
}
