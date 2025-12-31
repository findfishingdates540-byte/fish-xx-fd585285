import { Diamond, Lock, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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

interface Conversation {
  id: string;
  name: string;
  photo: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  isOnline?: boolean;
  lastActiveAt?: string | null;
}

// Helper function to format last seen timestamp
function formatLastSeen(timestamp: string | null, isOnline?: boolean): string {
  if (isOnline) return 'Active now';
  if (!timestamp) return '';
  
  const lastSeen = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 5) return 'Active now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return lastSeen.toLocaleDateString();
}

interface RightSidebarProps {
  newMatches: NewMatch[];
  newMatchCount?: number;
  pendingLikes?: PendingLike[];
  conversations: Conversation[];
  isPremium?: boolean;
  accountMode?: 'dating' | 'fishing' | 'both';
  onMatchClick?: (matchId: string) => void;
  onConversationClick?: (matchId: string) => void;
}

export function RightSidebar({
  newMatches,
  newMatchCount = 0,
  pendingLikes = [],
  conversations,
  isPremium,
  accountMode = 'both',
  onMatchClick,
  onConversationClick,
}: RightSidebarProps) {
  const navigate = useNavigate();

  const hasUnread = conversations.some((c) => (c.unreadCount || 0) > 0);

  return (
    <aside data-tutorial="matches-sidebar" className="hidden xl:flex flex-col w-72 h-screen border-l border-border bg-background p-6">
      {/* Who Likes You */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Who Likes You
            {pendingLikes.length > 0 && (
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            )}
          </h3>
          <Badge className="bg-primary text-primary-foreground text-xs px-2">
            {pendingLikes.length}
          </Badge>
        </div>

        {pendingLikes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No likes yet</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 px-1">
            {pendingLikes.slice(0, 5).map((like) => (
              <button
                key={like.id}
                onClick={() => (isPremium ? navigate('/app/likes') : navigate('/pricing'))}
                className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[56px] group"
              >
                <div className="relative">
                  <Avatar
                    className={`h-14 w-14 ring-2 ring-primary/50 ring-offset-2 ring-offset-background ${
                      !isPremium ? 'blur-[6px]' : ''
                    }`}
                  >
                    <AvatarImage src={like.photo} alt={like.name} />
                    <AvatarFallback>{like.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {!isPremium && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full bg-primary/90 flex items-center justify-center">
                        <Lock className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium truncate max-w-[56px] ${!isPremium ? 'blur-sm' : ''}`}>
                  {isPremium ? like.name : '???'}
                </span>
              </button>
            ))}
          </div>
        )}

        {!isPremium && pendingLikes.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => navigate('/pricing')}
          >
            <Lock className="h-3.5 w-3.5 mr-2" />
            Unlock to see who likes you
          </Button>
        )}
      </div>

      {/* Today's Catch - Mutual Matches */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            Today's Catch
            {newMatchCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-foreground animate-pulse" aria-hidden="true" />
            )}
          </h3>
          {newMatchCount > 0 && (
            <Badge className="bg-foreground text-background text-xs px-2">
              {newMatchCount} New
            </Badge>
          )}
        </div>

        {newMatches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No new matches yet</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1">
            {newMatches.map((match) => (
              <button
                key={match.id}
                onClick={() => onMatchClick?.(match.id)}
                className="flex flex-col items-center gap-1 flex-shrink-0 hover:opacity-80 transition-opacity min-w-[60px]"
              >
                <div className="relative">
                  <Avatar className="h-14 w-14 ring-2 ring-foreground ring-offset-2 ring-offset-background">
                    <AvatarImage src={match.photo} alt={match.name} />
                    <AvatarFallback>{match.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {match.isOnline && (
                    <span className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>
                <span className="text-xs font-medium truncate max-w-[60px]">{match.name}</span>
                <span className={`text-[10px] ${match.isOnline ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {formatLastSeen(match.lastActiveAt || null, match.isOnline)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-hidden">
        <h3 className="font-bold text-xs text-muted-foreground tracking-wider mb-4 flex items-center gap-2">
          CONVERSATIONS
          {hasUnread && <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" aria-hidden="true" />}
        </h3>

        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No conversations yet</p>
        ) : (
          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-520px)]">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => onConversationClick?.(convo.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors text-left"
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={convo.photo} alt={convo.name} />
                    <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {convo.isOnline && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-background rounded-full" />
                  )}
                  {convo.unreadCount && convo.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${convo.unreadCount && convo.unreadCount > 0 ? 'font-bold' : 'font-semibold'}`}>
                        {convo.name}
                      </span>
                      <span className={`text-[10px] ${convo.isOnline ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {formatLastSeen(convo.lastActiveAt || null, convo.isOnline)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{convo.time}</span>
                  </div>
                  <p className={`text-sm truncate ${convo.unreadCount && convo.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {convo.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Premium CTA - Only show for fishing/both accounts */}
      {!isPremium && accountMode !== 'dating' && (
        <div className="mt-6 p-4 bg-accent rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center flex-shrink-0">
              <Diamond className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Go Premium</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Access premium fishing spots & features.</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
