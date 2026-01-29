import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, MoreHorizontal, User, Trash2, Flag, Repeat2, Send, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FeedPost as FeedPostType, useLikePost, useDeletePost } from '@/hooks/use-feed';
import { CommentSheet } from './CommentSheet';
import { MentionText } from './MentionText';
import { PostDetailModal } from './PostDetailModal';
import { ReportDialog } from './ReportDialog';
import { ShareSheet } from './ShareSheet';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFollowStatus, useFollowUser, useUnfollowUser } from '@/hooks/use-follow';
import { useBookmarkStatus, useToggleBookmark } from '@/hooks/use-bookmarks';
import { useRepostStatus, useToggleRepost } from '@/hooks/use-reposts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

// Fast image component with eager loading and smooth fade-in
function FeedImage({ 
  src, 
  alt, 
  priority = false,
  onDoubleClick,
  className 
}: { 
  src: string; 
  alt: string; 
  priority?: boolean;
  onDoubleClick?: () => void;
  className?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Check if already cached
    if (imgRef.current?.complete && imgRef.current?.naturalHeight > 0) {
      setIsLoaded(true);
    }
  }, []);

  // Preload priority images immediately
  useEffect(() => {
    if (priority && src) {
      const img = new Image();
      img.src = src;
    }
  }, [priority, src]);

  return (
    <>
      {/* Skeleton placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/50 animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setIsLoaded(true)}
        onDoubleClick={onDoubleClick}
        className={cn(
          "transition-opacity duration-200",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </>
  );
}

interface FeedPostProps {
  post: FeedPostType;
  isHighlighted?: boolean;
  autoOpenComments?: boolean;
}

export function FeedPost({ post, isHighlighted = false, autoOpenComments = false }: FeedPostProps) {
  const [showComments, setShowComments] = useState(autoOpenComments);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const { user } = useAuth();
  const likePost = useLikePost();
  const deletePost = useDeletePost();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const avatarUrl = post.profile?.photos?.[0];
  const displayName = post.profile?.display_name || 'Anonymous';
  const isOwnPost = user?.id === post.user_id;
  
  // Follow functionality
  const { data: followData } = useFollowStatus(post.user_id);
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const isFollowing = followData?.isFollowing ?? false;

  // Bookmark functionality
  const { data: bookmarkData } = useBookmarkStatus(post.id);
  const toggleBookmark = useToggleBookmark();
  const isBookmarked = bookmarkData?.isBookmarked ?? false;

  // Repost functionality
  const { data: repostData } = useRepostStatus(post.id);
  const toggleRepost = useToggleRepost();
  const isReposted = repostData?.isReposted ?? false;
  const [isRepostAnimating, setIsRepostAnimating] = useState(false);

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to follow users');
      return;
    }
    if (isFollowing) {
      unfollowUser.mutate(post.user_id);
    } else {
      followUser.mutate(post.user_id);
    }
  };

  // Combine photos from post and catch
  const allPhotos = [
    ...(post.photos || []),
    ...(post.catch_data?.photos || [])
  ].filter(Boolean);

  const handleLike = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }
    likePost.mutate({ postId: post.id, isLiked: post.user_has_liked });
  };

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success('Post deleted');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      setShowComments(true);
    } else {
      setShowPostModal(true);
    }
  };

  const handleCardClick = () => {
    if (!isMobile) {
      setShowPostModal(true);
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to save posts');
      return;
    }
    toggleBookmark.mutate(
      { postId: post.id, isBookmarked },
      {
        onSuccess: () => {
          toast.success(isBookmarked ? 'Removed from saved' : 'Saved');
        },
      }
    );
  };

  const handleOpenShareSheet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareSheet(true);
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to repost');
      return;
    }
    if (isOwnPost) {
      toast.error("You can't repost your own post");
      return;
    }
    
    // Trigger spin animation
    setIsRepostAnimating(true);
    setTimeout(() => setIsRepostAnimating(false), 500);
    
    toggleRepost.mutate(
      { postId: post.id, isReposted },
      {
        onSuccess: (result) => {
          toast.success(result.action === 'added' ? 'Reposted!' : 'Removed repost');
        },
      }
    );
  };

  const getShareUrl = () => `${window.location.origin}/app/feed/${post.user_id}/${post.id}`;
  
  const getShareText = () => post.content 
    ? `${displayName}: ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}`
    : `Check out this post by ${displayName}`;

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <>
      <div 
        className={cn(
          "bg-card border-b transition-all duration-500",
          isHighlighted && "ring-2 ring-cyan-500 ring-offset-2 ring-offset-background",
          !isMobile && "cursor-pointer hover:bg-muted/30"
        )}
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-3">
          <button 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/app/u/${post.user_id}`);
            }}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-semibold text-sm flex items-center gap-1">
                {displayName}
                <VerificationBadge 
                  idVerified={post.profile?.id_verified} 
                  liveVerified={post.profile?.live_verified} 
                  size="sm" 
                />
              </p>
              <p className="text-xs text-muted-foreground">
                {post.location_name || formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1">
            {/* Follow button - only show for other users' posts */}
            {!isOwnPost && user && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                className="h-7 text-xs font-semibold px-3"
                onClick={handleFollowClick}
                disabled={followUser.isPending || unfollowUser.isPending}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                {isOwnPost && (
                  <>
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete post
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {!isOwnPost && user && (
                  <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Video */}
        {post.video_url && (
          <div className="relative bg-black" onClick={(e) => e.stopPropagation()}>
            <video
              src={post.video_url}
              className="w-full max-h-[600px] object-contain"
              controls
              playsInline
              preload="metadata"
            />
          </div>
        )}

        {/* Photos - edge-to-edge with carousel dots */}
        {!post.video_url && allPhotos.length > 0 && (
          <div className="relative bg-black min-h-[200px]">
            {allPhotos.length === 1 ? (
              <FeedImage
                src={allPhotos[0]}
                alt="Post"
                priority={true}
                onDoubleClick={() => handleLike()}
                className="w-full max-h-[600px] object-contain"
              />
            ) : (
              <Carousel className="w-full">
                <CarouselContent>
                  {allPhotos.map((photo, index) => (
                    <CarouselItem key={index} className="relative min-h-[200px]">
                      <FeedImage
                        src={photo}
                        alt={`Post ${index + 1}`}
                        priority={index === 0}
                        onDoubleClick={() => handleLike()}
                        className="w-full max-h-[600px] object-contain"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {/* Arrow buttons - hidden on mobile/tablet, visible on desktop */}
                <CarouselPrevious className="left-2 hidden md:flex" />
                <CarouselNext className="right-2 hidden md:flex" />
                {/* Dot indicators - centered below image */}
                <CarouselDots className="absolute bottom-2 left-0 right-0" />
              </Carousel>
            )}
          </div>
        )}

        {/* Actions - Instagram style with inline counts */}
        <div className="px-3 pt-3 flex items-center justify-between">
          {/* Left actions group */}
          <div className="flex items-center gap-5">
            {/* Heart with count */}
            <button
              onClick={(e) => handleLike(e)}
              disabled={likePost.isPending}
              className="flex items-center gap-1.5 transition-transform active:scale-90"
            >
              <Heart 
                className={cn(
                  "h-6 w-6 transition-colors",
                  post.user_has_liked 
                    ? "fill-red-500 text-red-500" 
                    : "text-foreground hover:text-muted-foreground"
                )}
                strokeWidth={1.5}
              />
              {post.likes_count > 0 && (
                <span className="text-sm text-foreground">{formatCount(post.likes_count)}</span>
              )}
            </button>
            
            {/* Comment with count */}
            <button
              onClick={handleCommentClick}
              className="flex items-center gap-1.5 text-foreground hover:text-muted-foreground transition-colors"
            >
              <MessageCircle className="h-6 w-6" strokeWidth={1.5} />
              {post.comments_count > 0 && (
                <span className="text-sm">{formatCount(post.comments_count)}</span>
              )}
            </button>
            
            {/* Repost */}
            <button
              onClick={handleRepost}
              disabled={toggleRepost.isPending}
              className="flex items-center gap-1.5 transition-colors active:scale-90"
            >
              <Repeat2 
                className={cn(
                  "h-6 w-6 transition-all duration-500",
                  isReposted 
                    ? "text-green-500" 
                    : "text-foreground hover:text-muted-foreground",
                  isRepostAnimating && "animate-spin"
                )}
                strokeWidth={1.5} 
              />
            </button>
            
            {/* Send */}
            <button
              onClick={handleOpenShareSheet}
              className="flex items-center gap-1.5 text-foreground hover:text-muted-foreground transition-colors active:scale-90"
            >
              <Send className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>
          
          {/* Bookmark on far right */}
          <button
            onClick={handleBookmarkClick}
            disabled={toggleBookmark.isPending}
            className="text-foreground hover:text-muted-foreground transition-colors"
          >
            <Bookmark 
              className={cn(
                "h-6 w-6 transition-colors",
                isBookmarked && "fill-foreground"
              )}
              strokeWidth={1.5}
            />
          </button>
        </div>

        {/* Caption - Instagram style: username + caption inline */}
        {post.content && (
          <div className="px-3 pt-1 pb-1">
            <p className="text-sm">
              <button 
                className="font-semibold mr-1 hover:opacity-70"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/app/u/${post.user_id}`);
                }}
              >
                {displayName}
              </button>
              <MentionText content={post.content} />
            </p>
          </div>
        )}

        {/* Comments count link */}
        {post.comments_count > 0 && (
          <button 
            className="px-3 pb-1 text-sm text-muted-foreground hover:opacity-70"
            onClick={handleCommentClick}
          >
            View all {post.comments_count} comments
          </button>
        )}

        {/* Catch details as tags */}
        {post.catch_data && (
          <div className="px-3 pt-1 pb-2 flex flex-wrap gap-2">
            {post.catch_data.species_name && (
              <Badge variant="outline" className="text-xs">
                {post.catch_data.species_name}
              </Badge>
            )}
            {post.catch_data.weight_lbs && (
              <Badge variant="outline" className="text-xs">
                {post.catch_data.weight_lbs} lbs
              </Badge>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="px-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Mobile: Bottom sheet for comments */}
      <CommentSheet
        postId={post.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        commentsCount={post.comments_count}
      />

      {/* Desktop: Instagram-style modal */}
      <PostDetailModal
        post={post}
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
      />

      <ReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        contentType="post"
        contentId={post.id}
        contentOwnerId={post.user_id}
      />

      <ShareSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        shareUrl={getShareUrl()}
        shareTitle={`Post by ${displayName}`}
        shareText={getShareText()}
      />
    </>
  );
}
