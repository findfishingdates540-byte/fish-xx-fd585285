import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useFollowStatus(userId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['follow-status', user?.id, userId],
    queryFn: async () => {
      if (!user?.id || !userId || user.id === userId) return { isFollowing: false, isFollowedBy: false };
      
      // Check if current user follows this user
      const { data: following } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();
      
      // Check if this user follows current user
      const { data: followedBy } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', user.id)
        .maybeSingle();
      
      return { 
        isFollowing: !!following, 
        isFollowedBy: !!followedBy 
      };
    },
    enabled: !!user?.id && !!userId && user.id !== userId,
  });
}

export function useFollowUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!user?.id) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: user.id, following_id: userId });
      
      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', user?.id, userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['social-profile', userId] });
      toast.success('Following!');
    },
    onError: (error) => {
      console.error('Follow error:', error);
      toast.error('Failed to follow user');
    },
  });
}

export function useUnfollowUser() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!user?.id) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', user?.id, userId] });
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['social-profile', userId] });
      toast.success('Unfollowed');
    },
    onError: (error) => {
      console.error('Unfollow error:', error);
      toast.error('Failed to unfollow user');
    },
  });
}

export function useFollowers(userId: string | undefined) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          id,
          created_at,
          follower:profiles!user_follows_follower_id_fkey(
            id,
            display_name,
            photos,
            is_verified,
            id_verified,
            live_verified
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useFollowing(userId: string | undefined) {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          id,
          created_at,
          following:profiles!user_follows_following_id_fkey(
            id,
            display_name,
            photos,
            is_verified,
            id_verified,
            live_verified
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}
