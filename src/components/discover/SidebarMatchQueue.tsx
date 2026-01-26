import { Lock, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface PendingLike {
  id: string;
  name: string;
  photo: string;
}

interface MatchQueueProps {
  pendingLikes: PendingLike[];
  newMatches: {
    id: string;
    name: string;
    photo: string;
    isOnline?: boolean;
  }[];
  isPremium?: boolean;
  onMatchClick?: (matchId: string) => void;
}

export function SidebarMatchQueue({
  pendingLikes,
  newMatches,
  isPremium,
  onMatchClick,
}: MatchQueueProps) {
  const navigate = useNavigate();
  const likesCount = pendingLikes.length;

  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Match Queue
        </h3>
        <button 
          onClick={() => navigate('/app/matches')}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {/* Likes Count Card - First in queue */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => (isPremium ? navigate('/app/likes') : navigate('/pricing'))}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
        >
          <div className="relative">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center ring-2 ring-amber-400/40 ring-offset-2 ring-offset-background">
              {isPremium ? (
                <span className="text-lg font-bold text-white">{likesCount}</span>
              ) : (
                <>
                  <span className="text-lg font-bold text-white blur-[2px]">{likesCount}</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-white drop-shadow-md" />
                  </div>
                </>
              )}
            </div>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">Likes</span>
        </motion.button>

        {/* Match Avatars */}
        {newMatches.slice(0, 6).map((match, idx) => (
          <motion.button
            key={match.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onMatchClick?.(match.id)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
          >
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-border ring-offset-2 ring-offset-background transition-transform group-hover:scale-105">
                <AvatarImage src={match.photo} alt={match.name} />
                <AvatarFallback>{match.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {match.isOnline && (
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            <span className="text-[10px] font-medium truncate max-w-[56px] text-muted-foreground group-hover:text-foreground">
              {match.name.split(' ')[0]}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
