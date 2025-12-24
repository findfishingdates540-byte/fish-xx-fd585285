import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedPost, CreatePostDialog } from '@/components/feed';
import { FeedLeftSidebar } from '@/components/feed/FeedLeftSidebar';
import { FeedRightSidebar } from '@/components/feed/FeedRightSidebar';
import { useFeedPosts } from '@/hooks/use-feed';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';

export default function Feed() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const { user } = useAuth();
  const { data: posts = [], isLoading, refetch } = useFeedPosts();
  const queryClient = useQueryClient();

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

                  {isLoading ? (
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
                  ) : posts.length === 0 ? (
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
                    posts.map((post) => (
                      <FeedPost key={post.id} post={post} />
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
