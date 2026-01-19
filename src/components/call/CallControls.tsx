import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallControlsProps {
  isMuted: boolean;
  isVideoEnabled: boolean;
  showVideoToggle?: boolean;
  onToggleMute: () => void;
  onToggleVideo?: () => void;
  onEndCall: () => void;
  className?: string;
  variant?: 'default' | 'whatsapp';
}

export function CallControls({
  isMuted,
  isVideoEnabled,
  showVideoToggle = false,
  onToggleMute,
  onToggleVideo,
  onEndCall,
  className,
  variant = 'default',
}: CallControlsProps) {
  // WhatsApp-style controls
  if (variant === 'whatsapp') {
    return (
      <div className={cn('flex items-center justify-center gap-6', className)}>
        {/* More Options */}
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-full bg-[#3b4a54] hover:bg-[#4a5c66] text-white"
        >
          <MoreHorizontal className="h-6 w-6" />
        </Button>

        {/* Video Toggle */}
        {showVideoToggle && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-14 w-14 rounded-full text-white transition-all',
              !isVideoEnabled 
                ? 'bg-[#3b4a54] hover:bg-[#4a5c66]' 
                : 'bg-white/20 hover:bg-white/30'
            )}
            onClick={onToggleVideo}
          >
            {isVideoEnabled ? (
              <Video className="h-6 w-6" />
            ) : (
              <VideoOff className="h-6 w-6" />
            )}
          </Button>
        )}

        {/* Speaker */}
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-full bg-[#3b4a54] hover:bg-[#4a5c66] text-white"
        >
          <Volume2 className="h-6 w-6" />
        </Button>

        {/* Mute Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-14 w-14 rounded-full text-white transition-all',
            isMuted 
              ? 'bg-white text-[#1f2c34] hover:bg-white/90' 
              : 'bg-[#3b4a54] hover:bg-[#4a5c66]'
          )}
          onClick={onToggleMute}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        {/* End Call Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white"
          onClick={onEndCall}
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  // Default controls (original style)
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      {/* Mute Button */}
      <Button
        variant="outline"
        size="lg"
        className={cn(
          'h-14 w-14 rounded-full transition-all',
          isMuted 
            ? 'bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30' 
            : 'bg-muted hover:bg-muted/80'
        )}
        onClick={onToggleMute}
      >
        {isMuted ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>

      {/* Video Toggle (only for video calls) */}
      {showVideoToggle && onToggleVideo && (
        <Button
          variant="outline"
          size="lg"
          className={cn(
            'h-14 w-14 rounded-full transition-all',
            !isVideoEnabled 
              ? 'bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30' 
              : 'bg-muted hover:bg-muted/80'
          )}
          onClick={onToggleVideo}
        >
          {isVideoEnabled ? (
            <Video className="h-6 w-6" />
          ) : (
            <VideoOff className="h-6 w-6" />
          )}
        </Button>
      )}

      {/* Speaker (decorative for now) */}
      <Button
        variant="outline"
        size="lg"
        className="h-14 w-14 rounded-full bg-muted hover:bg-muted/80"
      >
        <Volume2 className="h-6 w-6" />
      </Button>

      {/* End Call Button */}
      <Button
        variant="destructive"
        size="lg"
        className="h-14 w-14 rounded-full"
        onClick={onEndCall}
      >
        <PhoneOff className="h-6 w-6" />
      </Button>
    </div>
  );
}
