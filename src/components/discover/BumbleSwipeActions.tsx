import { X, Star, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface BumbleSwipeActionsProps {
  onPass: () => void;
  onSuperLike?: () => void;
  onLike: () => void;
}

export function BumbleSwipeActions({
  onPass,
  onSuperLike,
  onLike,
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
    <div className="flex items-end justify-center gap-2">
      {/* Pass (X) - Gray circle */}
      <motion.button
        onClick={() => handleClick(onPass, 'pass')}
        data-tutorial="pass-button"
        animate={animatingButton === 'pass' ? { scale: [1, 0.85, 1.1, 1], rotate: [0, -8, 8, 0] } : {}}
        transition={{ duration: 0.35 }}
        className="h-16 w-16 rounded-full border border-border bg-background text-muted-foreground flex items-center justify-center transition-all hover:text-foreground hover:scale-105 shadow-lg"
        aria-label="Pass"
      >
        <X className="h-8 w-8" strokeWidth={2} />
      </motion.button>

      {/* Super Like (Star) - Amber hexagon - LARGER */}
      <motion.button
        onClick={() => handleClick(onSuperLike!, 'superlike')}
        data-tutorial="superlike-button"
        animate={animatingButton === 'superlike' ? { scale: [1, 0.8, 1.25, 1] } : {}}
        transition={{ duration: 0.4 }}
        className="relative h-20 w-20 flex items-center justify-center -mb-2"
        aria-label="Super Like"
      >
        {/* Hexagon shape using CSS clip-path */}
        <div 
          className="absolute inset-0 bg-amber-400 hover:bg-amber-300 transition-colors shadow-xl"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
        />
        <Star 
          className={cn(
            "h-9 w-9 text-white relative z-10",
            animatingButton === 'superlike' && "fill-current"
          )} 
          strokeWidth={1.5} 
        />
      </motion.button>

      {/* Like (Checkmark) - Gray circle with amber check */}
      <motion.button
        onClick={() => handleClick(onLike, 'like')}
        data-tutorial="like-button"
        animate={animatingButton === 'like' ? { scale: [1, 0.85, 1.2, 1] } : {}}
        transition={{ duration: 0.4 }}
        className="h-16 w-16 rounded-full border border-border bg-background flex items-center justify-center transition-all hover:scale-105 shadow-lg"
        aria-label="Like"
      >
        <Check className="h-8 w-8 text-amber-400" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
