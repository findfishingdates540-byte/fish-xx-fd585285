import { Diamond } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NewMatch {
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
}

interface RightSidebarProps {
  newMatches: NewMatch[];
  newMatchCount?: number;
  conversations: Conversation[];
  isPremium?: boolean;
}

export function RightSidebar({
  newMatches,
  newMatchCount = 0,
  conversations,
  isPremium,
}: RightSidebarProps) {
  return (
    <aside className="hidden xl:flex flex-col w-72 h-screen border-l border-border bg-background p-6">
      {/* Today's Catch */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Today's Catch</h3>
          {newMatchCount > 0 && (
            <Badge className="bg-foreground text-background text-xs px-2">
              {newMatchCount} New
            </Badge>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {newMatches.map((match) => (
            <div key={match.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <Avatar className="h-14 w-14 ring-2 ring-foreground ring-offset-2">
                <AvatarImage src={match.photo} alt={match.name} />
                <AvatarFallback>{match.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{match.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-hidden">
        <h3 className="font-bold text-xs text-muted-foreground tracking-wider mb-4">
          CONVERSATIONS
        </h3>

        <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-400px)]">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors text-left"
            >
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={convo.photo} alt={convo.name} />
                <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{convo.name}</span>
                  <span className="text-xs text-muted-foreground">{convo.time}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Premium CTA */}
      {!isPremium && (
        <div className="mt-6 p-4 bg-accent rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center flex-shrink-0">
              <Diamond className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Go Premium</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                See who likes you & unlimited rewinds.
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
