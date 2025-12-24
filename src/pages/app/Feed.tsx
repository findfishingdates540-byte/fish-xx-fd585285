import { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedPost, CreatePostDialog } from '@/components/feed';
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

      <div className="min-h-screen pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Feed</h1>
            {user && (
              <Button 
                onClick={() => setShowCreatePost(true)}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Post
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
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
      </div>

      <CreatePostDialog
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
      />
    </>
  );
}
