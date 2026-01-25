import { FC, useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useMarkStoryViewed, useDeleteStory, type GroupedStories } from '@/hooks/use-stories';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface StoryViewerProps {
  stories: GroupedStories;
  initialIndex?: number;
  onClose: () => void;
  onNextUser: () => void;
  onPrevUser: () => void;
  isFirstUser: boolean;
  isLastUser: boolean;
}

const STORY_DURATION = 5000; // 5 seconds per story

export const StoryViewer: FC<StoryViewerProps> = ({
  stories,
  initialIndex = 0,
  onClose,
  onNextUser,
  onPrevUser,
  isFirstUser,
  isLastUser,
}) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const markViewed = useMarkStoryViewed();
  const deleteStory = useDeleteStory();

  const currentStory = stories.stories[currentIndex];
  const isOwnStory = stories.user_id === user?.id;

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.has_viewed && !isOwnStory) {
      markViewed.mutate(currentStory.id);
    }
  }, [currentStory?.id]);

  const handleNext = useCallback(() => {
    if (currentIndex < stories.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else if (!isLastUser) {
      onNextUser();
    } else {
      onClose();
    }
  }, [currentIndex, stories.stories.length, isLastUser, onNextUser, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    } else if (!isFirstUser) {
      onPrevUser();
    }
  }, [currentIndex, isFirstUser, onPrevUser]);

  // Progress timer
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, currentIndex, stories.user_id]);

  // Handle story completion separately to avoid setState during render
  useEffect(() => {
    if (progress >= 100) {
      handleNext();
      setProgress(0);
    }
  }, [progress, handleNext]);

  const handleDelete = async () => {
    if (!currentStory) return;
    await deleteStory.mutateAsync(currentStory.id);
    
    if (stories.stories.length === 1) {
      onClose();
    } else if (currentIndex === stories.stories.length - 1) {
      setCurrentIndex(currentIndex - 1);
    }
    setProgress(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  if (!currentStory) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Navigation arrows */}
      {(!isFirstUser || currentIndex > 0) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {(!isLastUser || currentIndex < stories.stories.length - 1) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Story container */}
      <div 
        className="relative w-full max-w-[400px] h-full max-h-[90vh] mx-auto"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute top-4 left-4 right-4 z-30 flex gap-1">
          {stories.stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="absolute top-10 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src={stories.photo || undefined} />
              <AvatarFallback>{stories.display_name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-medium text-sm">
                {isOwnStory ? 'Your Story' : stories.display_name}
              </p>
              <p className="text-white/70 text-xs">
                {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {isOwnStory && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-white hover:bg-white/20"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Story content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 rounded-xl overflow-hidden"
          >
            {currentStory.media_url && currentStory.media_url.trim() ? (
              <img
                src={currentStory.media_url}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  // If image fails to load, hide it and show background
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center p-8"
                style={{ backgroundColor: currentStory.background_color || '#1877F2' }}
              >
                <p className="text-white text-2xl font-medium text-center break-words">
                  {currentStory.text_overlay || 'No content'}
                </p>
              </div>
            )}

            {/* Text overlay on image */}
            {currentStory.media_url && currentStory.text_overlay && (
              <div className="absolute bottom-20 left-4 right-4 bg-black/50 rounded-lg p-3">
                <p className="text-white text-center">{currentStory.text_overlay}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Tap zones for navigation */}
        <div className="absolute inset-0 z-20 flex">
          <div className="w-1/3 h-full" onClick={handlePrev} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full" onClick={handleNext} />
        </div>
      </div>
    </motion.div>
  );
};
