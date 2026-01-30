import { FC } from 'react';
import { Phone, Video, PhoneMissed, PhoneOutgoing } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallMessageProps {
  content: string;
  isMine: boolean;
  timestamp: string;
  onCallback?: (callType: 'voice' | 'video') => void;
}

// Parse call message to extract type and duration
export function parseCallMessage(content: string): { 
  isCallMessage: boolean; 
  callType: 'voice' | 'video' | null;
  isMissed: boolean;
  duration: string | null;
} {
  const voiceMatch = content.match(/📞 Voice call • (.+)/);
  const videoMatch = content.match(/📹 Video call • (.+)/);
  
  if (voiceMatch) {
    const isMissed = voiceMatch[1] === 'Missed';
    return { 
      isCallMessage: true, 
      callType: 'voice', 
      isMissed,
      duration: isMissed ? null : voiceMatch[1]
    };
  }
  
  if (videoMatch) {
    const isMissed = videoMatch[1] === 'Missed';
    return { 
      isCallMessage: true, 
      callType: 'video',
      isMissed,
      duration: isMissed ? null : videoMatch[1]
    };
  }
  
  return { isCallMessage: false, callType: null, isMissed: false, duration: null };
}

export const CallMessage: FC<CallMessageProps> = ({
  content,
  isMine,
  timestamp,
  onCallback,
}) => {
  const { callType, isMissed, duration } = parseCallMessage(content);
  
  const handleClick = () => {
    if (callType && onCallback) {
      onCallback(callType);
    }
  };

  return (
    <div className={cn(
      "flex w-full",
      isMine ? "justify-end" : "justify-start"
    )}>
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all min-w-[240px]",
          "hover:opacity-90 active:scale-[0.98] cursor-pointer shadow-sm",
          isMissed
            ? "bg-destructive/10 border border-destructive/20"
            : isMine 
              ? "bg-primary text-primary-foreground" 
              : "bg-accent border border-border",
          isMine ? "rounded-br-sm" : "rounded-bl-sm"
        )}
      >
        {/* Call Icon - WhatsApp style dark circle */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          isMissed 
            ? "bg-destructive/20 text-destructive" 
            : "bg-foreground/90 text-background"
        )}>
          {isMissed ? (
            <PhoneMissed className="w-5 h-5" />
          ) : callType === 'video' ? (
            <Video className="w-5 h-5" />
          ) : (
            <PhoneOutgoing className="w-5 h-5" />
          )}
        </div>
        
        {/* Call Details - stacked vertically */}
        <div className="flex flex-col items-start flex-1">
          {/* Call Type Title */}
          <span className={cn(
            "text-sm font-semibold whitespace-nowrap",
            isMissed 
              ? "text-destructive" 
              : isMine 
                ? "text-primary-foreground" 
                : "text-foreground"
          )}>
            {callType === 'video' ? 'Video call' : 'Voice call'}
          </span>
          
          {/* Duration or Missed subtitle */}
          <span className={cn(
            "text-xs whitespace-nowrap",
            isMissed 
              ? "text-destructive/80" 
              : isMine 
                ? "text-primary-foreground/70" 
                : "text-muted-foreground"
          )}>
            {isMissed ? 'Tap to call back' : `${duration} • Tap to call again`}
          </span>
        </div>
        
        {/* Timestamp - bottom right corner, on its own line */}
        <span className={cn(
          "text-[11px] self-end flex-shrink-0",
          isMissed 
            ? "text-destructive/60" 
            : isMine 
              ? "text-primary-foreground/60" 
              : "text-muted-foreground"
        )}>
          {timestamp}
        </span>
      </button>
    </div>
  );
};
