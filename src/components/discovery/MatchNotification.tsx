import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tables } from '@/integrations/supabase/types';

interface MatchNotificationProps {
  open: boolean;
  onClose: () => void;
  onSendMessage: () => void;
  currentUserPhoto?: string | null;
  matchedProfile: Tables<'profiles'> | null;
}

export function MatchNotification({
  open,
  onClose,
  onSendMessage,
  currentUserPhoto,
  matchedProfile,
}: MatchNotificationProps) {
  if (!matchedProfile) return null;

  const matchedPhoto = matchedProfile.photos?.[0];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm"
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="flex flex-col items-center text-center max-w-sm w-full">
            {/* Animated title */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <h1 className="text-4xl font-bold mb-2">It's a Match!</h1>
              <p className="text-muted-foreground mb-8">
                You and {matchedProfile.display_name || 'Someone special'} liked each other
              </p>
            </motion.div>

            {/* Profile photos */}
            <div className="flex items-center justify-center mb-8">
              {/* Current user photo */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
                className="relative"
              >
                <div className="w-28 h-28 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted">
                  {currentUserPhoto ? (
                    <img
                      src={currentUserPhoto}
                      alt="You"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      ?
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Heart icon in the middle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 300 }}
                className="relative z-10 -mx-4"
              >
                <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                  <Heart className="h-6 w-6 text-background fill-background" />
                </div>
              </motion.div>

              {/* Matched user photo */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
                className="relative"
              >
                <div className="w-28 h-28 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted">
                  {matchedPhoto ? (
                    <img
                      src={matchedPhoto}
                      alt={matchedProfile.display_name || 'Match'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      {matchedProfile.display_name?.[0] || '?'}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Floating hearts animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    y: '100%', 
                    x: `${10 + i * 12}%`,
                    opacity: 0,
                    scale: 0.5 
                  }}
                  animate={{ 
                    y: '-20%', 
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1, 1, 0.8]
                  }}
                  transition={{ 
                    delay: 0.8 + i * 0.15, 
                    duration: 2.5,
                    ease: 'easeOut'
                  }}
                  className="absolute"
                >
                  <Heart 
                    className="h-6 w-6 text-foreground/20" 
                    fill="currentColor"
                  />
                </motion.div>
              ))}
            </div>

            {/* Action buttons */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col gap-3 w-full"
            >
              <Button
                size="lg"
                className="w-full h-14 text-lg bg-foreground text-background hover:bg-foreground/90"
                onClick={onSendMessage}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Send a Message
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full h-14 text-lg"
                onClick={onClose}
              >
                Keep Swiping
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
