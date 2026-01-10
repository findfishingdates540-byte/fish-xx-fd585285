import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FeedPost } from '@/components/feed/FeedPost';
import { FeedPost as FeedPostType } from '@/hooks/use-feed';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserFeed() {
  const { userId, postId } = useParams<{ userId: string; postId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Fetch user profile for header
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-feed-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, display_name, photos')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
  
  // Fetch all user posts with full data for FeedPost component
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['user-feed-posts', userId, user?.id],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get all posts from the user
      const { data: postsData, error: postsError } = await supabase
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
          updated_at,
          user_id,
          catch_id
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (postsError) throw postsError;
      if (!postsData?.length) return [];
      
      // Get profile info
      const { data: profileData } = await supabase
        .from('public_profiles')
        .select('id, display_name, photos, id_verified, live_verified')
        .eq('id', userId)
        .single();
      
      // Get catch data for posts that have catch_id
      const catchIds = postsData.filter(p => p.catch_id).map(p => p.catch_id);
      let catchesMap: Record<string, any> = {};
      
      if (catchIds.length > 0) {
        const { data: catchesData } = await supabase
          .from('catches')
          .select('id, species_name, weight_lbs, length_in, photos')
          .in('id', catchIds);
        
        if (catchesData) {
          catchesMap = catchesData.reduce((acc, c) => {
            acc[c.id] = c;
            return acc;
          }, {} as Record<string, any>);
        }
      }
      
      // Check which posts the current user has liked
      let likedPostIds = new Set<string>();
      if (user?.id) {
        const { data: likesData } = await supabase
          .from('feed_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postsData.map(p => p.id));
        
        if (likesData) {
          likedPostIds = new Set(likesData.map(l => l.post_id));
        }
      }
      
      // Transform to FeedPost format
      return postsData.map((post): FeedPostType => ({
        id: post.id,
        content: post.content,
        photos: post.photos,
        video_url: post.video_url,
        location_name: post.location_name,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        created_at: post.created_at || '',
        updated_at: post.updated_at || post.created_at || '',
        user_id: post.user_id,
        catch_id: post.catch_id,
        profile: profileData || null,
        catch_data: post.catch_id ? catchesMap[post.catch_id] : null,
        user_has_liked: likedPostIds.has(post.id),
      }));
    },
    enabled: !!userId,
  });
  
  // Scroll to specific post when postId is provided
  useEffect(() => {
    if (postId && posts.length > 0 && postRefs.current[postId]) {
      setTimeout(() => {
        postRefs.current[postId]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [postId, posts]);
  
  const isLoading = profileLoading || postsLoading;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3 max-w-xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="max-w-xl mx-auto p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <button 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={() => navigate(`/app/u/${userId}`)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.photos?.[0]} />
              <AvatarFallback>
                {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold">{profile?.display_name || 'Posts'}</span>
          </button>
        </div>
      </div>
      
      {/* Posts Feed */}
      <div className="max-w-xl mx-auto">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p>No posts yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <div 
                key={post.id} 
                ref={(el) => { postRefs.current[post.id] = el; }}
                className="py-2"
              >
                <FeedPost 
                  post={post} 
                  isHighlighted={post.id === postId}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
