import { useState, useRef } from 'react';
import { Check, CheckCheck, Trash2, Mail, MailOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { VerificationBadge } from '@/components/ui/verification-badge';

interface Conversation {
  id: string;
  name: string;
  photo: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  isOnline?: boolean;
  isRead?: boolean;
  lastSeen?: string;
  idVerified?: boolean;
  liveVerified?: boolean;
}

interface SwipeableConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onMarkRead?: () => void;
  onDelete?: () => void;
}

export function SwipeableConversationItem({
  conversation,
  isSelected,
  onSelect,
  onMarkRead,
  onDelete,
}: SwipeableConversationItemProps) {
  const [isSwipedLeft, setIsSwipedLeft] = useState(false);
  const [isSwipedRight, setIsSwipedRight] = useState(false);
  const x = useMotionValue(0);
  const constraintsRef = useRef<HTMLDivElement>(null);
  
  // Background colors based on swipe direction
  const leftBg = useTransform(x, [-100, 0], ['hsl(var(--destructive))', 'transparent']);
  const rightBg = useTransform(x, [0, 100], ['transparent', 'hsl(var(--primary))']);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 80;
    
    if (info.offset.x < -threshold && onDelete) {
      // Swiped left - show delete action
      setIsSwipedLeft(true);
      setIsSwipedRight(false);
    } else if (info.offset.x > threshold && onMarkRead) {
      // Swiped right - mark as read
      setIsSwipedRight(true);
      setIsSwipedLeft(false);
    } else {
      setIsSwipedLeft(false);
      setIsSwipedRight(false);
    }
  };

  const handleActionClick = (action: 'read' | 'delete') => {
    if (action === 'read' && onMarkRead) {
      onMarkRead();
    } else if (action === 'delete' && onDelete) {
      onDelete();
    }
    setIsSwipedLeft(false);
    setIsSwipedRight(false);
  };

  return (
    <div ref={constraintsRef} className="relative overflow-hidden">
      {/* Background actions */}
      <div className="absolute inset-0 flex">
        {/* Right side - Mark as read (when swiping right) */}
        <div 
          className={cn(
            "flex items-center justify-start pl-4 w-1/2 transition-colors",
            isSwipedRight ? "bg-primary" : "bg-primary/20"
          )}
        >
          {isSwipedRight && (
            <button
              onClick={() => handleActionClick('read')}
              className="flex items-center gap-2 text-primary-foreground font-medium"
            >
              <MailOpen className="h-5 w-5" />
              <span className="text-sm">Mark Read</span>
            </button>
          )}
        </div>
        
        {/* Left side - Delete (when swiping left) */}
        <div 
          className={cn(
            "flex items-center justify-end pr-4 w-1/2 transition-colors",
            isSwipedLeft ? "bg-destructive" : "bg-destructive/20"
          )}
        >
          {isSwipedLeft && (
            <button
              onClick={() => handleActionClick('delete')}
              className="flex items-center gap-2 text-destructive-foreground font-medium"
            >
              <span className="text-sm">Delete</span>
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={{ x: isSwipedLeft ? -100 : isSwipedRight ? 100 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative bg-background"
      >
        <button
          onClick={onSelect}
          className={cn(
            'w-full flex items-center gap-3 p-4 text-left transition-colors border-l-2',
            isSelected
              ? 'bg-accent/50 border-l-primary'
              : 'border-l-transparent hover:bg-accent/30'
          )}
        >
          {/* Avatar with status indicator */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={conversation.photo} alt={conversation.name} />
              <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
              conversation.isOnline ? "bg-green-500" : 
              conversation.lastSeen === 'Active now' ? "bg-yellow-500" :
              "bg-muted-foreground/30"
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-sm flex items-center gap-1">
                {conversation.name}
                <VerificationBadge 
                  idVerified={conversation.idVerified} 
                  liveVerified={conversation.liveVerified} 
                  size="sm" 
                />
              </span>
              <span className="text-xs text-primary">{conversation.time}</span>
            </div>
            {!conversation.isOnline && conversation.lastSeen && (
              <p className={cn(
                "text-xs mb-0.5",
                conversation.lastSeen === 'Active now' ? "text-yellow-600" : "text-muted-foreground"
              )}>{conversation.lastSeen}</p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground truncate pr-2">
                {conversation.lastMessage}
              </p>
              {conversation.unreadCount && conversation.unreadCount > 0 ? (
                <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-[20px] flex items-center justify-center">
                  {conversation.unreadCount}
                </Badge>
              ) : conversation.isRead ? (
                <CheckCheck className="h-4 w-4 text-primary flex-shrink-0" />
              ) : (
                <Check className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          </div>
        </button>
      </motion.div>

      {/* Reset swipe on tap */}
      {(isSwipedLeft || isSwipedRight) && (
        <button
          onClick={() => {
            setIsSwipedLeft(false);
            setIsSwipedRight(false);
          }}
          className="absolute inset-0 z-10 bg-transparent md:hidden"
          aria-label="Reset swipe"
        />
      )}
    </div>
  );
}
