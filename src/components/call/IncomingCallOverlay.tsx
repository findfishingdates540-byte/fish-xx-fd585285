import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CallSession } from '@/hooks/use-call-sessions';
import { cn } from '@/lib/utils';

interface IncomingCallOverlayProps {
  call: CallSession | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallOverlay({
  call,
  onAccept,
  onDecline,
}: IncomingCallOverlayProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play ringtone when call comes in
  useEffect(() => {
    if (call) {
      // Create and play ringtone
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp2djnZlYnB/j5+fnpF2Y1xndn6Ql5eWjXtpYGVxfIeMkI+KgHJpZ2x0fIaKjIqGfnNua25ze4GEhoaEfnhybGxxdnt/g4WFg397d3Jub3N4fH+Cg4OCf3t3c3Bwc3Z6fX+AgH99endzcHBzdnl8fn9/fnt4dXJwcXN2eXx9fn58enZzcXBxc3Z4e3x9fXt5dnRycHFzdXh6e3x8e3l2dHJxcXN1eHp7fHx7eXZ0cnFxc3V4ent8fHt5dnRycXFzdXh6e3x8e3l2dHJxcXN1eHp7fHx7eXZ0cnFxc3V4ent8fHt5dnRycXFzdXh6e3x8e3l2dHJxcXN1eHp7fHx7eXZ0cnFxc3V4ent8fHt5dnRycXFzdXh6e3x8e3l2dA==';
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Autoplay might be blocked
      });
      audioRef.current = audio;

      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, [call]);

  if (!call) return null;

  const callerName = call.caller?.display_name || 'Unknown';
  const callerPhoto = call.caller?.photos?.[0];
  const isVideoCall = call.call_type === 'video';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="flex flex-col items-center gap-8 p-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          {/* Call Type Indicator */}
          <div className="flex items-center gap-2 text-white/70">
            {isVideoCall ? (
              <Video className="h-5 w-5" />
            ) : (
              <Phone className="h-5 w-5" />
            )}
            <span className="text-sm uppercase tracking-wide">
              Incoming {isVideoCall ? 'Video' : 'Voice'} Call
            </span>
          </div>

          {/* Caller Avatar with Pulse Animation */}
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full bg-green-500/30"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-green-500/30"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
            <Avatar className="h-32 w-32 ring-4 ring-green-500/50 relative z-10">
              <AvatarImage src={callerPhoto} alt={callerName} />
              <AvatarFallback className="text-4xl bg-green-500/20 text-white">
                {callerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Caller Name */}
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-white">{callerName}</h2>
            <motion.p
              className="text-white/60 mt-2"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {isVideoCall ? 'Video calling you...' : 'Calling you...'}
            </motion.p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-8 mt-4">
            {/* Decline Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="destructive"
                size="lg"
                className="h-16 w-16 rounded-full shadow-lg shadow-red-500/30"
                onClick={onDecline}
              >
                <PhoneOff className="h-7 w-7" />
              </Button>
              <p className="text-center text-white/60 text-sm mt-2">Decline</p>
            </motion.div>

            {/* Accept Button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className={cn(
                  'h-16 w-16 rounded-full shadow-lg',
                  'bg-green-500 hover:bg-green-600 shadow-green-500/30'
                )}
                onClick={onAccept}
              >
                {isVideoCall ? (
                  <Video className="h-7 w-7" />
                ) : (
                  <Phone className="h-7 w-7" />
                )}
              </Button>
              <p className="text-center text-white/60 text-sm mt-2">Accept</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
