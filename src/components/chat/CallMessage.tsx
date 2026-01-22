import { FC } from 'react';
import { Phone, Video, PhoneOff, PhoneMissed } from 'lucide-react';
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
  
  const CallIcon = callType === 'video' ? Video : Phone;
  const StatusIcon = isMissed ? PhoneMissed : (isMine ? Phone : Phone);
  
  const handleClick = () => {
    if (callType && onCallback) {
      onCallback(callType);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all",
        "hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
        isMissed
          ? "bg-destructive/10 border border-destructive/20"
          : "bg-accent/80 border border-border",
        isMine ? "rounded-br-sm" : "rounded-bl-sm"
      )}
    >
      {/* Call Icon Container */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
        isMissed 
          ? "bg-destructive/20 text-destructive" 
          : "bg-primary/10 text-primary"
      )}>
        {isMissed ? (
          <PhoneMissed className="w-5 h-5" />
        ) : (
          <CallIcon className="w-5 h-5" />
        )}
      </div>
      
      {/* Call Details */}
      <div className="flex flex-col items-start min-w-0">
        <span className={cn(
          "text-sm font-medium",
          isMissed ? "text-destructive" : "text-foreground"
        )}>
          {callType === 'video' ? 'Video Call' : 'Voice Call'}
        </span>
        <div className="flex items-center gap-2">
          {isMissed ? (
            <span className="text-xs text-destructive font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              Missed
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {duration}
            </span>
          )}
          <span className="text-xs text-muted-foreground">• {timestamp}</span>
        </div>
      </div>
      
      {/* Callback indicator */}
      <div className={cn(
        "ml-auto pl-2 flex-shrink-0",
        isMissed ? "text-destructive" : "text-primary"
      )}>
        <Phone className="w-4 h-4" />
      </div>
    </button>
  );
};
