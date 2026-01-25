import { FC, useState, useRef } from 'react';
import { Plus, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StoryReactionBarProps {
  onSendMessage?: (message: string) => void;
  onReaction?: (reaction: string) => void;
  onPlusClick?: () => void;
  onPauseStory?: () => void;
  onResumeStory?: () => void;
  isOwnStory?: boolean;
}

// All reactions in order - visible ones first, then hidden ones revealed on scroll
const ALL_REACTIONS = [
  { emoji: '❤️', name: 'love' },
  { emoji: '👍', name: 'like' },
  { emoji: '😂', name: 'haha' },
  { emoji: '🤗', name: 'care' },
  { emoji: '😮', name: 'wow' },
  { emoji: '😢', name: 'sad' },
  { emoji: '😠', name: 'angry' },
];

export const StoryReactionBar: FC<StoryReactionBarProps> = ({
  onSendMessage,
  onReaction,
  onPlusClick,
  onPauseStory,
  onResumeStory,
  isOwnStory = false,
}) => {
  const [message, setMessage] = useState('');
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

        {/* Message input */}
        <div className="flex-1 relative min-w-0">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Send message..."
            className="bg-white/10 backdrop-blur-sm border-0 text-white placeholder:text-white/60 rounded-full pr-10 h-10"
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            onClick={(e) => e.stopPropagation()}
            onFocus={() => onPauseStory?.()}
            onBlur={() => onResumeStory?.()}
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

        {/* Reactions container - horizontally scrollable */}
        <div 
          ref={scrollContainerRef}
          className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-shrink-0"
          style={{ maxWidth: '140px' }}
          onTouchStart={() => onPauseStory?.()}
          onTouchEnd={() => onResumeStory?.()}
          onMouseDown={() => onPauseStory?.()}
          onMouseUp={() => onResumeStory?.()}
        >
          {ALL_REACTIONS.map((reaction) => (
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
        </div>
      </div>
    </div>
  );
};
