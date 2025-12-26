import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface AdminUser {
  id: string;
  display_name: string | null;
  email: string | null;
  photos: string[] | null;
  account_mode: string | null;
  is_premium: boolean | null;
  is_active: boolean | null;
  is_banned: boolean | null;
  created_at: string;
  premium_expires_at: string | null;
  location_name: string | null;
  bio: string | null;
  gender: string | null;
  date_of_birth: string | null;
  onboarding_completed: boolean | null;
  last_active_at: string | null;
}

export function useAdminUsers(search?: string) {
  return useQuery({
    queryKey: ['admin-users', search],
    queryFn: async (): Promise<AdminUser[]> => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (search) {
        query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 30000,
  });
}

export function useUserRole(userId: string) {
  return useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data?.role || 'user';
    },
    enabled: !!userId,
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, banned }: { userId: string; banned: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: banned, is_active: !banned })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { banned }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(banned ? 'User banned successfully' : 'User unbanned successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First check if user already has a role entry
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-role', userId] });
      toast.success('User role updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });
}

export function useManagePremium() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      isPremium, 
      expiresAt 
    }: { 
      userId: string; 
      isPremium: boolean; 
      expiresAt: string | null;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_premium: isPremium, 
          premium_expires_at: expiresAt 
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { isPremium }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(isPremium ? 'Premium status granted' : 'Premium status revoked');
    },
    onError: (error) => {
      toast.error(`Failed to update premium status: ${error.message}`);
    },
  });
}
