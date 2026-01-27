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
      colors: ['#1a1a1a', '#333333', '#666666', '#999999', '#ffffff'],
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
    <motion.div 
      className="flex items-end justify-center gap-3 sm:gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Pass (X) - Light gray circle */}
      <motion.button
        onClick={() => handleClick(onPass, 'pass')}
        data-tutorial="pass-button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }}
        whileTap={{ scale: 0.9 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 17,
          delay: 0.1
        }}
        className="h-11 w-11 sm:h-14 sm:w-14 lg:h-20 lg:w-20 rounded-full border border-border bg-background text-muted-foreground flex items-center justify-center shadow-lg hover:text-destructive hover:border-destructive/50"
        aria-label="Pass"
      >
        <motion.div
          animate={animatingButton === 'pass' ? { rotate: [0, -15, 15, 0], x: [-5, 5, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <X className="h-5 w-5 sm:h-7 sm:w-7 lg:h-10 lg:w-10" strokeWidth={2} />
        </motion.div>
      </motion.button>

      {/* Super Like (Star) - Black rounded square */}
      <motion.button
        onClick={() => handleClick(onSuperLike!, 'superlike')}
        data-tutorial="superlike-button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08, y: -4 }}
        whileTap={{ scale: 0.92 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 17,
          delay: 0.2
        }}
        className="relative h-12 w-12 sm:h-16 sm:w-16 lg:h-24 lg:w-24 flex items-center justify-center -mb-0.5 sm:-mb-1 lg:-mb-2"
        aria-label="Super Like"
      >
        <motion.div 
          className="absolute inset-0 bg-foreground shadow-xl rounded-xl sm:rounded-2xl lg:rounded-3xl"
          whileHover={{ 
            boxShadow: "0 0 30px rgba(0,0,0,0.4)",
          }}
          transition={{ duration: 0.2 }}
        />
        <motion.div
          animate={animatingButton === 'superlike' ? { 
            scale: [1, 1.3, 1], 
            rotate: [0, 15, -15, 0] 
          } : {}}
          transition={{ duration: 0.4 }}
        >
          <Star 
            className={cn(
              "h-6 w-6 sm:h-8 sm:w-8 lg:h-11 lg:w-11 text-background relative z-10 transition-all",
              animatingButton === 'superlike' && "fill-current"
            )} 
            strokeWidth={1.5} 
          />
        </motion.div>
      </motion.button>

      {/* Like (Checkmark) - Light gray circle with black check */}
      <motion.button
        onClick={() => handleClick(onLike, 'like')}
        data-tutorial="like-button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }}
        whileTap={{ scale: 0.9 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 17,
          delay: 0.3
        }}
        className="h-11 w-11 sm:h-14 sm:w-14 lg:h-20 lg:w-20 rounded-full border border-border bg-background flex items-center justify-center shadow-lg hover:text-green-600 hover:border-green-500/50"
        aria-label="Like"
      >
        <motion.div
          animate={animatingButton === 'like' ? { scale: [1, 1.4, 1], y: [0, -5, 0] } : {}}
          transition={{ duration: 0.35 }}
        >
          <Check className="h-5 w-5 sm:h-7 sm:w-7 lg:h-10 lg:w-10 text-foreground" strokeWidth={2.5} />
        </motion.div>
      </motion.button>
    </motion.div>
  );
}
