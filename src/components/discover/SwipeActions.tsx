import { Undo2, X, Star, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
  const [animatingButton, setAnimatingButton] = useState<string | null>(null);

  const handleClick = (action: () => void | undefined, buttonName: string) => {
    if (!action) return;
    setAnimatingButton(buttonName);
    action();
    setTimeout(() => setAnimatingButton(null), 400);
  };

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      {/* Rewind */}
      <motion.button
        onClick={() => handleClick(onRewind!, 'rewind')}
        disabled={!canRewind}
        data-tutorial="rewind-button"
        animate={animatingButton === 'rewind' ? { scale: [1, 0.85, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
        className={cn(
          'h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 flex items-center justify-center transition-colors',
          canRewind
            ? 'border-muted-foreground text-muted-foreground hover:border-foreground hover:text-foreground'
            : 'border-border text-border cursor-not-allowed'
        )}
      >
        <Undo2 className="h-4 w-4 sm:h-5 sm:w-5" />
      </motion.button>

      {/* Pass */}
      <motion.button
        onClick={() => handleClick(onPass, 'pass')}
        data-tutorial="pass-button"
        animate={animatingButton === 'pass' ? { scale: [1, 0.85, 1.1, 1], rotate: [0, -8, 8, 0] } : {}}
        transition={{ duration: 0.35 }}
        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-destructive text-destructive flex items-center justify-center transition-colors hover:bg-destructive hover:text-destructive-foreground"
      >
        <X className="h-6 w-6 sm:h-7 sm:w-7" />
      </motion.button>

      {/* Super Like */}
      <motion.button
        onClick={() => handleClick(onSuperLike!, 'superlike')}
        data-tutorial="superlike-button"
        animate={animatingButton === 'superlike' ? { scale: [1, 0.8, 1.25, 1] } : {}}
        transition={{ duration: 0.4 }}
        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-blue-500 text-blue-500 flex items-center justify-center transition-colors hover:bg-blue-500 hover:text-white"
      >
        <Star className={cn("h-4 w-4 sm:h-5 sm:w-5", animatingButton === 'superlike' && "fill-current")} />
      </motion.button>

      {/* Like */}
      <motion.button
        onClick={() => handleClick(onLike, 'like')}
        data-tutorial="like-button"
        animate={animatingButton === 'like' ? { scale: [1, 0.85, 1.2, 1] } : {}}
        transition={{ duration: 0.4 }}
        className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-foreground text-background flex items-center justify-center shadow-medium"
      >
        <Heart className="h-6 w-6 sm:h-7 sm:w-7 fill-current" />
      </motion.button>
    </div>
  );
}
