import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useCallback } from 'react';

const POSTS_PER_PAGE = 20;

export interface FeedPost {
  id: string;
  user_id: string;
  catch_id: string | null;
  content: string | null;
  photos: string[] | null;
  video_url: string | null;
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
    id_verified?: boolean;
    live_verified?: boolean;
  } | null;
  catch_data: {
    id: string;
    species_name: string | null;
    weight_lbs: number | null;
    length_in: number | null;
    photos: string[] | null;
  } | null;
  user_has_liked: boolean;
  // Repost info - if this post is being shown because someone reposted it
  reposted_by?: {
    id: string;
    display_name: string | null;
    reposted_at: string;
  } | null;
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface FeedComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  profile: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
    id_verified?: boolean;
    live_verified?: boolean;
  } | null;
  reactions: CommentReaction[];
  replies?: FeedComment[];
}

export function useFeedPosts() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['feed-posts', user?.id],
    staleTime: 60 * 1000,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * POSTS_PER_PAGE;
      
      // Get regular posts with pagination
      const { data: posts, error } = await supabase
        .from('feed_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);

      if (error) throw error;

      // Get reposts for this page
      const { data: reposts } = await supabase
        .from('post_reposts')
        .select(`
          id,
          created_at,
          user_id,
          post_id,
          feed_posts(*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + Math.floor(POSTS_PER_PAGE / 2) - 1);

      // Collect all posts (original + reposted)
      const allPosts: Array<{
        post: typeof posts[0];
        reposted_by?: { id: string; reposted_at: string };
        sort_date: string;
      }> = [];

      // Add original posts
      (posts || []).forEach(post => {
        allPosts.push({
          post,
          sort_date: post.created_at
        });
      });

      // Add reposted posts (with repost info)
      (reposts || []).forEach(repost => {
        if (repost.feed_posts) {
          allPosts.push({
            post: repost.feed_posts as typeof posts[0],
            reposted_by: {
              id: repost.user_id,
              reposted_at: repost.created_at
            },
            sort_date: repost.created_at
          });
        }
      });

      // Sort by date (newest first)
      allPosts.sort((a, b) => new Date(b.sort_date).getTime() - new Date(a.sort_date).getTime());

      if (allPosts.length === 0) return { posts: [], nextPage: undefined };

      // Get unique user IDs (post authors + reposters)
      const postUserIds = allPosts.map(p => p.post.user_id);
      const reposterIds = allPosts.filter(p => p.reposted_by).map(p => p.reposted_by!.id);
      const userIds = [...new Set([...postUserIds, ...reposterIds])];
      const catchIds = allPosts.map(p => p.post.catch_id).filter(Boolean) as string[];

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, photos, id_verified, live_verified')
        .in('id', userIds);
      
      if (profilesError) console.error('Error fetching profiles:', profilesError);

      // Fetch catches if any
      let catches: { id: string; species_name: string | null; weight_lbs: number | null; length_in: number | null; photos: string[] | null }[] = [];
      if (catchIds.length > 0) {
        const { data: catchData } = await supabase
          .from('catches')
          .select('id, species_name, weight_lbs, length_in, photos')
          .in('id', catchIds);
        catches = catchData || [];
      }

      // Get user's likes if logged in
      let userLikes: string[] = [];
      if (user?.id) {
        const postIds = allPosts.map(p => p.post.id);
        const { data: likes } = await supabase
          .from('feed_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);
        
        userLikes = likes?.map(l => l.post_id) || [];
      }

      // Map profiles and catches
      const profileMap = new Map(
        profiles?.filter(p => p.id !== null).map(p => [p.id, p]) || []
      );
      const catchMap = new Map(catches.map(c => [c.id, c]));

      const mappedPosts = allPosts.map(({ post, reposted_by }) => {
        const reposterProfile = reposted_by ? profileMap.get(reposted_by.id) : null;
        return {
          ...post,
          profile: profileMap.get(post.user_id) || null,
          catch_data: post.catch_id ? catchMap.get(post.catch_id) || null : null,
          user_has_liked: userLikes.includes(post.id),
          reposted_by: reposted_by ? {
            id: reposted_by.id,
            display_name: reposterProfile?.display_name || null,
            reposted_at: reposted_by.reposted_at
          } : null
        };
      }) as FeedPost[];

      return {
        posts: mappedPosts,
        nextPage: posts && posts.length === POSTS_PER_PAGE ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

export function useFollowingFeedPosts() {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['feed-posts-following', user?.id],
    staleTime: 60 * 1000,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return { posts: [], nextPage: undefined };
      
      const offset = pageParam * POSTS_PER_PAGE;
      
      // Get users that the current user follows
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      const followingIds = following?.map(f => f.following_id) || [];
      if (followingIds.length === 0) return { posts: [], nextPage: undefined };
      
      // Get posts from followed users with pagination
      const { data: posts, error } = await supabase
        .from('feed_posts')
        .select('*')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);

      if (error) throw error;

      // Get reposts from followed users
      const { data: reposts } = await supabase
        .from('post_reposts')
        .select(`
          id,
          created_at,
          user_id,
          post_id,
          feed_posts(*)
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + Math.floor(POSTS_PER_PAGE / 2) - 1);

      // Collect all posts (original + reposted)
      const allPosts: Array<{
        post: typeof posts[0];
        reposted_by?: { id: string; reposted_at: string };
        sort_date: string;
      }> = [];

      // Add original posts
      (posts || []).forEach(post => {
        allPosts.push({
          post,
          sort_date: post.created_at
        });
      });

      // Add reposted posts
      (reposts || []).forEach(repost => {
        if (repost.feed_posts) {
          allPosts.push({
            post: repost.feed_posts as typeof posts[0],
            reposted_by: {
              id: repost.user_id,
              reposted_at: repost.created_at
            },
            sort_date: repost.created_at
          });
        }
      });

      // Sort by date (newest first)
      allPosts.sort((a, b) => new Date(b.sort_date).getTime() - new Date(a.sort_date).getTime());

      if (allPosts.length === 0) return { posts: [], nextPage: undefined };

      // Get unique user IDs
      const postUserIds = allPosts.map(p => p.post.user_id);
      const reposterIds = allPosts.filter(p => p.reposted_by).map(p => p.reposted_by!.id);
      const userIds = [...new Set([...postUserIds, ...reposterIds])];
      const catchIds = allPosts.map(p => p.post.catch_id).filter(Boolean) as string[];

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, photos, id_verified, live_verified')
        .in('id', userIds);
      
      if (profilesError) console.error('Error fetching following profiles:', profilesError);

      let catches: any[] = [];
      if (catchIds.length > 0) {
        const { data: catchData } = await supabase
          .from('catches')
          .select('id, species_name, weight_lbs, length_in, photos')
          .in('id', catchIds);
        catches = catchData || [];
      }

      const postIds = allPosts.map(p => p.post.id);
      const { data: likes } = await supabase
        .from('feed_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      const userLikes = likes?.map(l => l.post_id) || [];

      const profileMap = new Map(
        profiles?.filter(p => p.id !== null).map(p => [p.id, p]) || []
      );
      const catchMap = new Map(catches.map(c => [c.id, c]));

      const mappedPosts = allPosts.map(({ post, reposted_by }) => {
        const reposterProfile = reposted_by ? profileMap.get(reposted_by.id) : null;
        return {
          ...post,
          profile: profileMap.get(post.user_id) || null,
          catch_data: post.catch_id ? catchMap.get(post.catch_id) || null : null,
          user_has_liked: userLikes.includes(post.id),
          reposted_by: reposted_by ? {
            id: reposted_by.id,
            display_name: reposterProfile?.display_name || null,
            reposted_at: reposted_by.reposted_at
          } : null
        };
      }) as FeedPost[];

      return {
        posts: mappedPosts,
        nextPage: posts && posts.length === POSTS_PER_PAGE ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user?.id,
  });
}

