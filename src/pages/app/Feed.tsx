import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedPost, CreatePostDialog, SponsoredPost } from '@/components/feed';
import { FeedLeftSidebar } from '@/components/feed/FeedLeftSidebar';
import { FeedRightSidebar } from '@/components/feed/FeedRightSidebar';
import { useFeedPosts, type FeedPost as FeedPostType } from '@/hooks/use-feed';
import { useActiveAds, type Advertisement } from '@/hooks/use-admin-ads';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

type FeedItem = 
  | { type: 'post'; data: FeedPostType }
  | { type: 'ad'; data: Advertisement };

export default function Feed() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const { user } = useAuth();
  const { data: posts = [], isLoading: postsLoading, refetch } = useFeedPosts();
  const queryClient = useQueryClient();

  // Fetch user profile for ad targeting
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-for-ads', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('gender, date_of_birth, fishing_experience, interests, location_lat, location_lng')
        .eq('id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch targeted ads based on user profile
  const { data: ads = [] } = useActiveAds(userProfile);

  // Intersperse ads with posts (every 5th position)
  const feedItems = useMemo((): FeedItem[] => {
    if (posts.length === 0) return [];
    
    const items: FeedItem[] = [];
    let adIndex = 0;
    const adInterval = 5; // Show an ad every 5 posts
    
    posts.forEach((post, index) => {
      items.push({ type: 'post', data: post });
      
      // Insert an ad after every 5 posts if we have ads available
      if ((index + 1) % adInterval === 0 && adIndex < ads.length) {
        items.push({ type: 'ad', data: ads[adIndex] });
        adIndex++;
      }
    });
    
    return items;
  }, [posts, ads]);

  // Real-time subscription for new posts
  useEffect(() => {
    const channel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feed_posts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feed_likes' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feed_comments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <>
      <div className="min-h-screen bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <FeedLeftSidebar />
            </aside>

            {/* Main Feed */}
            <main className="lg:col-span-6">
              <PullToRefresh onRefresh={handleRefresh}>
                <div className="space-y-4">
                  {/* Create post button - mobile */}
                  {user && (
                    <div className="lg:hidden">
                      <Button 
                        onClick={() => setShowCreatePost(true)}
                        className="w-full gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create Post
                      </Button>
                    </div>
                  )}

                  {postsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-background rounded-xl border animate-pulse">
                          <div className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted" />
                            <div className="space-y-2">
                              <div className="h-4 w-32 bg-muted rounded" />
                              <div className="h-3 w-24 bg-muted rounded" />
                            </div>
                          </div>
                          <div className="h-64 bg-muted" />
                          <div className="p-4">
                            <div className="h-4 w-full bg-muted rounded mb-2" />
                            <div className="h-4 w-2/3 bg-muted rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : feedItems.length === 0 ? (
                    <div className="text-center py-16 bg-background rounded-xl border">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">No posts yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Be the first to share your fishing adventure!
                      </p>
                      {user && (
                        <Button onClick={() => setShowCreatePost(true)}>
                          Create Post
                        </Button>
                      )}
                    </div>
                  ) : (
                    feedItems.map((item, index) => (
                      item.type === 'post' ? (
                        <FeedPost key={`post-${item.data.id}`} post={item.data} />
                      ) : (
                        <SponsoredPost key={`ad-${item.data.id}-${index}`} ad={item.data} />
                      )
                    ))
                  )}
                </div>
              </PullToRefresh>
            </main>

            {/* Right Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <FeedRightSidebar />
            </aside>
          </div>
        </div>
      </div>

      <CreatePostDialog
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
      />
    </>
  );
}
