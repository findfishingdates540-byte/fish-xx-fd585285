import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FeedPost {
  id: string;
  user_id: string;
  catch_id: string | null;
  content: string | null;
  photos: string[] | null;
  location_name: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  profile: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
  } | null;
  catch_data: {
    id: string;
    species_name: string | null;
    weight_kg: number | null;
    length_cm: number | null;
    photos: string[] | null;
  } | null;
  user_has_liked: boolean;
}

export interface FeedComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
  } | null;
}

export function useFeedPosts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['feed-posts', user?.id],
    queryFn: async () => {
      // Get posts
      const { data: posts, error } = await supabase
        .from('feed_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      // Get unique user IDs and catch IDs
      const userIds = [...new Set(posts.map(p => p.user_id))];
      const catchIds = posts.map(p => p.catch_id).filter(Boolean) as string[];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photos')
        .in('id', userIds);

      // Fetch catches if any
      let catches: { id: string; species_name: string | null; weight_kg: number | null; length_cm: number | null; photos: string[] | null }[] = [];
      if (catchIds.length > 0) {
        const { data: catchData } = await supabase
          .from('catches')
          .select('id, species_name, weight_kg, length_cm, photos')
          .in('id', catchIds);
        catches = catchData || [];
      }

      // Get user's likes if logged in
      let userLikes: string[] = [];
      if (user?.id) {
        const { data: likes } = await supabase
          .from('feed_likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        userLikes = likes?.map(l => l.post_id) || [];
      }

      // Map profiles and catches to posts
      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      const catchMap = new Map(catches.map(c => [c.id, c]));

      return posts.map(post => ({
        ...post,
        profile: profileMap.get(post.user_id) || null,
        catch_data: post.catch_id ? catchMap.get(post.catch_id) || null : null,
        user_has_liked: userLikes.includes(post.id)
      })) as FeedPost[];
    },
  });
}

export function useFeedComments(postId: string) {
  return useQuery({
    queryKey: ['feed-comments', postId],
    queryFn: async () => {
      // Get comments
      const { data: comments, error } = await supabase
        .from('feed_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!comments || comments.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(comments.map(c => c.user_id))];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photos')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      return comments.map(comment => ({
        ...comment,
        profile: profileMap.get(comment.user_id) || null
      })) as FeedComment[];
    },
    enabled: !!postId,
  });
}

export function useLikePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error('Must be logged in');

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('feed_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('feed_likes')
          .insert({ post_id: postId, user_id: user.id });
        
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, isLiked }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['feed-posts'] });
      
      const previousPosts = queryClient.getQueryData(['feed-posts', user?.id]);
      
      queryClient.setQueryData(['feed-posts', user?.id], (old: FeedPost[] | undefined) => {
        if (!old) return old;
        return old.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
              user_has_liked: !isLiked
            };
          }
          return post;
        });
      });

      return { previousPosts };
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['feed-posts', user?.id], context.previousPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    },
  });
}

export function useAddComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('feed_comments')
        .insert({ post_id: postId, user_id: user.id, content })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['feed-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    },
  });
}

export function useCreatePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      content, 
      photos, 
      catchId, 
      locationName 
    }: { 
      content?: string; 
      photos?: string[]; 
      catchId?: string; 
      locationName?: string;
    }) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('feed_posts')
        .insert({
          user_id: user.id,
          content,
          photos,
          catch_id: catchId,
          location_name: locationName
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('feed_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    },
  });
}
