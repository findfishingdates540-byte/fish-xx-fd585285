import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useBookmarkStatus(postId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['bookmark-status', postId, user?.id],
    queryFn: async () => {
      if (!user) return { isBookmarked: false };
      
      const { data, error } = await supabase
        .from('post_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .maybeSingle();
      
      if (error) throw error;
      return { isBookmarked: !!data };
    },
    enabled: !!user && !!postId,
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ postId, isBookmarked }: { postId: string; isBookmarked: boolean }) => {
      if (!user) throw new Error('Must be logged in');
      
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('post_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        
        if (error) throw error;
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('post_bookmarks')
          .insert({ user_id: user.id, post_id: postId });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookmark-status', postId] });
      queryClient.invalidateQueries({ queryKey: ['bookmarked-posts'] });
    },
  });
}

export function useBookmarkedPosts(userId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['bookmarked-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('post_bookmarks')
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
      
      // Extract posts from bookmarks
      return (data || [])
        .map(bookmark => bookmark.feed_posts)
        .filter(Boolean);
    },
    enabled: !!userId && userId === user?.id, // Only show own bookmarks
  });
}
