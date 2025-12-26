import { useState, useRef, ReactNode } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Reply } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableMessageProps {
  children: ReactNode;
  onReply: () => void;
  isMine: boolean;
  className?: string;
}

const SWIPE_THRESHOLD = 60;
const MAX_SWIPE = 80;

export function SwipeableMessage({ children, onReply, isMine, className }: SwipeableMessageProps) {
  const controls = useAnimation();
  const [showReplyIcon, setShowReplyIcon] = useState(false);
  const hasTriggeredReply = useRef(false);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const shouldTriggerReply = isMine ? offset < -SWIPE_THRESHOLD : offset > SWIPE_THRESHOLD;
    
    if (shouldTriggerReply && !hasTriggeredReply.current) {
      hasTriggeredReply.current = true;
      onReply();
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
    
    // Reset position
    await controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } });
    setShowReplyIcon(false);
    hasTriggeredReply.current = false;
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const shouldShow = isMine ? offset < -30 : offset > 30;
    setShowReplyIcon(shouldShow);
  };

  // Constrain drag based on message ownership
  const dragConstraints = isMine 
    ? { left: -MAX_SWIPE, right: 0 }
    : { left: 0, right: MAX_SWIPE };

  return (
    <div className={cn("relative flex items-center", className)}>
      {/* Reply icon indicator - left side (for received messages) */}
      {!isMine && (
        <motion.div
          className="absolute left-0 flex items-center justify-center w-8 h-8 -ml-2"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: showReplyIcon ? 1 : 0,
            scale: showReplyIcon ? 1 : 0.5
          }}
          transition={{ duration: 0.15 }}
        >
          <div className="p-1.5 rounded-full bg-primary text-primary-foreground">
            <Reply className="w-4 h-4" />
          </div>
        </motion.div>
      )}
      
      <motion.div
        drag="x"
        dragConstraints={dragConstraints}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="cursor-grab active:cursor-grabbing touch-pan-y w-full"
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>

      {/* Reply icon indicator - right side (for own messages) */}
      {isMine && (
        <motion.div
          className="absolute right-0 flex items-center justify-center w-8 h-8 -mr-2"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: showReplyIcon ? 1 : 0,
            scale: showReplyIcon ? 1 : 0.5
          }}
          transition={{ duration: 0.15 }}
        >
          <div className="p-1.5 rounded-full bg-primary text-primary-foreground">
            <Reply className="w-4 h-4" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
