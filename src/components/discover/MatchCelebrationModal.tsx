import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Fish, Send, RefreshCw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

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

  // Trigger confetti when modal opens
  useEffect(() => {
    if (open && matchProfile) {
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#0EA5E9', '#F97316', '#EC4899', '#8B5CF6'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#0EA5E9', '#F97316', '#EC4899', '#8B5CF6'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
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
      <DialogContent className="sm:max-w-md p-0 gap-0 border-0 bg-gradient-to-b from-background to-accent/30 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none z-10"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col items-center text-center px-8 py-10">
          {/* Fish hook icon */}
          <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mb-4">
            <Fish className="h-8 w-8 text-sky-500" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold mb-1">It's a Catch!</h2>
          <p className="text-muted-foreground mb-6">
            You and {matchProfile.name} matched!
          </p>

          {/* Profile photos */}
          <div className="relative flex items-center justify-center mb-6">
            {/* Your photo */}
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={currentUserPhoto} alt="You" className="object-cover" />
                <AvatarFallback className="text-xl bg-muted">You</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium bg-background px-2 rounded">
                You
              </span>
            </div>

            {/* Heart connector */}
            <div className="absolute left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-pink-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>

            {/* Match photo */}
            <div className="relative -ml-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-sky-400 shadow-lg">
                  <AvatarImage src={matchProfile.photo} alt={matchProfile.name} className="object-cover" />
                  <AvatarFallback className="text-xl">{matchProfile.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {/* Compatibility badge */}
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-pink-500 px-2 py-0.5 rounded-full">
                  {compatibilityScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Match info */}
          <h3 className="text-xl font-bold mb-1">
            {matchProfile.name}{matchProfile.age ? `, ${matchProfile.age}` : ''}
          </h3>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            {matchProfile.distance && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-sky-500" />
                {matchProfile.distance}
              </span>
            )}
            {matchProfile.fishingType && (
              <span className="flex items-center gap-1">
                <Fish className="h-3.5 w-3.5 text-sky-500" />
                {matchProfile.fishingType}
              </span>
            )}
          </div>

          {/* Bio */}
          {matchProfile.bio && (
            <p className="text-sm text-muted-foreground italic mb-6 max-w-xs">
              "{matchProfile.bio}"
            </p>
          )}

          {/* Actions */}
          <div className="w-full space-y-3">
            <Button 
              onClick={handleSendMessage} 
              className="w-full bg-sky-500 hover:bg-sky-600 text-white h-12 text-base font-medium"
            >
              <Send className="h-4 w-4 mr-2" />
              Send a Message
            </Button>
            <Button 
              onClick={handleKeepFishing} 
              variant="outline" 
              className="w-full h-12 text-base font-medium"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Keep Fishing
            </Button>
          </div>
        </div>

        {/* Bottom gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-pink-400 to-orange-400" />
      </DialogContent>
    </Dialog>
  );
}
