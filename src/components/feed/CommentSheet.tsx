import { useState, useRef, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, User, CornerDownRight, Smile, X, Trash2, MoreHorizontal, Pencil, Check } from 'lucide-react';
import { useFeedComments, useAddComment, useToggleCommentReaction, useDeleteComment, useEditComment, useMentionSuggestions, FeedComment } from '@/hooks/use-feed';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { MentionText } from './MentionText';

interface MentionedUser {
  username: string;
  profile?: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
  };
}

interface CommentSheetProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  commentsCount: number;
}

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

export function CommentSheet({ postId, isOpen, onClose, commentsCount }: CommentSheetProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionedUsers, setMentionedUsers] = useState<MentionedUser[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useFeedComments(postId);
  const addComment = useAddComment();
  const mentionSuggestions = useMentionSuggestions();

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
      // Check if there's no space after @ and we're still typing the mention
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
        postId, 
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
    // Pre-fill with @mention
    setNewComment(`@${displayName.replace(/\s+/g, '')} `);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle>Comments ({commentsCount})</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100%-120px)] py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem 
                  key={comment.id} 
                  comment={comment} 
                  postId={postId}
                  onReply={handleReply}
                  depth={0}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {user ? (
          <div className="pt-4 border-t border-border relative">
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
                  className="absolute bottom-full left-0 right-0 mb-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50"
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

            {/* Mention preview chips */}
            <AnimatePresence>
              {mentionedUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-1.5 mb-2"
                >
                  {mentionedUsers.map(({ username, profile }) => (
                    <Badge
                      key={username}
                      variant="secondary"
                      className="flex items-center gap-1 pr-0.5 cursor-pointer hover:bg-secondary/80 text-xs"
                      onClick={() => removeMention(username)}
                    >
                      <Avatar className="h-3.5 w-3.5">
                        <AvatarImage src={profile?.photos?.[0]} alt={username} />
                        <AvatarFallback className="text-[6px]">
                          <User className="h-2 w-2" />
                        </AvatarFallback>
                      </Avatar>
                      <span>@{username}</span>
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </Badge>
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
                placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Add a comment... Use @ to mention"}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!newComment.trim() || addComment.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : (
          <div className="pt-4 border-t border-border text-center text-muted-foreground">
            Sign in to comment
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface CommentItemProps {
  comment: FeedComment;
  postId: string;
  onReply: (commentId: string, displayName: string) => void;
  depth: number;
}

function CommentItem({ comment, postId, onReply, depth }: CommentItemProps) {
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

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  // Group reactions by emoji with count
  const reactionCounts = comment.reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Check which emojis the current user has reacted with
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

  // Render @mentions as clickable links
  const renderContent = (content: string) => {
    return <MentionText content={content} />;
  };

  const maxDepth = 2; // Limit nesting depth

  return (
    <div className={depth > 0 ? 'ml-8 mt-3' : ''}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-medium text-sm flex items-center gap-1">
                {displayName}
                <VerificationBadge 
                  idVerified={comment.profile?.id_verified} 
                  liveVerified={comment.profile?.live_verified} 
                  size="sm" 
                />
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            
            {/* More options menu for own comments */}
            {isOwnComment && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit comment
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                    disabled={deleteComment.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete comment
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {/* Edit mode or display content */}
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <Input
                ref={editInputRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1 h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7"
                onClick={handleSaveEdit}
                disabled={editComment.isPending}
              >
                <Check className="h-4 w-4 text-primary" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm mt-0.5 break-words">{renderContent(comment.content)}</p>
          )}
          
          {/* Reactions and Reply button */}
          <div className="flex items-center gap-2 mt-2">
            {/* Existing reactions */}
            <div className="flex items-center gap-1 flex-wrap">
              <AnimatePresence mode="popLayout">
                {Object.entries(reactionCounts).map(([emoji, count]) => (
                  <motion.button
                    key={emoji}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    whileTap={{ scale: 0.9 }}
                    layout
                    onClick={() => handleReaction(emoji)}
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
                      userReactions.has(emoji) 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{count}</span>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>

            {/* Add reaction button */}
            {user && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground hover:text-foreground">
                    <Smile className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <div className="flex gap-1">
                    {REACTION_EMOJIS.map(emoji => (
                      <motion.button
                        key={emoji}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleReaction(emoji)}
                        className={`p-1.5 rounded-full hover:bg-muted text-lg ${
                          userReactions.has(emoji) ? 'bg-primary/20' : ''
                        }`}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Reply button - only show if not at max depth */}
            {user && depth < maxDepth && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onReply(comment.id, displayName)}
              >
                Reply
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 border-muted pl-2 mt-2">
          {comment.replies.map(reply => (
            <CommentItem
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
