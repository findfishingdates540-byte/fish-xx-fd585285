import { useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CallControls } from './CallControls';
import { RemoteUser } from './RemoteUser';
import { useAgoraCall } from '@/hooks/use-agora-call';
import { Loader2, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelName: string;
  userId: string;
  remoteUserName: string;
  remoteUserPhoto?: string;
}

export function VideoCallModal({
  open,
  onOpenChange,
  channelName,
  userId,
  remoteUserName,
  remoteUserPhoto,
}: VideoCallModalProps) {
  const localVideoRef = useRef<HTMLDivElement>(null);
  
  const {
    callStatus,
    isMuted,
    isVideoEnabled,
    remoteUsers,
    formattedDuration,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    getLocalVideoTrack,
  } = useAgoraCall();

  // Start call when modal opens
  useEffect(() => {
    if (open && callStatus === 'idle') {
      startCall(channelName, 'video', userId);
    }
  }, [open, callStatus, channelName, userId, startCall]);

  // Play local video
  useEffect(() => {
    if (callStatus === 'connected' && localVideoRef.current) {
      const localTrack = getLocalVideoTrack();
      if (localTrack) {
        localTrack.play(localVideoRef.current);
      }
    }
  }, [callStatus, getLocalVideoTrack]);

  // Handle closing
  const handleClose = async () => {
    await endCall();
    onOpenChange(false);
  };

  const remoteUser = remoteUsers[0];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-black border-0 max-h-[90vh]">
        <div className="relative flex flex-col h-[600px]">
          {/* Main Video Area */}
          <div className="flex-1 relative bg-muted">
            {/* Remote User Video or Avatar */}
            {remoteUser ? (
              <RemoteUser
                user={remoteUser}
                userName={remoteUserName}
                userPhoto={remoteUserPhoto}
                isVideoCall={true}
                className="absolute inset-0"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                {/* Pulse animation when waiting */}
                <AnimatePresence>
                  {callStatus === 'connecting' && (
                    <>
                      <motion.div
                        className="absolute rounded-full bg-primary/20"
                        style={{ width: 160, height: 160 }}
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute rounded-full bg-primary/20"
                        style={{ width: 160, height: 160 }}
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                      />
                    </>
                  )}
                </AnimatePresence>

                <Avatar className={cn(
                  'h-32 w-32 ring-4 transition-all relative z-10',
                  callStatus === 'connected' ? 'ring-green-500/50' : 'ring-primary/20'
                )}>
                  <AvatarImage src={remoteUserPhoto} alt={remoteUserName} />
                  <AvatarFallback className="text-4xl bg-primary/10">
                    {remoteUserName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center relative z-10">
                  <h2 className="text-xl font-semibold text-foreground">{remoteUserName}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {callStatus === 'connecting' ? 'Calling...' : 
                     callStatus === 'connected' ? 'Waiting for video...' :
                     'Connecting...'}
                  </p>
                </div>
              </div>
            )}

            {/* Call Duration */}
            {callStatus === 'connected' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full">
                <div className="flex items-center gap-2 text-white">
                  <Video className="h-4 w-4" />
                  <span className="font-mono">{formattedDuration}</span>
                </div>
              </div>
            )}

            {/* Connecting Overlay */}
            {callStatus === 'connecting' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full">
                <div className="flex items-center gap-2 text-white">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connecting...</span>
                </div>
              </div>
            )}

            {/* Local Video Preview (Picture-in-Picture) */}
            <div
              ref={localVideoRef}
              className={cn(
                'absolute bottom-20 right-4 w-32 h-44 bg-muted rounded-lg overflow-hidden shadow-lg border-2 border-background',
                !isVideoEnabled && 'flex items-center justify-center'
              )}
            >
              {!isVideoEnabled && (
                <div className="text-center">
                  <Avatar className="h-12 w-12 mx-auto">
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-muted-foreground mt-1">Camera off</p>
                </div>
              )}
            </div>
          </div>

          {/* Call Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <CallControls
              isMuted={isMuted}
              isVideoEnabled={isVideoEnabled}
              showVideoToggle={true}
              onToggleMute={toggleMute}
              onToggleVideo={toggleVideo}
              onEndCall={handleClose}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
