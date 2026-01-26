import { Lock, Heart, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NewMatch {
  id: string;
  name: string;
  photo: string;
  isOnline?: boolean;
  lastActiveAt?: string | null;
}

interface PendingLike {
  id: string;
  name: string;
  photo: string;
}

interface RightSidebarProps {
  newMatches: NewMatch[];
  newMatchCount?: number;
  pendingLikes?: PendingLike[];
  conversations: any[];
  isPremium?: boolean;
  accountMode?: 'dating' | 'fishing' | 'both';
  onMatchClick?: (matchId: string) => void;
  onConversationClick?: (matchId: string) => void;
}

export function RightSidebar({
  newMatches,
  newMatchCount = 0,
  pendingLikes = [],
  isPremium,
  onMatchClick,
}: RightSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside data-tutorial="matches-sidebar" className="hidden xl:flex flex-col w-72 h-screen border-l border-border bg-background p-5">
      {/* Who Likes You - Prominent section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary fill-primary" />
            Who Likes You
          </h3>
          {pendingLikes.length > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs font-bold">
              {pendingLikes.length}
            </Badge>
          )}
        </div>

        {pendingLikes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No likes yet — keep swiping!</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {pendingLikes.slice(0, 5).map((like, idx) => (
              <motion.button
                key={like.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => (isPremium ? navigate('/app/likes') : navigate('/pricing'))}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-[60px] group"
              >
                <div className="relative">
                  <Avatar
                    className={`h-14 w-14 ring-2 ring-primary/40 ring-offset-2 ring-offset-background transition-transform group-hover:scale-105 ${
                      !isPremium ? 'blur-[6px]' : ''
                    }`}
                  >
                    <AvatarImage src={like.photo} alt={like.name} />
                    <AvatarFallback>{like.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {!isPremium && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <Lock className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium truncate max-w-[60px] ${!isPremium ? 'blur-sm' : ''}`}>
                  {isPremium ? like.name : '???'}
                </span>
              </motion.button>
            ))}
          </div>
        )}

        {!isPremium && pendingLikes.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => navigate('/pricing')}
          >
            <Lock className="h-3.5 w-3.5 mr-2" />
            Unlock likes
          </Button>
        )}
      </div>

      {/* Matches Section */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base">Matches</h3>
          {newMatchCount > 0 && (
            <Badge className="bg-foreground text-background text-xs font-bold">
              {newMatchCount}
            </Badge>
          )}
        </div>

        {newMatches.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No matches yet</p>
            <p className="text-xs text-muted-foreground mt-1">Keep swiping to find your catch!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {newMatches.slice(0, 6).map((match, idx) => (
              <motion.button
                key={match.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onMatchClick?.(match.id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent transition-all group"
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-1 ring-border transition-transform group-hover:scale-105">
                    <AvatarImage src={match.photo} alt={match.name} />
                    <AvatarFallback>{match.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {match.isOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="text-sm font-semibold block truncate">{match.name}</span>
                  <span className={`text-xs ${match.isOnline ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {match.isOnline ? 'Active now' : 'Tap to chat'}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </div>
        )}

        {newMatches.length > 6 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-muted-foreground"
            onClick={() => navigate('/app/messages')}
          >
            See all matches
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </aside>
  );
}
