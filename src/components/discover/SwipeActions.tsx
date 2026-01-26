import { Undo2, X, Star, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

  const triggerSuperLikeConfetti = useCallback(() => {
    // Star burst from center
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#ffffff', '#fbbf24'],
    };

    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ['star'],
    });

    confetti({
      ...defaults,
      particleCount: 25,
      scalar: 0.75,
      shapes: ['circle'],
    });

    // Secondary burst
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 30,
        scalar: 1,
        shapes: ['star'],
        startVelocity: 20,
      });
    }, 150);
  }, []);

  const handleClick = (action: () => void | undefined, buttonName: string) => {
    if (!action) return;
    setAnimatingButton(buttonName);
    
    // Trigger confetti for super like
    if (buttonName === 'superlike') {
      triggerSuperLikeConfetti();
    }
    
    action();
    setTimeout(() => setAnimatingButton(null), 400);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-center gap-2">
        {/* Pass */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={() => handleClick(onPass, 'pass')}
              data-tutorial="pass-button"
              animate={animatingButton === 'pass' ? { scale: [1, 0.85, 1.1, 1], rotate: [0, -8, 8, 0] } : {}}
              transition={{ duration: 0.35 }}
              className="h-14 w-14 rounded-full border-2 border-destructive text-destructive flex items-center justify-center transition-all hover:bg-destructive hover:text-destructive-foreground hover:scale-105"
            >
              <X className="h-7 w-7" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="hidden lg:block">
            <p>Pass <kbd className="ml-1.5 px-1 py-0.5 bg-muted rounded text-xs">←</kbd></p>
          </TooltipContent>
        </Tooltip>

        {/* Super Like */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={() => handleClick(onSuperLike!, 'superlike')}
              data-tutorial="superlike-button"
              animate={animatingButton === 'superlike' ? { scale: [1, 0.8, 1.25, 1] } : {}}
              transition={{ duration: 0.4 }}
              className="h-11 w-11 rounded-full border-2 border-blue-500 text-blue-500 flex items-center justify-center transition-all hover:bg-blue-500 hover:text-white hover:scale-105"
            >
              <Star className={cn("h-5 w-5", animatingButton === 'superlike' && "fill-current")} />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="hidden lg:block">
            <p>Super Like <kbd className="ml-1.5 px-1 py-0.5 bg-muted rounded text-xs">↑</kbd></p>
          </TooltipContent>
        </Tooltip>

        {/* Like - Primary action with gradient */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={() => handleClick(onLike, 'like')}
              data-tutorial="like-button"
              animate={animatingButton === 'like' ? { scale: [1, 0.85, 1.2, 1] } : {}}
              transition={{ duration: 0.4 }}
              className="h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center shadow-lg shadow-green-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-green-500/40"
            >
              <Heart className="h-8 w-8 fill-current" />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="hidden lg:block">
            <p>Like <kbd className="ml-1.5 px-1 py-0.5 bg-muted rounded text-xs">→</kbd></p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
