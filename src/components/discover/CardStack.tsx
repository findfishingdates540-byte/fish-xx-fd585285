import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SwipeableCard } from './SwipeableCard';
import { ProfileData } from './ProfileCard';

interface CardStackProps {
  profiles: ProfileData[];
  onLike: (profile: ProfileData) => void;
  onPass: (profile: ProfileData) => void;
  onEmpty?: () => void;
}

export function CardStack({ profiles, onLike, onPass, onEmpty }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  const handleSwipeLeft = useCallback(() => {
    if (currentProfile) {
      setDirection('left');
      onPass(currentProfile);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setDirection(null);
      }, 200);
    }
  }, [currentProfile, onPass]);

  const handleSwipeRight = useCallback(() => {
    if (currentProfile) {
      setDirection('right');
      onLike(currentProfile);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setDirection(null);
      }, 200);
    }
  }, [currentProfile, onLike]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleSwipeLeft();
      } else if (e.key === 'ArrowRight') {
        handleSwipeRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwipeLeft, handleSwipeRight]);

  // Notify when stack is empty
  useEffect(() => {
    if (currentIndex >= profiles.length && onEmpty) {
      onEmpty();
    }
  }, [currentIndex, profiles.length, onEmpty]);

  if (currentIndex >= profiles.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-[500px] text-center px-8"
      >
        <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mb-4">
          <span className="text-3xl">🎣</span>
        </div>
        <h3 className="text-xl font-bold mb-2">No more profiles</h3>
        <p className="text-muted-foreground">
          Check back later for more catches!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full max-w-sm h-[580px]">
      {/* Background card (next in stack) */}
      {nextProfile && (
        <motion.div
          className="absolute w-full"
          initial={{ scale: 0.92, y: 12 }}
          animate={{ scale: 0.95, y: 8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="opacity-60 pointer-events-none">
            <div className="bg-background rounded-3xl shadow-soft overflow-hidden">
              <div className="aspect-[3/4] bg-muted" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Current card */}
      <AnimatePresence mode="wait">
        {currentProfile && (
          <SwipeableCard
            key={currentProfile.id}
            profile={currentProfile}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Export action handlers for external button controls
export function useCardStackActions(
  onLike: () => void,
  onPass: () => void
) {
  return {
    triggerLike: onLike,
    triggerPass: onPass,
  };
}
