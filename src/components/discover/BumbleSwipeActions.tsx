import { X, Star, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface BumbleSwipeActionsProps {
  onPass: () => void;
  onSuperLike?: () => void;
  onLike: () => void;
  showKeyboardHints?: boolean;
}

export function BumbleSwipeActions({
  onPass,
  onSuperLike,
  onLike,
  showKeyboardHints = false,
}: BumbleSwipeActionsProps) {
  const [animatingButton, setAnimatingButton] = useState<string | null>(null);

  const triggerSuperLikeConfetti = useCallback(() => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7', '#ffffff'],
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
    
    if (buttonName === 'superlike') {
      triggerSuperLikeConfetti();
    }
    
    action();
    setTimeout(() => setAnimatingButton(null), 400);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Main Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        {/* Pass (X) - Gray circle */}
        <motion.button
          onClick={() => handleClick(onPass, 'pass')}
          data-tutorial="pass-button"
          animate={animatingButton === 'pass' ? { scale: [1, 0.85, 1.1, 1], rotate: [0, -8, 8, 0] } : {}}
          transition={{ duration: 0.35 }}
          className="h-14 w-14 rounded-full border-2 border-muted-foreground/40 bg-background text-muted-foreground flex items-center justify-center transition-all hover:border-muted-foreground hover:text-foreground hover:scale-105 shadow-md"
          aria-label="Pass"
        >
          <X className="h-7 w-7" strokeWidth={2.5} />
        </motion.button>

        {/* Super Like (Star) - Amber hexagon */}
        <motion.button
          onClick={() => handleClick(onSuperLike!, 'superlike')}
          data-tutorial="superlike-button"
          animate={animatingButton === 'superlike' ? { scale: [1, 0.8, 1.25, 1] } : {}}
          transition={{ duration: 0.4 }}
          className="relative h-16 w-16 flex items-center justify-center"
          aria-label="Super Like"
        >
          {/* Hexagon shape using CSS clip-path */}
          <div 
            className="absolute inset-0 bg-amber-400 hover:bg-amber-300 transition-colors shadow-lg"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}
          />
          <Star 
            className={cn(
              "h-7 w-7 text-white relative z-10",
              animatingButton === 'superlike' && "fill-current"
            )} 
            strokeWidth={2} 
          />
        </motion.button>

        {/* Like (Checkmark) - Gray circle */}
        <motion.button
          onClick={() => handleClick(onLike, 'like')}
          data-tutorial="like-button"
          animate={animatingButton === 'like' ? { scale: [1, 0.85, 1.2, 1] } : {}}
          transition={{ duration: 0.4 }}
          className="h-14 w-14 rounded-full border-2 border-muted-foreground/40 bg-background text-muted-foreground flex items-center justify-center transition-all hover:border-muted-foreground hover:text-foreground hover:scale-105 shadow-md"
          aria-label="Like"
        >
          <Check className="h-7 w-7" strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Keyboard Hints - Optional */}
      {showKeyboardHints && (
        <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">←</kbd>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">↑</kbd>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">↓</kbd>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">→</kbd>
          </span>
        </div>
      )}
    </div>
  );
}