export function useFeedComments(postId: string) {
  const queryClient = useQueryClient();

  // Set up real-time subscription for comments and reactions
  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feed_comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['feed-comments', postId] });
          queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feed_comment_reactions'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['feed-comments', postId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, queryClient]);

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
      const commentIds = comments.map(c => c.id);

      // Fetch profiles - use profiles table directly to ensure proper id matching
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, photos, id_verified, live_verified')
        .in('id', userIds);
      
      if (profilesError) console.error('Error fetching comment profiles:', profilesError);

      // Fetch reactions for all comments
      const { data: reactions } = await supabase
        .from('feed_comment_reactions')
        .select('*')
        .in('comment_id', commentIds);

      const profileMap = new Map(
        profiles?.filter(p => p.id !== null).map(p => [p.id, p]) || []
      );
      const reactionsMap = new Map<string, CommentReaction[]>();
      
      reactions?.forEach(r => {
        const existing = reactionsMap.get(r.comment_id) || [];
        existing.push(r);
        reactionsMap.set(r.comment_id, existing);
      });

      // Build comment tree (top-level and nested)
      const commentsWithData = comments.map(comment => ({
        ...comment,
        profile: profileMap.get(comment.user_id) || null,
        reactions: reactionsMap.get(comment.id) || [],
        replies: [] as FeedComment[]
      })) as FeedComment[];

      // Organize into tree structure
      const topLevelComments: FeedComment[] = [];
      const commentMap = new Map<string, FeedComment>();
      
      commentsWithData.forEach(c => commentMap.set(c.id, c));
      
      commentsWithData.forEach(comment => {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          const parent = commentMap.get(comment.parent_id)!;
          if (!parent.replies) parent.replies = [];
          parent.replies.push(comment);
        } else if (!comment.parent_id) {
          topLevelComments.push(comment);
        }
      });

      return topLevelComments;
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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['feed-posts'] });
      await queryClient.cancelQueries({ queryKey: ['feed-posts-following'] });
      await queryClient.cancelQueries({ queryKey: ['user-posts'] });
      
      // Snapshot previous values
      const previousFeedPosts = queryClient.getQueryData(['feed-posts', user?.id]);
      const previousFollowingPosts = queryClient.getQueryData(['feed-posts-following', user?.id]);
      
      // Helper to update posts in infinite query structure
      const updateInfiniteData = (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: FeedPost) => {
              if (post.id === postId) {
                return {
                  ...post,
                  likes_count: isLiked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1,
                  user_has_liked: !isLiked
                };
              }
              return post;
            })
          }))
        };
      };
      
      // Optimistic update for both feed queries
      queryClient.setQueryData(['feed-posts', user?.id], updateInfiniteData);
      queryClient.setQueryData(['feed-posts-following', user?.id], updateInfiniteData);

      return { previousFeedPosts, previousFollowingPosts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFeedPosts) {
        queryClient.setQueryData(['feed-posts', user?.id], context.previousFeedPosts);
      }
      if (context?.previousFollowingPosts) {
        queryClient.setQueryData(['feed-posts-following', user?.id], context.previousFollowingPosts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts-following'] });
    },
  });
}

