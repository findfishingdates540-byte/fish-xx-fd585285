import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
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
  // Play ringtone when call comes in using Web Audio API (clean sound, no clicking)
  useEffect(() => {
    if (!call) return;
    
    let audioContext: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;
    let gainNode: GainNode | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    const playRingTone = () => {
      try {
        audioContext = new AudioContext();
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

        oscillator.start();

        // Create ring pattern: ring for 1s, pause for 2s
        let ringing = true;
        intervalId = setInterval(() => {
          if (gainNode && audioContext) {
            ringing = !ringing;
            gainNode.gain.setValueAtTime(ringing ? 0.3 : 0, audioContext.currentTime);
          }
        }, 1000);
      } catch (e) {
        console.log('Could not play ringtone:', e);
      }
    };

    playRingTone();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (oscillator) {
        try { oscillator.stop(); } catch {}
      }
      if (audioContext) {
        try { audioContext.close(); } catch {}
      }
    };
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
              className="absolute inset-0 rounded-full bg-emerald-500/30"
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
              className="absolute inset-0 rounded-full bg-emerald-500/30"
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
            <Avatar className="h-32 w-32 ring-4 ring-emerald-500/50 relative z-10">
              <AvatarImage src={callerPhoto} alt={callerName} />
              <AvatarFallback className="text-4xl bg-emerald-500/20 text-white">
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
                className="h-16 w-16 rounded-full shadow-lg"
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
                  'bg-emerald-500 hover:bg-emerald-600'
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
