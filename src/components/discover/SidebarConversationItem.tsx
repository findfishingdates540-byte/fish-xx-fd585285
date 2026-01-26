import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { YourMoveBadge } from '@/components/messages/YourMoveBadge';
import { ExpirationTimer } from '@/components/messages/ExpirationTimer';
import { useMatchExpiration } from '@/hooks/use-match-expiration';
import { cn } from '@/lib/utils';

interface SidebarConversationItemProps {
  id: string;
  name: string;
  photo: string;
  lastMessage: string | null;
  time: string;
  unreadCount: number;
  isOnline?: boolean;
  isYourMove?: boolean;
  matchedAt?: string;
  onClick: () => void;
}

export function SidebarConversationItem({
  id,
  name,
  photo,
  lastMessage,
  time,
  unreadCount,
  isOnline,
  isYourMove,
  matchedAt,
  onClick,
}: SidebarConversationItemProps) {
  // Pass the match ID as an array to the hook
  const matchIds = useMemo(() => [id], [id]);
  const { getExpiration } = useMatchExpiration(matchIds);
  const expiration = getExpiration(id);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors text-left rounded-lg",
        unreadCount > 0 && "bg-accent/30"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={photo} alt={name} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={cn(
            "font-semibold text-sm truncate",
            unreadCount > 0 && "text-foreground"
          )}>
            {name}
          </span>
          {isYourMove && <YourMoveBadge className="flex-shrink-0" />}
        </div>

        {/* Last message preview */}
        <p className={cn(
          "text-xs truncate",
          unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          {lastMessage || "Say hi! 👋"}
        </p>

        {/* Time & Expiration */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground">{time}</span>
          {expiration && expiration.formattedTime && expiration.formattedTime !== 'Expired' && (
            <ExpirationTimer
              formattedTime={expiration.formattedTime}
              isExpiringSoon={expiration.isExpiringSoon}
              isUrgent={expiration.isUrgent}
            />
          )}
        </div>
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="flex-shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-primary flex items-center justify-center">
          <span className="text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </div>
      )}
    </button>
  );
}
