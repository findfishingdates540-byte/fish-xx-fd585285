import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedPost, CreatePostDialog, SponsoredPost, FeedComposerBar, StoriesRow } from '@/components/feed';
import { FeedLeftSidebar } from '@/components/feed/FeedLeftSidebar';
import { FeedRightSidebar } from '@/components/feed/FeedRightSidebar';
import { useFeedPosts, useFollowingFeedPosts, type FeedPost as FeedPostType } from '@/hooks/use-feed';
import { useActiveAds, type Advertisement } from '@/hooks/use-admin-ads';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Fish, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FeedItem = 
  | { type: 'post'; data: FeedPostType }
  | { type: 'ad'; data: Advertisement };

type FeedFilter = 'for-you' | 'following';

export default function Feed() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('for-you');
  const [searchParams] = useSearchParams();
  const highlightedPostId = searchParams.get('post');
  const highlightedCommentId = searchParams.get('comment');
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const { 
    data: forYouData, 
    isLoading: forYouLoading, 
    refetch: refetchForYou,
    fetchNextPage: fetchNextForYou,
    hasNextPage: hasNextForYou,
    isFetchingNextPage: isFetchingNextForYou
  } = useFeedPosts();
  
  const { 
    data: followingData, 
    isLoading: followingLoading, 
    refetch: refetchFollowing,
    fetchNextPage: fetchNextFollowing,
    hasNextPage: hasNextFollowing,
    isFetchingNextPage: isFetchingNextFollowing
  } = useFollowingFeedPosts();
  
  const queryClient = useQueryClient();
  
  // Flatten infinite query pages into posts array
  const forYouPosts = useMemo(() => 
    forYouData?.pages.flatMap(page => page.posts) ?? [], 
    [forYouData]
  );
  const followingPosts = useMemo(() => 
    followingData?.pages.flatMap(page => page.posts) ?? [], 
    [followingData]
  );
  
  const posts = feedFilter === 'for-you' ? forYouPosts : followingPosts;
  const postsLoading = feedFilter === 'for-you' ? forYouLoading : followingLoading;
  const hasNextPage = feedFilter === 'for-you' ? hasNextForYou : hasNextFollowing;
  const isFetchingNextPage = feedFilter === 'for-you' ? isFetchingNextForYou : isFetchingNextFollowing;
  const fetchNextPage = feedFilter === 'for-you' ? fetchNextForYou : fetchNextFollowing;
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

  // Debounced real-time subscription for new posts (prevents rapid refetches)
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    
    const debouncedInvalidate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['feed-posts', user?.id], exact: true });
        queryClient.invalidateQueries({ queryKey: ['feed-posts-following', user?.id], exact: true });
      }, 2000); // 2 second debounce
    };

    const channel = supabase
      .channel('feed-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_posts' },
        debouncedInvalidate
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'feed_posts' },
        debouncedInvalidate
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Scroll to highlighted post when coming from a mention notification
  useEffect(() => {
    if (highlightedPostId && !postsLoading) {
      // Small delay to ensure posts are rendered
      const timer = setTimeout(() => {
        const postElement = postRefs.current.get(highlightedPostId);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightedPostId, postsLoading, posts]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = async () => {
    queryClient.invalidateQueries({ queryKey: ['stories'] });
    if (feedFilter === 'for-you') {
      await refetchForYou();
    } else {
      await refetchFollowing();
    }
  };

  return (
    <>
      <div className="min-h-screen bg-muted/30">
        <div className="max-w-7xl mx-auto px-0 md:px-4 py-4 md:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 md:gap-6">
            {/* Left Sidebar */}
            <aside className="hidden lg:block lg:col-span-3">
              <FeedLeftSidebar />
            </aside>

            {/* Main Feed */}
            <main className="lg:col-span-6">
              <PullToRefresh onRefresh={handleRefresh}>
                <div className="space-y-4">
                  {/* Composer Bar */}
                  {user && (
                    <FeedComposerBar onOpenCreatePost={() => setShowCreatePost(true)} />
                  )}

                  {/* Stories Row */}
                  {user && <StoriesRow />}

                  {/* Feed Tabs */}
                  {user && (
                    <Tabs value={feedFilter} onValueChange={(v) => setFeedFilter(v as FeedFilter)} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="for-you">For You</TabsTrigger>
                        <TabsTrigger value="following">Following</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}

                  {postsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-card rounded-xl border animate-pulse">
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
                    <div className="text-center py-16 bg-card rounded-xl border">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Fish className="h-8 w-8 text-muted-foreground" />
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
                    <>
                      {feedItems.map((item, index) => (
                        item.type === 'post' ? (
                          <div 
                            key={`post-${item.data.id}`}
                            ref={(el) => {
                              if (el) postRefs.current.set(item.data.id, el);
                            }}
                          >
                            <FeedPost 
                              post={item.data} 
                              isHighlighted={highlightedPostId === item.data.id}
                              autoOpenComments={highlightedPostId === item.data.id && !!highlightedCommentId}
                            />
                          </div>
                        ) : (
                          <SponsoredPost key={`ad-${item.data.id}-${index}`} ad={item.data} />
                        )
                      ))}
                      
                      {/* Infinite scroll trigger */}
                      <div ref={loadMoreRef} className="py-4 flex justify-center">
                        {isFetchingNextPage && (
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        )}
                        {!hasNextPage && posts.length > 0 && (
                          <p className="text-sm text-muted-foreground">You're all caught up!</p>
                        )}
                      </div>
                    </>
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
