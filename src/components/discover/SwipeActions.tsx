import { Undo2, X, Star, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeActionsProps {
  onRewind?: () => void;
  onPass: () => void;
  onSuperLike?: () => void;
  onLike: () => void;
  canRewind?: boolean;
}

export function SwipeActions({
  onRewind,
  onPass,
  onSuperLike,
  onLike,
  canRewind = false,
}: SwipeActionsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Rewind */}
      <button
        onClick={onRewind}
        disabled={!canRewind}
        className={cn(
          'h-12 w-12 rounded-full border-2 flex items-center justify-center transition-all',
          canRewind
            ? 'border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground hover:scale-110'
            : 'border-border text-border cursor-not-allowed'
        )}
      >
        <Undo2 className="h-5 w-5" />
      </button>

      {/* Pass */}
      <button
        onClick={onPass}
        className="h-14 w-14 rounded-full border-2 border-destructive text-destructive flex items-center justify-center transition-all hover:bg-destructive hover:text-destructive-foreground hover:scale-110"
      >
        <X className="h-7 w-7" />
      </button>

      {/* Super Like */}
      <button
        onClick={onSuperLike}
        className="h-12 w-12 rounded-full border-2 border-muted-foreground text-muted-foreground flex items-center justify-center transition-all hover:border-foreground hover:text-foreground hover:scale-110"
      >
        <Star className="h-5 w-5" />
      </button>

      {/* Like */}
      <button
        onClick={onLike}
        className="h-16 w-16 rounded-full bg-foreground text-background flex items-center justify-center transition-all hover:scale-110 shadow-medium"
      >
        <Heart className="h-7 w-7 fill-current" />
      </button>
    </div>
  );
}
