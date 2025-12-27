import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { useAuditAction } from './use-audit-logs';

interface AppSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

type SettingKey = 
  | 'maintenance_mode' 
  | 'registration_enabled' 
  | 'email_notifications' 
  | 'report_alerts' 
  | 'require_2fa' 
  | 'session_timeout';

export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: async (): Promise<Record<SettingKey, AppSetting>> => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');
      
      if (error) throw error;
      
      // Convert array to keyed object
      const settings: Record<string, AppSetting> = {};
      data?.forEach((setting) => {
        settings[setting.key] = setting as AppSetting;
      });
      
      return settings as Record<SettingKey, AppSetting>;
    },
    staleTime: 30000,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async ({ key, value }: { key: SettingKey; value: Record<string, unknown> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          value: value as Json, 
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null
        })
        .eq('key', key);

      if (error) throw error;
      return { key, value };
    },
    onSuccess: async ({ key, value }) => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      await logAction('setting_updated', 'setting', key, value);
    },
    onError: (error) => {
      toast.error(`Failed to update setting: ${error.message}`);
    },
  });
}

export function useToggleSetting() {
  const queryClient = useQueryClient();
  const { logAction } = useAuditAction();

  return useMutation({
    mutationFn: async ({ key, enabled }: { key: SettingKey; enabled: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // First get current value to preserve other properties
      const { data: current } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .single();

      const newValue = {
        ...(current?.value as Record<string, unknown> || {}),
        enabled,
      };

      const { error } = await supabase
        .from('app_settings')
        .update({ 
          value: newValue as Json, 
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null
        })
        .eq('key', key);

      if (error) throw error;
      return { key, enabled };
    },
    onSuccess: async ({ key, enabled }) => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      const settingNames: Record<SettingKey, string> = {
        maintenance_mode: 'Maintenance mode',
        registration_enabled: 'User registration',
        email_notifications: 'Email notifications',
        report_alerts: 'Report alerts',
        require_2fa: 'Two-factor authentication',
        session_timeout: 'Session timeout',
      };
      toast.success(`${settingNames[key]} ${enabled ? 'enabled' : 'disabled'}`);
      await logAction('setting_updated', 'setting', key, { enabled });
    },
    onError: (error) => {
      toast.error(`Failed to update setting: ${error.message}`);
    },
  });
}

// Hook to check if app is in maintenance mode (for use in app)
export function useMaintenanceMode() {
  return useQuery({
    queryKey: ['maintenance-mode'],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();
      
      if (error) return false;
      return (data?.value as { enabled?: boolean })?.enabled ?? false;
    },
    staleTime: 60000,
  });
}

// Hook to check if registration is enabled (for use in auth)
export function useRegistrationEnabled() {
  return useQuery({
    queryKey: ['registration-enabled'],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'registration_enabled')
        .single();
      
      if (error) return true; // Default to enabled
      return (data?.value as { enabled?: boolean })?.enabled ?? true;
    },
    staleTime: 60000,
  });
}
