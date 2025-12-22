import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SmilePlus } from 'lucide-react';

interface ReactionSummary {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: ReactionSummary[];
  onToggleReaction: (messageId: string, emoji: string) => void;
  isMine: boolean;
}

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

export function MessageReactions({
  messageId,
  reactions,
  onToggleReaction,
  isMine,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleReaction = (emoji: string) => {
    onToggleReaction(messageId, emoji);
    setShowPicker(false);
  };

  return (
    <div className={cn(
      'flex items-center gap-1 flex-wrap',
      isMine ? 'justify-end' : 'justify-start'
    )}>
      {/* Display existing reactions */}
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReaction(reaction.emoji)}
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors',
            reaction.hasReacted
              ? 'bg-primary/20 border border-primary/50'
              : 'bg-muted hover:bg-muted/80 border border-transparent'
          )}
        >
          <span>{reaction.emoji}</span>
          {reaction.count > 1 && (
            <span className="text-muted-foreground">{reaction.count}</span>
          )}
        </button>
      ))}

      {/* Add reaction button */}
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <button
            className="inline-flex items-center justify-center h-6 w-6 rounded-full hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
          >
            <SmilePlus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-2" 
          side={isMine ? 'left' : 'right'}
          align="center"
        >
          <div className="flex gap-1">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
