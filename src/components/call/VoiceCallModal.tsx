import { useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CallControls } from './CallControls';
import { useDailyCall } from '@/hooks/use-daily-call';
import { Loader2, X, UserPlus, Lock } from 'lucide-react';
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
  } = useDailyCall();

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

  // Handle minimize (same as close for now)
  const handleMinimize = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-background flex flex-col px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between py-4 pt-safe">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMinimize}
            className="h-10 w-10 rounded-full bg-muted hover:bg-muted/80 text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-foreground font-medium text-lg">{remoteUserName}</h2>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              End-to-end encrypted
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-muted hover:bg-muted/80 text-foreground"
          >
            <UserPlus className="h-5 w-5" />
          </Button>
        </div>

        {/* Center Avatar Section */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            {/* Pulse animation when calling */}
            <AnimatePresence>
              {callStatus === 'connecting' && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20"
                    initial={{ scale: 1, opacity: 0.3 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20"
                    initial={{ scale: 1, opacity: 0.3 }}
                    animate={{ scale: 1.3, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  />
                </>
              )}
            </AnimatePresence>

            <Avatar className={cn(
              'h-48 w-48 ring-[6px] transition-all',
              callStatus === 'connected' ? 'ring-primary/40' : 'ring-border'
            )}>
              <AvatarImage src={remoteUserPhoto} alt={remoteUserName} />
              <AvatarFallback className="text-6xl bg-muted text-foreground">
                {remoteUserName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Call Status */}
          <div className="text-center">
            {callStatus === 'connected' && (
              <motion.p
                className="text-2xl text-foreground font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {formattedDuration}
              </motion.p>
            )}
            {callStatus === 'connecting' && (
              <div className="flex items-center gap-2 justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Calling...</span>
              </div>
            )}
            {callStatus === 'ended' && (
              <p className="text-muted-foreground">Call ended</p>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="pb-8 pb-safe">
          <CallControls
            isMuted={isMuted}
            isVideoEnabled={false}
            showVideoToggle={true}
            onToggleMute={toggleMute}
            onEndCall={handleClose}
            variant="whatsapp"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
