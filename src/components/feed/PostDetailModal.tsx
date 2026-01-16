import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, User, CornerDownRight, X, Trash2, MoreHorizontal, Pencil, Check, Heart, Smile } from 'lucide-react';
import { useFeedComments, useAddComment, useToggleCommentReaction, useDeleteComment, useEditComment, useMentionSuggestions, FeedComment, useLikePost, FeedPost as FeedPostType } from '@/hooks/use-feed';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { VerificationBadge } from '@/components/ui/verification-badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { MentionText } from './MentionText';

interface MentionedUser {
  username: string;
  profile?: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
  };
}

interface PostDetailModalProps {
  post: FeedPostType;
  isOpen: boolean;
  onClose: () => void;
}

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

export function PostDetailModal({ post, isOpen, onClose }: PostDetailModalProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionedUsers, setMentionedUsers] = useState<MentionedUser[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: comments = [], isLoading } = useFeedComments(post.id);
  const addComment = useAddComment();
  const mentionSuggestions = useMentionSuggestions();
  const likePost = useLikePost();

  const avatarUrl = post.profile?.photos?.[0];
  const displayName = post.profile?.display_name || 'Anonymous';

  // Combine photos from post and catch
  const allPhotos = [
    ...(post.photos || []),
    ...(post.catch_data?.photos || [])
  ].filter(Boolean);

  // Extract mentions from comment
  const extractedMentions = useMemo(() => {
    const mentionRegex = /@(\w+)/g;
    const matches = newComment.match(mentionRegex) || [];
    return [...new Set(matches.map(m => m.slice(1)))];
  }, [newComment]);

  // Filter out mentioned users that are no longer in content
  useEffect(() => {
    setMentionedUsers(prev => prev.filter(u => extractedMentions.includes(u.username)));
  }, [extractedMentions]);

  const updateMentionedUsers = (displayName: string, profile?: MentionedUser['profile']) => {
    const username = displayName.replace(/\s+/g, '');
    setMentionedUsers(prev => {
      if (prev.some(u => u.username === username)) return prev;
      return [...prev, { username, profile }];
    });
  };

  // Handle @ mention detection
  useEffect(() => {
    const lastAtIndex = newComment.lastIndexOf('@', cursorPosition);
    if (lastAtIndex !== -1) {
      const textAfterAt = newComment.slice(lastAtIndex + 1, cursorPosition);
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        if (textAfterAt.length >= 2) {
          mentionSuggestions.mutate(textAfterAt);
        }
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  }, [newComment, cursorPosition]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewComment(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCursorPosition((e.target as HTMLInputElement).selectionStart || 0);
  };

  const insertMention = (displayName: string, profile?: MentionedUser['profile']) => {
    const lastAtIndex = newComment.lastIndexOf('@', cursorPosition);
    if (lastAtIndex !== -1) {
      const before = newComment.slice(0, lastAtIndex);
      const after = newComment.slice(cursorPosition);
      const mentionText = `@${displayName.replace(/\s+/g, '')} `;
      setNewComment(before + mentionText + after);
      setShowMentions(false);
      updateMentionedUsers(displayName, profile);
      inputRef.current?.focus();
    }
  };

  const removeMention = (username: string) => {
    const regex = new RegExp(`@${username}\\s?`, 'g');
    setNewComment(prev => prev.replace(regex, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      await addComment.mutateAsync({ 
        postId: post.id, 
        content: newComment.trim(),
        parentId: replyingTo?.id
      });
      setNewComment('');
      setReplyingTo(null);
      setMentionedUsers([]);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleReply = (commentId: string, displayName: string) => {
    setReplyingTo({ id: commentId, name: displayName });
    setNewComment(`@${displayName.replace(/\s+/g, '')} `);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  const handleLike = () => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }
    likePost.mutate({ postId: post.id, isLiked: post.user_has_liked });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden h-[85vh] max-h-[700px] min-h-0">
        <div className="grid grid-cols-[1fr_380px] h-full min-h-0 min-w-0">
          {/* Left side - Video or Image(s) */}
          <div className="bg-black relative min-w-0 min-h-0 overflow-hidden flex items-center justify-center">
            {post.video_url ? (
              <video
                src={post.video_url}
                className="w-full h-full object-contain"
                controls
                playsInline
                preload="metadata"
              />
            ) : allPhotos.length === 0 ? (
              <div className="flex items-center justify-center text-muted-foreground p-8 text-center">
                <p className="text-lg font-medium">{post.content}</p>
              </div>
            ) : allPhotos.length === 1 ? (
              <img
                src={allPhotos[0]}
                alt="Post"
                className="w-full h-full object-contain"
                onDoubleClick={handleLike}
              />
            ) : (
              <Carousel className="w-full h-full [&>div]:h-full [&>div>div]:h-full">
                <CarouselContent className="h-full ml-0">
                  {allPhotos.map((photo, index) => (
                    <CarouselItem key={index} className="h-full pl-0 flex items-center justify-center">
                      <img
                        src={photo}
                        alt={`Post ${index + 1}`}
                        className="w-full h-full object-contain"
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

          {/* Right side - Post info & Comments */}
          <div className="grid grid-rows-[auto_1fr_auto_auto] bg-background border-l border-border h-full min-h-0 min-w-0 overflow-hidden">
            <button 
              className="flex-shrink-0 flex items-center gap-3 p-4 border-b border-border hover:bg-muted/50 transition-colors w-full text-left"
              onClick={() => {
                onClose();
                navigate(`/app/u/${post.user_id}`);
              }}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm flex items-center gap-1">
                  {displayName}
                  <VerificationBadge 
                    idVerified={post.profile?.id_verified} 
                    liveVerified={post.profile?.live_verified} 
                    size="sm" 
                  />
                </p>
                <p className="text-xs text-muted-foreground">
                  {post.location_name && post.location_name}
                </p>
              </div>
            </button>

            {/* Caption and Comments */}
            <div className="min-h-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {/* Post caption */}
                  {post.content && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold mr-1">{displayName}</span>
                          <MentionText content={post.content} />
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Catch details */}
                  {post.catch_data && (
                    <div className="flex flex-wrap gap-2">
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

                  {/* Comments */}
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No comments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <ModalCommentItem
                          key={comment.id}
                          comment={comment}
                          postId={post.id}
                          onReply={handleReply}
                          depth={0}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Actions bar */}
            <div className="flex-shrink-0 p-4 border-t border-border">
              <div className="flex items-center gap-4 mb-3">
                <button
                  onClick={handleLike}
                  disabled={likePost.isPending}
                  className="transition-transform active:scale-90"
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
              </div>
              {post.likes_count > 0 && (
                <p className="text-sm font-semibold mb-1">
                  {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
                </p>
              )}
              <p className="text-xs text-muted-foreground uppercase">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Comment input */}
            {user ? (
              <div className="flex-shrink-0 p-4 border-t border-border relative">
                <AnimatePresence>
                  {replyingTo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-muted rounded-lg text-sm"
                    >
                      <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Replying to</span>
                      <span className="font-medium">{replyingTo.name}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 ml-auto"
                        onClick={cancelReply}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mention suggestions dropdown */}
                <AnimatePresence>
                  {showMentions && mentionSuggestions.data && mentionSuggestions.data.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-0 right-0 mb-1 mx-4 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50"
                    >
                      {mentionSuggestions.data.map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => insertMention(profile.display_name || 'User', {
                            id: profile.id,
                            display_name: profile.display_name,
                            photos: profile.photos
                          })}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors text-left"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={profile.photos?.[0]} alt={profile.display_name || 'User'} />
                            <AvatarFallback>
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{profile.display_name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={newComment}
                    onChange={handleInputChange}
                    onKeyUp={handleKeyUp}
                    placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Add a comment..."}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0"
                  />
                  <Button 
                    type="submit" 
                    variant="ghost"
                    size="sm"
                    disabled={!newComment.trim() || addComment.isPending}
                    className="text-primary font-semibold"
                  >
                    Post
                  </Button>
                </form>
              </div>
            ) : (
              <div className="p-4 border-t border-border text-center text-muted-foreground text-sm">
                Sign in to comment
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Modal-specific comment item (simplified version)
interface ModalCommentItemProps {
  comment: FeedComment;
  postId: string;
  onReply: (commentId: string, displayName: string) => void;
  depth: number;
}

function ModalCommentItem({ comment, postId, onReply, depth }: ModalCommentItemProps) {
  const avatarUrl = comment.profile?.photos?.[0];
  const displayName = comment.profile?.display_name || 'Anonymous';
  const { user } = useAuth();
  const toggleReaction = useToggleCommentReaction();
  const deleteComment = useDeleteComment();
  const editComment = useEditComment();
  const isOwnComment = user?.id === comment.user_id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  const reactionCounts = comment.reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const userReactions = new Set(
    comment.reactions.filter(r => r.user_id === user?.id).map(r => r.emoji)
  );

  const handleReaction = (emoji: string) => {
    if (!user) return;
    toggleReaction.mutate({ commentId: comment.id, emoji, postId });
  };

  const handleDelete = async () => {
    try {
      await deleteComment.mutateAsync({ commentId: comment.id, postId });
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleEdit = () => {
    setEditContent(comment.content);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await editComment.mutateAsync({ commentId: comment.id, content: editContent.trim(), postId });
      setIsEditing(false);
      toast.success('Comment updated');
    } catch (error) {
      toast.error('Failed to update comment');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const renderContent = (content: string) => {
    return <MentionText content={content} />;
  };

  const maxDepth = 2;

  return (
    <div className={depth > 0 ? 'ml-6 mt-3' : ''}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm">
            <span className="font-semibold mr-1">{displayName}</span>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  ref={editInputRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 h-7 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveEdit}>
                  <Check className="h-3 w-3 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelEdit}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span>{renderContent(comment.content)}</span>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
            
            {Object.keys(reactionCounts).length > 0 && (
              <span className="font-medium">
                {Object.values(reactionCounts).reduce((a, b) => a + b, 0)} likes
              </span>
            )}
            
            {depth < maxDepth && (
              <button 
                onClick={() => onReply(comment.id, displayName)}
                className="font-medium hover:text-foreground"
              >
                Reply
              </button>
            )}

            {user && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="hover:text-foreground">
                    <Smile className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <div className="flex gap-1">
                    {REACTION_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className={cn(
                          "p-1.5 rounded hover:bg-muted transition-colors text-base",
                          userReactions.has(emoji) && "bg-muted"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {isOwnComment && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hover:text-foreground">
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-background">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Pencil className="h-3 w-3 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Reaction badges */}
          {Object.keys(reactionCounts).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <motion.button
                  key={emoji}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  onClick={() => user && handleReaction(emoji)}
                  className={cn(
                    "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                    userReactions.has(emoji) 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-muted border-border hover:bg-muted/80"
                  )}
                >
                  <span>{emoji}</span>
                  <span className="text-muted-foreground">{count}</span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
        <div className="space-y-3 mt-3">
          {comment.replies.map((reply) => (
            <ModalCommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
