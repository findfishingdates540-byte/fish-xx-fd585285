import { FC, useState, useRef } from 'react';
import { Plus, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StoryReactionBarProps {
  onSendMessage?: (message: string) => void;
  onReaction?: (reaction: string) => void;
  onPlusClick?: () => void;
  isOwnStory?: boolean;
}

const VISIBLE_REACTIONS = [
  { emoji: '❤️', name: 'love' },
  { emoji: '👍', name: 'like' },
  { emoji: '😂', name: 'haha' },
];

const HIDDEN_REACTIONS = [
  { emoji: '🤗', name: 'care' },
  { emoji: '😮', name: 'wow' },
  { emoji: '😢', name: 'sad' },
  { emoji: '😠', name: 'angry' },
];

export const StoryReactionBar: FC<StoryReactionBarProps> = ({
  onSendMessage,
  onReaction,
  onPlusClick,
  isOwnStory = false,
}) => {
  const [message, setMessage] = useState('');
  const [showMoreReactions, setShowMoreReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);

  const handleSendMessage = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleReactionClick = (reaction: string) => {
    setSelectedReaction(reaction);
    onReaction?.(reaction);
    
    // Reset after animation
    setTimeout(() => setSelectedReaction(null), 600);
  };

  const handleDragEnd = () => {
    const currentX = dragX.get();
    if (currentX < -50) {
      setShowMoreReactions(true);
    } else if (currentX > 50) {
      setShowMoreReactions(false);
    }
    animate(dragX, 0);
  };

  // Show different UI for own stories vs others' stories
  const showMessageInput = !isOwnStory;

  return (
    <div className="absolute bottom-4 left-4 right-4 z-50">
      <div className="flex items-center gap-2">
        {/* Plus button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onPlusClick}
          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 flex-shrink-0"
        >
          <Plus className="h-5 w-5" />
        </Button>

        {/* Message input - only for others' stories */}
        {showMessageInput && (
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send message..."
              className="bg-white/10 backdrop-blur-sm border-0 text-white placeholder:text-white/60 rounded-full pr-10 h-10"
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              onClick={(e) => e.stopPropagation()}
            />
            {message.trim() && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSendMessage}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-white hover:bg-white/20"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Spacer for own stories */}
        {!showMessageInput && <div className="flex-1" />}

        {/* Reactions container */}
        <div 
          ref={containerRef}
          className="flex items-center gap-1 overflow-hidden"
        >
          <motion.div
            className="flex items-center gap-1"
            drag="x"
            dragConstraints={{ left: -100, right: 0 }}
            dragElastic={0.2}
            style={{ x: dragX }}
            onDragEnd={handleDragEnd}
          >
            {/* Hidden reactions (revealed on swipe) */}
            <AnimatePresence>
              {showMoreReactions && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-1 overflow-hidden"
                >
                  {HIDDEN_REACTIONS.map((reaction) => (
                    <motion.button
                      key={reaction.name}
                      onClick={() => handleReactionClick(reaction.emoji)}
                      whileTap={{ scale: 1.3 }}
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-xl",
                        "bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                      )}
                    >
                      {reaction.emoji}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Visible reactions */}
            {VISIBLE_REACTIONS.map((reaction) => (
              <motion.button
                key={reaction.name}
                onClick={() => handleReactionClick(reaction.emoji)}
                whileTap={{ scale: 1.3 }}
                animate={selectedReaction === reaction.emoji ? {
                  scale: [1, 1.5, 1],
                  y: [0, -20, 0],
                } : {}}
                transition={{ duration: 0.4 }}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-xl flex-shrink-0",
                  "bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                )}
              >
                {reaction.emoji}
              </motion.button>
            ))}

            {/* Swipe indicator */}
            {!showMoreReactions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="text-white/50 text-xs ml-1 whitespace-nowrap"
              >
                ← swipe
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
