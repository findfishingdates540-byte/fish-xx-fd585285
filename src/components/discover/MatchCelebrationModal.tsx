import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Fish, Send, RefreshCw, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchProfile {
  id: string;
  matchId: string;
  name: string;
  age: number | null;
  photo: string;
  distance?: string;
  fishingType?: string;
  bio?: string;
}

interface MatchCelebrationModalProps {
  open: boolean;
  onClose: () => void;
  matchProfile: MatchProfile | null;
  currentUserPhoto?: string;
  compatibilityScore?: number;
}

export function MatchCelebrationModal({
  open,
  onClose,
  matchProfile,
  currentUserPhoto,
  compatibilityScore = 96,
}: MatchCelebrationModalProps) {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Staggered animation sequence when modal opens
  useEffect(() => {
    if (open && matchProfile) {
      setShowContent(false);
      setShowPhotos(false);
      setShowActions(false);

      // Trigger confetti burst
      const launchConfetti = () => {
        // Center burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#0EA5E9', '#F97316', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B'],
          startVelocity: 30,
          gravity: 0.8,
          scalar: 1.2,
        });

        // Side bursts
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.65 },
            colors: ['#0EA5E9', '#EC4899', '#F97316'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.65 },
            colors: ['#0EA5E9', '#EC4899', '#F97316'],
          });
        }, 200);

        // Final sparkle burst
        setTimeout(() => {
          confetti({
            particleCount: 30,
            spread: 360,
            origin: { x: 0.5, y: 0.4 },
            colors: ['#FFD700', '#FFF'],
            startVelocity: 20,
            gravity: 0.5,
            scalar: 0.8,
            ticks: 100,
          });
        }, 400);
      };

      launchConfetti();

      // Staggered content reveal
      const timer1 = setTimeout(() => setShowContent(true), 100);
      const timer2 = setTimeout(() => setShowPhotos(true), 300);
      const timer3 = setTimeout(() => setShowActions(true), 600);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [open, matchProfile]);

  const handleSendMessage = () => {
    if (matchProfile?.matchId) {
      navigate(`/app/messages/${matchProfile.matchId}`);
      onClose();
    }
  };

  const handleKeepFishing = () => {
    onClose();
  };

  if (!matchProfile) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 border-0 overflow-hidden bg-gradient-to-b from-sky-50 via-white to-pink-50 dark:from-sky-950/50 dark:via-background dark:to-pink-950/50">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-20 -left-20 w-40 h-40 bg-sky-400/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute -bottom-20 -right-20 w-40 h-40 bg-pink-400/20 rounded-full blur-3xl"
          />
        </div>

        {/* Close button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 bg-black/10 hover:bg-black/20 transition-colors z-10"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </motion.button>

        <div className="flex flex-col items-center text-center px-8 py-10 relative z-10">
          {/* Animated fish hook icon */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-sky-400/30">
                  <Fish className="h-10 w-10 text-white" />
                </div>
                {/* Sparkle effects */}
                <motion.div
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                </motion.div>
                <motion.div
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                  className="absolute -bottom-1 -left-1"
                >
                  <Sparkles className="h-4 w-4 text-pink-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title with bounce animation */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 150, damping: 12 }}
              >
                <motion.h2
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 0.6,
                    times: [0, 0.5, 1],
                  }}
                  className="text-4xl font-bold mb-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-pink-500 bg-clip-text text-transparent"
                >
                  It's a Catch!
                </motion.h2>
                <p className="text-muted-foreground mb-6">
                  You and <span className="font-semibold text-foreground">{matchProfile.name}</span> matched!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile photos with animation */}
          <AnimatePresence>
            {showPhotos && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative flex items-center justify-center mb-6"
              >
                {/* Your photo */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 150 }}
                  className="relative"
                >
                  <div className="relative">
                    <motion.div
                      animate={{
                        boxShadow: [
                          "0 0 0 0 rgba(14, 165, 233, 0.4)",
                          "0 0 0 10px rgba(14, 165, 233, 0)",
                          "0 0 0 0 rgba(14, 165, 233, 0)",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="rounded-full"
                    >
                      <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                        <AvatarImage src={currentUserPhoto} alt="You" className="object-cover" />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-sky-100 to-cyan-100">You</AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium bg-white dark:bg-background px-3 py-0.5 rounded-full shadow-sm">
                      You
                    </span>
                  </div>
                </motion.div>

                {/* Heart connector with pulse */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                  className="absolute left-1/2 -translate-x-1/2 z-10"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-400/40"
                  >
                    <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </motion.div>
                </motion.div>

                {/* Match photo */}
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 150 }}
                  className="relative -ml-6"
                >
                  <div className="relative">
                    <motion.div
                      animate={{
                        boxShadow: [
                          "0 0 0 0 rgba(236, 72, 153, 0.4)",
                          "0 0 0 10px rgba(236, 72, 153, 0)",
                          "0 0 0 0 rgba(236, 72, 153, 0)",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.5,
                      }}
                      className="rounded-full"
                    >
                      <Avatar className="h-28 w-28 border-4 border-pink-400 shadow-xl">
                        <AvatarImage src={matchProfile.photo} alt={matchProfile.name} className="object-cover" />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-pink-100 to-rose-100">{matchProfile.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </motion.div>
                    {/* Compatibility badge */}
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 400 }}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1 rounded-full shadow-lg"
                    >
                      {compatibilityScore}% Match
                    </motion.span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Match info */}
          <AnimatePresence>
            {showPhotos && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-2xl font-bold mb-1">
                  {matchProfile.name}{matchProfile.age ? `, ${matchProfile.age}` : ''}
                </h3>
                
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
                  {matchProfile.distance && (
                    <span className="flex items-center gap-1.5 bg-sky-100 dark:bg-sky-900/30 px-3 py-1 rounded-full">
                      <MapPin className="h-3.5 w-3.5 text-sky-500" />
                      {matchProfile.distance}
                    </span>
                  )}
                  {matchProfile.fishingType && (
                    <span className="flex items-center gap-1.5 bg-cyan-100 dark:bg-cyan-900/30 px-3 py-1 rounded-full">
                      <Fish className="h-3.5 w-3.5 text-cyan-500" />
                      {matchProfile.fishingType}
                    </span>
                  )}
                </div>

                {/* Bio */}
                {matchProfile.bio && (
                  <p className="text-sm text-muted-foreground italic mb-6 max-w-xs bg-muted/50 px-4 py-2 rounded-lg">
                    "{matchProfile.bio}"
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions with staggered animation */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 150 }}
                className="w-full space-y-3"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    onClick={handleSendMessage} 
                    className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white h-14 text-base font-semibold shadow-lg shadow-sky-400/30 border-0"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send a Message
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    onClick={handleKeepFishing} 
                    variant="outline" 
                    className="w-full h-14 text-base font-semibold border-2 hover:bg-muted/50"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Keep Fishing
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Animated bottom gradient bar */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="h-2 w-full bg-gradient-to-r from-sky-400 via-pink-400 to-orange-400 origin-left"
        />
      </DialogContent>
    </Dialog>
  );
}
