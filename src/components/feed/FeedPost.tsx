import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, MapPin, Share2, MoreHorizontal, User, Fish, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { FeedPost as FeedPostType, useLikePost, useDeletePost } from '@/hooks/use-feed';
import { LikeButton } from './LikeButton';
import { CommentSheet } from './CommentSheet';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface FeedPostProps {
  post: FeedPostType;
}

export function FeedPost({ post }: FeedPostProps) {
  const [showComments, setShowComments] = useState(false);
  const { user } = useAuth();
  const likePost = useLikePost();
  const deletePost = useDeletePost();

  const avatarUrl = post.profile?.photos?.[0];
  const displayName = post.profile?.display_name || 'Anonymous';
  const isOwnPost = user?.id === post.user_id;

  // Combine photos from post and catch
  const allPhotos = [
    ...(post.photos || []),
    ...(post.catch_data?.photos || [])
  ].filter(Boolean);

  const handleLike = () => {
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

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Check out this catch!',
        text: post.content || 'Amazing fishing catch',
        url: window.location.href
      });
    } catch {
      toast.info('Sharing not supported on this device');
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Photos */}
        {allPhotos.length > 0 && (
          <div className="relative">
            {allPhotos.length === 1 ? (
              <img
                src={allPhotos[0]}
                alt="Post"
                className="w-full aspect-square object-cover"
                onDoubleClick={handleLike}
              />
            ) : (
              <Carousel className="w-full">
                <CarouselContent>
                  {allPhotos.map((photo, index) => (
                    <CarouselItem key={index}>
                      <img
                        src={photo}
                        alt={`Post ${index + 1}`}
                        className="w-full aspect-square object-cover"
                        onDoubleClick={handleLike}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Catch details */}
          {post.catch_data && (
            <div className="flex items-center gap-2 text-sm">
              <Fish className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{post.catch_data.species_name}</span>
              {post.catch_data.weight_kg && (
                <span className="text-muted-foreground">
                  • {post.catch_data.weight_kg} kg
                </span>
              )}
              {post.catch_data.length_cm && (
                <span className="text-muted-foreground">
                  • {post.catch_data.length_cm} cm
                </span>
              )}
            </div>
          )}

          {/* Location */}
          {post.location_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{post.location_name}</span>
            </div>
          )}

          {/* Caption */}
          {post.content && (
            <p className="text-sm">
              <span className="font-semibold mr-2">{displayName}</span>
              {post.content}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <LikeButton
              isLiked={post.user_has_liked}
              likesCount={post.likes_count}
              onLike={handleLike}
              disabled={likePost.isPending}
            />
            
            <button
              onClick={() => setShowComments(true)}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{post.comments_count}</span>
            </button>

            <button
              onClick={handleShare}
              className="text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </Card>

      <CommentSheet
        postId={post.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        commentsCount={post.comments_count}
      />
    </>
  );
}
