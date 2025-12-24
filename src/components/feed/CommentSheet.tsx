import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User } from 'lucide-react';
import { useFeedComments, useAddComment, FeedComment } from '@/hooks/use-feed';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface CommentSheetProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  commentsCount: number;
}

export function CommentSheet({ postId, isOpen, onClose, commentsCount }: CommentSheetProps) {
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const { data: comments = [], isLoading } = useFeedComments(postId);
  const addComment = useAddComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      await addComment.mutateAsync({ postId, content: newComment.trim() });
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
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
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </ScrollArea>

        {user ? (
          <form onSubmit={handleSubmit} className="pt-4 border-t border-border flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
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
        ) : (
          <div className="pt-4 border-t border-border text-center text-muted-foreground">
            Sign in to comment
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CommentItem({ comment }: { comment: FeedComment }) {
  const avatarUrl = comment.profile?.photos?.[0];
  const displayName = comment.profile?.display_name || 'Anonymous';

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback>
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm">{displayName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm mt-0.5">{comment.content}</p>
      </div>
    </div>
  );
}
