import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, MoreHorizontal, User, Trash2, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FeedPost as FeedPostType, useLikePost, useDeletePost } from '@/hooks/use-feed';
import { CommentSheet } from './CommentSheet';
import { MentionText } from './MentionText';
import { PostDetailModal } from './PostDetailModal';
import { ReportDialog } from './ReportDialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { useIsMobile } from '@/hooks/use-mobile';
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

interface FeedPostProps {
  post: FeedPostType;
  isHighlighted?: boolean;
  autoOpenComments?: boolean;
}

export function FeedPost({ post, isHighlighted = false, autoOpenComments = false }: FeedPostProps) {
  const [showComments, setShowComments] = useState(autoOpenComments);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { user } = useAuth();
  const likePost = useLikePost();
  const deletePost = useDeletePost();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const avatarUrl = post.profile?.photos?.[0];
  const displayName = post.profile?.display_name || 'Anonymous';
  const isOwnPost = user?.id === post.user_id;

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
          <div className="relative bg-black">
            {allPhotos.length === 1 ? (
              <img
                src={allPhotos[0]}
                alt="Post"
                className="w-full max-h-[600px] object-contain"
                onDoubleClick={() => handleLike()}
              />
            ) : (
              <Carousel className="w-full">
                <CarouselContent>
                  {allPhotos.map((photo, index) => (
                    <CarouselItem key={index}>
                      <img
                        src={photo}
                        alt={`Post ${index + 1}`}
                        className="w-full max-h-[600px] object-contain"
                        onDoubleClick={() => handleLike()}
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

        {/* Actions - Heart and MessageCircle icons */}
        <div className="px-3 pt-3 flex items-center gap-4">
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
            />
          </button>
          
          <button
            onClick={handleCommentClick}
            className="flex items-center gap-1.5 text-foreground hover:text-muted-foreground transition-colors"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        </div>

        {/* Likes count */}
        {post.likes_count > 0 && (
          <div className="px-3 pt-1">
            <span className="text-sm font-semibold">{post.likes_count} likes</span>
          </div>
        )}

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
    </>
  );
}
