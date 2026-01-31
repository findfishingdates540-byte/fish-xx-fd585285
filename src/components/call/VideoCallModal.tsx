import { useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CallControls } from './CallControls';
import { useDailyCall } from '@/hooks/use-daily-call';
import { Loader2, Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface VideoCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean, durationSeconds?: number) => void;
  channelName: string;
  userId: string;
  remoteUserName: string;
  remoteUserPhoto?: string;
  roomUrl?: string; // If provided, join this room instead of creating a new one
  onRoomCreated?: (roomUrl: string) => void; // Called when caller creates a room
}

export function VideoCallModal({
  open,
  onOpenChange,
  channelName,
  userId,
  remoteUserName,
  remoteUserPhoto,
  roomUrl,
  onRoomCreated,
}: VideoCallModalProps) {
  const startedRef = useRef(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // Handle remote user leaving - end call automatically
  const handleRemoteUserLeft = useCallback(() => {
    console.log('[VideoCall] Remote user left, ending call');
    const duration = callDurationRef.current;
    endCallRef.current?.();
    onOpenChange(false, duration);
  }, [onOpenChange]);
  
  const {
    callStatus,
    isMuted,
    isVideoEnabled,
    remoteParticipants,
    callDuration,
    formattedDuration,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    attachLocalVideo,
    attachRemoteVideo,
  } = useDailyCall({
    onRemoteUserLeft: handleRemoteUserLeft,
  });
  
  // Keep refs updated for the callback
  const callDurationRef = useRef(callDuration);
  const endCallRef = useRef(endCall);
  useEffect(() => {
    callDurationRef.current = callDuration;
    endCallRef.current = endCall;
  }, [callDuration, endCall]);

  // Start call once per open (prevents duplicate rooms / duplicate DailyIframe)
  useEffect(() => {
    if (!open) {
      startedRef.current = false;
      return;
    }

    if (startedRef.current) return;
    startedRef.current = true;

    startCall(channelName, 'video', userId, roomUrl).then((result) => {
      if (result.success && result.roomUrl && !roomUrl && onRoomCreated) {
        // Caller created a new room - notify parent to update session
        onRoomCreated(result.roomUrl);
      }
    });
  }, [open, channelName, userId, roomUrl, startCall, onRoomCreated]);

  // Attach local video
  useEffect(() => {
    if (callStatus === 'connected' && localVideoRef.current) {
      attachLocalVideo(localVideoRef.current);
    }
  }, [callStatus, attachLocalVideo]);

  // Attach remote video when participant joins
  useEffect(() => {
    if (remoteParticipants.length > 0 && remoteVideoRef.current) {
      attachRemoteVideo(remoteVideoRef.current);
    }
  }, [remoteParticipants, attachRemoteVideo]);

  // Handle closing
  const handleClose = async () => {
    const duration = callDuration;
    await endCall();
    onOpenChange(false, duration);
  };

  const hasRemoteVideo = remoteParticipants.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-black border-0 max-h-[90vh]" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Video call with {remoteUserName}</DialogTitle>
        </VisuallyHidden>
        <div className="relative flex flex-col h-[600px]">
          {/* Main Video Area */}
          <div className="flex-1 relative bg-muted">
            {/* Remote User Video or Avatar */}
            {hasRemoteVideo ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
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
              className={cn(
                'absolute bottom-20 right-4 w-32 h-44 bg-muted rounded-lg overflow-hidden shadow-lg border-2 border-background',
                !isVideoEnabled && 'flex items-center justify-center'
              )}
            >
              {isVideoEnabled ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <VideoOff className="h-5 w-5 text-muted-foreground" />
                  </div>
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
