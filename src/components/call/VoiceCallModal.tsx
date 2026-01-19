import { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CallControls } from './CallControls';
import { useAgoraCall } from '@/hooks/use-agora-call';
import { Loader2, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelName: string;
  userId: string;
  remoteUserName: string;
  remoteUserPhoto?: string;
}

export function VoiceCallModal({
  open,
  onOpenChange,
  channelName,
  userId,
  remoteUserName,
  remoteUserPhoto,
}: VoiceCallModalProps) {
  const {
    callStatus,
    isMuted,
    formattedDuration,
    startCall,
    endCall,
    toggleMute,
  } = useAgoraCall();

  // Start call when modal opens
  useEffect(() => {
    if (open && callStatus === 'idle') {
      startCall(channelName, 'voice', userId);
    }
  }, [open, callStatus, channelName, userId, startCall]);

  // Handle closing
  const handleClose = async () => {
    await endCall();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-gradient-to-b from-background to-muted border-0">
        <div className="flex flex-col items-center justify-between min-h-[500px] p-8">
          {/* Call Status */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">
              {callStatus === 'connecting' ? 'Calling...' : 
               callStatus === 'connected' ? 'Voice Call' :
               callStatus === 'ended' ? 'Call Ended' : 'Connecting...'}
            </p>
          </div>

          {/* User Avatar with Animation */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              {/* Pulse animation when calling */}
              <AnimatePresence>
                {callStatus === 'connecting' && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    />
                  </>
                )}
              </AnimatePresence>

              <Avatar className={cn(
                'h-36 w-36 ring-4 transition-all',
                callStatus === 'connected' ? 'ring-green-500/50' : 'ring-primary/20'
              )}>
                <AvatarImage src={remoteUserPhoto} alt={remoteUserName} />
                <AvatarFallback className="text-5xl bg-primary/10">
                  {remoteUserName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Status indicator */}
              {callStatus === 'connected' && (
                <motion.div
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <Phone className="h-4 w-4 text-white" />
                </motion.div>
              )}
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-semibold">{remoteUserName}</h2>
              {callStatus === 'connected' && (
                <motion.p
                  className="text-lg text-primary font-mono mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {formattedDuration}
                </motion.p>
              )}
              {callStatus === 'connecting' && (
                <div className="flex items-center gap-2 justify-center mt-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connecting...</span>
                </div>
              )}
            </div>
          </div>

          {/* Call Controls */}
          <CallControls
            isMuted={isMuted}
            isVideoEnabled={false}
            showVideoToggle={false}
            onToggleMute={toggleMute}
            onEndCall={handleClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
