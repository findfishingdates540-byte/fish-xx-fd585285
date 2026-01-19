import { useEffect, useRef } from 'react';
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface RemoteUserProps {
  user: IAgoraRTCRemoteUser;
  userName?: string;
  userPhoto?: string;
  isVideoCall?: boolean;
  className?: string;
}

export function RemoteUser({
  user,
  userName = 'User',
  userPhoto,
  isVideoCall = false,
  className,
}: RemoteUserProps) {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVideoCall && user.videoTrack && videoRef.current) {
      user.videoTrack.play(videoRef.current);
      
      return () => {
        user.videoTrack?.stop();
      };
    }
  }, [user, isVideoCall]);

  if (!isVideoCall || !user.videoTrack) {
    // Voice call - show avatar
    return (
      <div className={cn(
        'flex flex-col items-center justify-center gap-4',
        className
      )}>
        <Avatar className="h-32 w-32 ring-4 ring-primary/20">
          <AvatarImage src={userPhoto} alt={userName} />
          <AvatarFallback className="text-4xl bg-primary/10">
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="text-lg font-medium text-foreground">{userName}</p>
      </div>
    );
  }

  // Video call - show video
  return (
    <div
      ref={videoRef}
      className={cn(
        'w-full h-full bg-muted rounded-lg overflow-hidden',
        className
      )}
    />
  );
}
