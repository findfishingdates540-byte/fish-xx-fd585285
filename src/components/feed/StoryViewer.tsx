import { FC, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useMarkStoryViewed, useDeleteStory, type GroupedStories } from '@/hooks/use-stories';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { StoryReactionBar } from './StoryReactionBar';
import { toast } from 'sonner';

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

  console.log('[StoryViewer] Rendering story:', {
    mediaUrl: currentStory.media_url,
    textOverlay: currentStory.text_overlay,
    backgroundColor: currentStory.background_color
  });

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] bg-black overflow-hidden"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="fixed top-4 right-4 z-[10000] text-white hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Navigation arrows */}
      {(!isFirstUser || currentIndex > 0) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-[10000] text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {(!isLastUser || currentIndex < stories.stories.length - 1) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-[10000] text-white hover:bg-white/20"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Story content wrapper */}
      <div
        className="w-screen h-screen flex items-center justify-center bg-black"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Inner container - mobile full screen, desktop centered */}
        <div className="relative w-screen h-screen md:w-[400px] md:h-[90vh] md:rounded-xl overflow-hidden bg-black">
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
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
          <div className="absolute top-10 left-4 right-4 z-50 flex items-center justify-between">
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {currentStory.media_url && currentStory.media_url.trim() ? (
                <>
                  <img
                    src={currentStory.media_url}
                    alt="Story"
                    className="w-full h-full object-contain"
                    onLoad={() => console.log('[StoryViewer] Image loaded successfully')}
                    onError={(e) => {
                      console.error('[StoryViewer] Image failed to load');
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {currentStory.text_overlay && (
                    <div className="absolute bottom-20 left-4 right-4 bg-black/70 rounded-lg p-4 z-40">
                      <p className="text-white text-center">{currentStory.text_overlay}</p>
                    </div>
                  )}
                </>
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center p-8"
                  style={{ backgroundColor: currentStory.background_color || '#1877F2' }}
                >
                  <p className="text-white text-2xl font-medium text-center break-words max-w-md">
                    {currentStory.text_overlay || 'No content'}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Tap zones for navigation */}
          <div className="absolute inset-0 z-30 flex pointer-events-none">
            <div className="w-1/3 h-full pointer-events-auto" onClick={handlePrev} />
            <div className="w-1/3 h-full" />
            <div className="w-1/3 h-full pointer-events-auto" onClick={handleNext} />
          </div>

          {/* Reaction bar - only show for other people's stories */}
          {!isOwnStory && (
            <StoryReactionBar
              isOwnStory={isOwnStory}
              onSendMessage={(message) => {
                toast.success(`Message sent to ${stories.display_name}`);
                // TODO: Implement actual message sending
              }}
              onReaction={(reaction) => {
                toast.success(`Reacted with ${reaction}`);
                // TODO: Implement actual reaction
              }}
              onPlusClick={() => {
                // TODO: Add more options
              }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );

  return createPortal(content, document.body);
};
