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
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      {/* Rewind */}
      <button
        onClick={onRewind}
        disabled={!canRewind}
        className={cn(
          'h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 flex items-center justify-center transition-all',
          canRewind
            ? 'border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground hover:scale-110'
            : 'border-border text-border cursor-not-allowed'
        )}
      >
        <Undo2 className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      {/* Pass */}
      <button
        onClick={onPass}
        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-destructive text-destructive flex items-center justify-center transition-all hover:bg-destructive hover:text-destructive-foreground hover:scale-110"
      >
        <X className="h-6 w-6 sm:h-7 sm:w-7" />
      </button>

      {/* Super Like */}
      <button
        onClick={onSuperLike}
        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-muted-foreground text-muted-foreground flex items-center justify-center transition-all hover:border-foreground hover:text-foreground hover:scale-110"
      >
        <Star className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      {/* Like */}
      <button
        onClick={onLike}
        className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-foreground text-background flex items-center justify-center transition-all hover:scale-110 shadow-medium"
      >
        <Heart className="h-6 w-6 sm:h-7 sm:w-7 fill-current" />
      </button>
    </div>
  );
}
