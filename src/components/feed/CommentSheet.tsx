import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, CornerDownRight, Smile, X } from 'lucide-react';
import { useFeedComments, useAddComment, useToggleCommentReaction, FeedComment } from '@/hooks/use-feed';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion, AnimatePresence } from 'framer-motion';

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
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useFeedComments(postId);
  const addComment = useAddComment();

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
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleReply = (commentId: string, displayName: string) => {
    setReplyingTo({ id: commentId, name: displayName });
  };

  const cancelReply = () => {
    setReplyingTo(null);
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
          <div className="pt-4 border-t border-border">
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
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Add a comment..."}
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
            <span className="font-medium text-sm">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm mt-0.5 break-words">{comment.content}</p>
          
          {/* Reactions and Reply button */}
          <div className="flex items-center gap-2 mt-2">
            {/* Existing reactions */}
            <div className="flex items-center gap-1 flex-wrap">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <motion.button
                  key={emoji}
                  whileTap={{ scale: 0.9 }}
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
