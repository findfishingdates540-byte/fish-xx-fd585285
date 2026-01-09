import { useState } from 'react';
import { Heart, MessageCircle, Play, Video } from 'lucide-react';
import { PostDetailModal } from '@/components/feed/PostDetailModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Post {
  id: string;
  content?: string | null;
  photos?: string[] | null;
  video_url?: string | null;
  likes_count?: number | null;
  comments_count?: number | null;
  catches?: {
    photos?: string[] | null;
  } | null;
}

interface ProfilePostsGridProps {
  posts: Post[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ProfilePostsGrid({ posts, isLoading, emptyMessage = 'No posts yet' }: ProfilePostsGridProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Fetch full post data when a post is selected
  const { data: selectedPost } = useQuery({
    queryKey: ['feed-post-detail', selectedPostId],
    queryFn: async () => {
      if (!selectedPostId) return null;
      
      // Get the post
      const { data: post, error: postError } = await supabase
        .from('feed_posts')
        .select('*')
        .eq('id', selectedPostId)
        .single();
      
      if (postError) throw postError;
      
      // Get the profile
      const { data: profile } = await supabase
        .from('public_profiles')
        .select('id, display_name, photos, id_verified, live_verified')
        .eq('id', post.user_id)
        .single();
      
      // Get catch data if exists
      let catchData = null;
      if (post.catch_id) {
        const { data } = await supabase
          .from('catches')
          .select('id, species_name, weight_lbs, length_in, photos')
          .eq('id', post.catch_id)
          .single();
        catchData = data;
      }
      
      // Check if user has liked this post
      let userHasLiked = false;
      if (user?.id) {
        const { data: likeData } = await supabase
          .from('feed_likes')
          .select('id')
          .eq('post_id', selectedPostId)
          .eq('user_id', user.id)
          .maybeSingle();
        userHasLiked = !!likeData;
      }
      
      return {
        ...post,
        profile: profile || null,
        catch_data: catchData,
        user_has_liked: userHasLiked,
      };
    },
    enabled: !!selectedPostId,
  });
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse" />
        ))}
      </div>
    );
  }
  
  if (!posts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => {
          const thumbnail = post.photos?.[0] || post.catches?.photos?.[0];
          const hasMultiple = (post.photos?.length || 0) > 1 || (post.catches?.photos?.length || 0) > 1;
          const hasVideo = !!post.video_url;
          
          return (
            <button
              key={post.id}
              onClick={() => setSelectedPostId(post.id)}
              className="relative aspect-square group overflow-hidden bg-muted"
            >
              {hasVideo ? (
                <video
                  src={post.video_url!}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              ) : thumbnail ? (
                <img
                  src={thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                  {post.content?.substring(0, 50) || 'Post'}
                </div>
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <div className="flex items-center gap-1 text-white">
                  <Heart className="h-5 w-5 fill-white" />
                  <span className="font-semibold">{post.likes_count || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-white">
                  <MessageCircle className="h-5 w-5 fill-white" />
                  <span className="font-semibold">{post.comments_count || 0}</span>
                </div>
              </div>
              
              {/* Video indicator */}
              {hasVideo && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-black/50 rounded flex items-center justify-center">
                    <Video className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
              
              {/* Multiple images indicator */}
              {hasMultiple && !hasVideo && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-black/50 rounded flex items-center justify-center">
                    <Play className="h-3 w-3 text-white rotate-90 fill-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {selectedPostId && selectedPost && (
        <PostDetailModal
          post={selectedPost}
          isOpen={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </>
  );
}
