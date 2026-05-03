import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserPosts(userId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('feed_posts')
        .select(`
          id,
          content,
          photos,
          video_url,
          location_name,
          likes_count,
          comments_count,
          created_at,
          catch_id,
          catches(
            id,
            species_name,
            weight_lbs,
            length_in,
            photos
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

export function useMentionedPosts(userId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['mentioned-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get user's display name to search for mentions
      const { data: profile } = await supabase
        .from('profiles_safe')
        .select('display_name')
        .eq('id', userId)
        .single();
      
      if (!profile?.display_name) return [];
      
      // Create mention pattern (handle spaces in names)
      const mentionPattern = `@${profile.display_name.replace(/\s+/g, '')}`;
      
      // Find posts where user is mentioned in content
      const { data: postsWithMentions, error: postsError } = await supabase
        .from('feed_posts')
        .select(`
          id,
          content,
          photos,
          video_url,
          location_name,
          likes_count,
          comments_count,
          created_at,
          user_id,
          profiles:user_id(
            id,
            display_name,
            photos
          )
        `)
        .ilike('content', `%${mentionPattern}%`)
        .order('created_at', { ascending: false });
      
      if (postsError) throw postsError;
      
      // Also find posts where user is mentioned in comments
      const { data: commentsWithMentions, error: commentsError } = await supabase
        .from('feed_comments')
        .select(`
          id,
          post_id,
          content,
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
            profiles:user_id(
              id,
              display_name,
              photos
            )
          )
        `)
        .ilike('content', `%${mentionPattern}%`)
        .order('created_at', { ascending: false });
      
      if (commentsError) throw commentsError;
      
      // Combine and deduplicate
      const allPosts = [...(postsWithMentions || [])];
      const postIds = new Set(allPosts.map(p => p.id));
      
      commentsWithMentions?.forEach(comment => {
        if (comment.feed_posts && !postIds.has(comment.feed_posts.id)) {
          allPosts.push(comment.feed_posts as any);
          postIds.add(comment.feed_posts.id);
        }
      });
      
      return allPosts;
    },
    enabled: !!userId,
  });
}

export function useUserPostsCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-posts-count', userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      const { count, error } = await supabase
        .from('feed_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
}
