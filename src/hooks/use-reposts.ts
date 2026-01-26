import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useRepostStatus(postId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['repost-status', postId, user?.id],
    queryFn: async () => {
      if (!user) return { isReposted: false };
      
      const { data, error } = await supabase
        .from('post_reposts')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();
      
      if (error) throw error;
      return { isReposted: !!data };
    },
    enabled: !!user && !!postId,
  });
}

export function useToggleRepost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, isReposted }: { postId: string; isReposted: boolean }) => {
      if (!user) throw new Error('Must be logged in');
      
      if (isReposted) {
        // Remove repost
        const { error } = await supabase
          .from('post_reposts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add repost
        const { error } = await supabase
          .from('post_reposts')
          .insert({ user_id: user.id, post_id: postId });
        
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['repost-status', postId] });
      queryClient.invalidateQueries({ queryKey: ['reposted-posts'] });
    },
  });
}

export function useRepostedPosts(userId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['reposted-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('post_reposts')
        .select(`
          id,
          created_at,
          feed_posts(
            id,
            content,
            photos,
            video_url,
            location_name,
            likes_count,
            comments_count,
            created_at,
            user_id,
            catches(
              id,
              species_name,
              weight_lbs,
              length_in,
              photos
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Extract posts from reposts
      return (data || [])
        .map(repost => repost.feed_posts)
        .filter(Boolean);
    },
    enabled: !!userId,
  });
}
