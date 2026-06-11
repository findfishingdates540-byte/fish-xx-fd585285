import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLikePost } from '@/hooks/use-feed';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { LikeButton } from '@/components/feed/LikeButton';
import { CommentSheet } from '@/components/feed/CommentSheet';
import { ArrowLeft, MessageCircle, Share2, MoreHorizontal, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getShareBaseUrl } from '@/lib/config';
import { thumb } from '@/lib/image-url';

interface PostViewerOverlayProps {
  postId: string;
  userId: string;
  onClose: () => void;
}

interface Post {
  id: string;
  content: string | null;
  photos: string[] | null;
  video_url: string | null;
  location_name: string | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string | null;
  user_id: string;
  catches?: {
    photos: string[] | null;
    species_name: string | null;
    weight_lbs: number | null;
    length_in: number | null;
  } | null;
}

interface PageData {
  posts: Post[];
  direction: 'older' | 'newer';
  cursor: string | undefined;
}

const POSTS_PER_PAGE = 5;

export function PostViewerOverlay({ postId, userId, onClose }: PostViewerOverlayProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [hasScrolledToInitial, setHasScrolledToInitial] = useState(false);
  const [commentSheetPostId, setCommentSheetPostId] = useState<string | null>(null);
  const [commentSheetCommentsCount, setCommentSheetCommentsCount] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const likePost = useLikePost();

  // Fetch the profile for this user (since we're viewing one user's posts)
  const { data: profile } = useQuery({
    queryKey: ['post-viewer-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles_safe')
        .select('id, display_name, photos, id_verified, live_verified')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch the anchor post's created_at first
  const { data: anchorPost } = useQuery({
    queryKey: ['anchor-post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_posts')
        .select('id, created_at')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's liked posts
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchLikedPosts = async () => {
      const { data } = await supabase
        .from('feed_likes')
        .select('post_id')
        .eq('user_id', user.id);
      
      if (data) {
        setLikedPosts(new Set(data.map(l => l.post_id)));
      }
    };
    
    fetchLikedPosts();
  }, [user?.id]);

  // Bi-directional infinite query
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isLoading,
  } = useInfiniteQuery<PageData, Error>({
    queryKey: ['post-viewer', userId, anchorPost?.created_at],
    queryFn: async ({ pageParam }): Promise<PageData> => {
      const { direction, cursor, isInitial } = pageParam as { direction: 'older' | 'newer'; cursor: string | undefined; isInitial?: boolean };
      
      let query = supabase
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
          catches (
            photos,
            species_name,
            weight_lbs,
            length_in
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: direction === 'newer' })
        .limit(POSTS_PER_PAGE);

      if (cursor) {
        if (direction === 'newer') {
          query = query.gt('created_at', cursor);
        } else {
          // Use lte for initial query to include the anchor post, lt for subsequent pages
          if (isInitial) {
            query = query.lte('created_at', cursor);
          } else {
            query = query.lt('created_at', cursor);
          }
        }
      }

      const { data: queryData, error } = await query;
      if (error) throw error;
      
      // For newer posts, reverse to maintain chronological order in display
      const posts = direction === 'newer' ? ([...(queryData || [])].reverse() as unknown as Post[]) : (queryData as unknown as Post[]);
      
      return {
        posts,
        direction,
        cursor,
      };
    },
    initialPageParam: { direction: 'older' as const, cursor: anchorPost?.created_at, isInitial: true } as { direction: 'older' | 'newer'; cursor: string | undefined; isInitial?: boolean },
    getNextPageParam: (lastPage: PageData) => {
      if (!lastPage?.posts || lastPage.posts.length < POSTS_PER_PAGE) return undefined;
      const oldestPost = lastPage.posts[lastPage.posts.length - 1];
      return { direction: 'older' as const, cursor: oldestPost?.created_at, isInitial: false };
    },
    getPreviousPageParam: (firstPage: PageData) => {
      if (firstPage.posts.length === 0) return undefined;
      const newestPost = firstPage.posts[0];
      return { direction: 'newer' as const, cursor: newestPost?.created_at };
    },
    enabled: !!anchorPost?.created_at,
  });

  // Flatten posts from all pages
  const allPosts = data?.pages.flatMap((page: PageData) => page.posts) || [];

  // Scroll to initial post when loaded
  useEffect(() => {
    if (!hasScrolledToInitial && allPosts.length > 0 && postRefs.current.has(postId)) {
      const element = postRefs.current.get(postId);
      if (element) {
        element.scrollIntoView({ behavior: 'instant', block: 'start' });
        setHasScrolledToInitial(true);
      }
    }
  }, [allPosts, postId, hasScrolledToInitial]);

  // Infinite scroll detection
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Load older posts when near bottom
    if (scrollHeight - scrollTop - clientHeight < 500 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
    
    // Load newer posts when near top
    if (scrollTop < 500 && hasPreviousPage && !isFetchingPreviousPage) {
      fetchPreviousPage();
    }
  }, [hasNextPage, hasPreviousPage, isFetchingNextPage, isFetchingPreviousPage, fetchNextPage, fetchPreviousPage]);

  // Swipe to close
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100 && info.velocity.x > 0) {
      onClose();
    }
  };

  const handleShare = async (post: Post) => {
    const url = `${getShareBaseUrl()}/app/u/${post.user_id}/posts/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const getPostPhotos = (post: Post) => {
    return post.photos || post.catches?.photos || [];
  };

  const handlePhotoNav = (postId: string, direction: 'prev' | 'next', totalPhotos: number) => {
    setCurrentPhotoIndex(prev => {
      const current = prev[postId] || 0;
      if (direction === 'prev') {
        return { ...prev, [postId]: Math.max(0, current - 1) };
      }
      return { ...prev, [postId]: Math.min(totalPhotos - 1, current + 1) };
    });
  };

  const handleLike = (post: Post) => {
    const isLiked = likedPosts.has(post.id);
    
    // Optimistic update
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(post.id);
      } else {
        next.add(post.id);
      }
      return next;
    });
    
    likePost.mutate({ postId: post.id, isLiked });
  };

  const openCommentSheet = (post: Post) => {
    setCommentSheetPostId(post.id);
    setCommentSheetCommentsCount(post.comments_count || 0);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.5 }}
        onDragEnd={handleDragEnd}
        className="fixed inset-0 z-50 bg-background"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-2 px-3 py-2 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-sm font-medium flex-1">Posts</h1>
          </div>
        </div>

        {/* Scrollable content */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-[calc(100vh-57px)] overflow-y-auto"
        >
          {isLoading ? (
            <div className="max-w-2xl mx-auto p-4 space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="aspect-square w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {/* Loading indicator for newer posts */}
              {isFetchingPreviousPage && (
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {allPosts.map((post) => {
                const photos = getPostPhotos(post);
                const currentIndex = currentPhotoIndex[post.id] || 0;
                const isLiked = likedPosts.has(post.id);

                return (
                  <div
                    key={post.id}
                    ref={(el) => {
                      if (el) postRefs.current.set(post.id, el);
                    }}
                    className="border-b border-border"
                  >
                    {/* Post Header */}
                    <div className="flex items-center gap-3 p-4">
                      <button
                        onClick={() => navigate(`/app/u/${post.user_id}`)}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.photos?.[0]} />
                          <AvatarFallback>
                            {profile?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm">
                            {profile?.display_name || 'User'}
                          </span>
                          {(profile?.id_verified || profile?.live_verified) && (
                            <VerificationBadge
                              idVerified={profile?.id_verified || false}
                              liveVerified={profile?.live_verified || false}
                              size="sm"
                            />
                          )}
                        </div>
                      </button>
                      <div className="ml-auto">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Post Media */}
                    {photos.length > 0 ? (
                      <div className="relative aspect-square bg-muted">
                        {post.video_url ? (
                          <video
                            src={post.video_url}
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            <img
                              src={thumb(photos[currentIndex])}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                            {photos.length > 1 && (
                              <>
                                {currentIndex > 0 && (
                                  <button
                                    onClick={() => handlePhotoNav(post.id, 'prev', photos.length)}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white"
                                  >
                                    <ChevronLeft className="h-5 w-5" />
                                  </button>
                                )}
                                {currentIndex < photos.length - 1 && (
                                  <button
                                    onClick={() => handlePhotoNav(post.id, 'next', photos.length)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white"
                                  >
                                    <ChevronRight className="h-5 w-5" />
                                  </button>
                                )}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                                  {photos.map((_, i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        i === currentIndex ? "bg-white" : "bg-white/50"
                                      )}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    ) : post.content ? (
                      <div className="px-4 pb-2">
                        <p className="text-lg">{post.content}</p>
                      </div>
                    ) : null}

                    {/* Actions */}
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <LikeButton
                          isLiked={isLiked}
                          likesCount={post.likes_count || 0}
                          onLike={() => handleLike(post)}
                        />
                        <button
                          onClick={() => openCommentSheet(post)}
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MessageCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">{post.comments_count || 0}</span>
                        </button>
                        <button
                          onClick={() => handleShare(post)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Share2 className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Content */}
                      {photos.length > 0 && post.content && (
                        <div className="mt-3">
                          <p className="text-sm">
                            <span className="font-semibold mr-1.5">
                              {profile?.display_name || 'User'}
                            </span>
                            {post.content}
                          </p>
                        </div>
                      )}

                      {/* Location */}
                      {post.location_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                          <MapPin className="h-3 w-3" />
                          {post.location_name}
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className="text-xs text-muted-foreground mt-2">
                        {post.created_at && formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Loading indicator for older posts */}
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* End message */}
              {!hasNextPage && allPosts.length > 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  You've reached the end
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment Sheet */}
        <CommentSheet
          postId={commentSheetPostId || ''}
          isOpen={!!commentSheetPostId}
          onClose={() => setCommentSheetPostId(null)}
          commentsCount={commentSheetCommentsCount}
        />
      </motion.div>
    </AnimatePresence>
  );
}