export function useAddComment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('feed_comments')
        .insert({ 
          post_id: postId, 
          user_id: user.id, 
          content,
          parent_id: parentId || null
        })
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

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase
        .from('feed_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return { postId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feed-comments', data.postId] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    },
  });
}

export function useEditComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content, postId }: { commentId: string; content: string; postId: string }) => {
      const { error } = await supabase
        .from('feed_comments')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) throw error;
      return { postId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feed-comments', data.postId] });
    },
  });
}

export function useToggleCommentReaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, emoji, postId }: { commentId: string; emoji: string; postId: string }) => {
      if (!user?.id) throw new Error('Must be logged in');

      // Check if reaction already exists
      const { data: existing } = await supabase
        .from('feed_comment_reactions')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('feed_comment_reactions')
          .delete()
          .eq('id', existing.id);
        
        if (error) throw error;
        return { action: 'removed', postId };
      } else {
        // Add reaction
        const { error } = await supabase
          .from('feed_comment_reactions')
          .insert({ comment_id: commentId, user_id: user.id, emoji });
        
        if (error) throw error;
        return { action: 'added', postId };
      }
    },
    onMutate: async ({ commentId, emoji, postId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['feed-comments', postId] });
      
      // Snapshot the previous value
      const previousComments = queryClient.getQueryData(['feed-comments', postId]);
      
      // Optimistically update the cache
      queryClient.setQueryData(['feed-comments', postId], (old: FeedComment[] | undefined) => {
        if (!old || !user?.id) return old;
        
        const updateCommentReactions = (comments: FeedComment[]): FeedComment[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              const existingReaction = comment.reactions.find(
                r => r.user_id === user.id && r.emoji === emoji
              );
              
              if (existingReaction) {
                // Remove reaction
                return {
                  ...comment,
                  reactions: comment.reactions.filter(r => r.id !== existingReaction.id)
                };
              } else {
                // Add reaction
                return {
                  ...comment,
                  reactions: [
                    ...comment.reactions,
                    {
                      id: `temp-${Date.now()}`,
                      comment_id: commentId,
                      user_id: user.id,
                      emoji,
                      created_at: new Date().toISOString()
                    }
                  ]
                };
              }
            }
            
            // Check nested replies
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentReactions(comment.replies)
              };
            }
            
            return comment;
          });
        };
        
        return updateCommentReactions(old);
      });
      
      return { previousComments };
    },
    onError: (err, { postId }, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(['feed-comments', postId], context.previousComments);
      }
    },
    onSettled: (data) => {
      if (data?.postId) {
        queryClient.invalidateQueries({ queryKey: ['feed-comments', data.postId] });
      }
    },
  });
}

export function useMentionSuggestions() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (searchTerm: string) => {
      if (!user?.id) return [];

      // If no search term, show followers
      if (!searchTerm || searchTerm.length === 0) {
        const { data: followers, error } = await supabase
          .from('user_follows')
          .select(`
            following:profiles!user_follows_following_id_fkey (
              id,
              display_name,
              photos
            )
          `)
          .eq('follower_id', user.id)
          .limit(10);

        if (error) throw error;
        return (followers || [])
          .map(f => f.following)
          .filter((p): p is { id: string; display_name: string | null; photos: string[] | null } => p !== null);
      }

      // Search by name
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, display_name, photos')
        .ilike('display_name', `%${searchTerm}%`)
        .limit(5);

      if (error) throw error;
      return data || [];
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
      videoUrl,
      catchId, 
      locationName 
    }: { 
      content?: string; 
      photos?: string[]; 
      videoUrl?: string;
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
          video_url: videoUrl,
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