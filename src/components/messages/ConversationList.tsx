import { useState } from 'react';
import { Search, SquarePen, Fish } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SwipeableConversationItem } from './SwipeableConversationItem';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { VerificationBadge } from '@/components/ui/verification-badge';

interface Conversation {
  id: string;
  name: string;
  photo: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  isOnline?: boolean;
  isRead?: boolean;
  lastSeen?: string;
  type?: 'date' | 'buddy';
  idVerified?: boolean;
  liveVerified?: boolean;
}

interface NewBite {
  id: string;
  name: string;
  photo: string;
  isNew?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  newBites?: NewBite[];
}

type FilterType = 'all' | 'unread' | 'dates' | 'buddies';

export function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect,
  onMarkRead,
  onDelete,
  newBites = [],
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const isMobile = useIsMobile();

  const filteredConversations = conversations.filter((convo) => {
    const matchesSearch = convo.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === 'unread') {
      return matchesSearch && (convo.unreadCount ?? 0) > 0;
    }
    if (activeFilter === 'dates') {
      return matchesSearch && convo.type !== 'buddy';
    }
    if (activeFilter === 'buddies') {
      return matchesSearch && convo.type === 'buddy';
    }
    return matchesSearch;
  });

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full border-r border-border bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Messages</h2>
          <Button variant="ghost" size="icon" className="text-primary">
            <SquarePen className="h-5 w-5" />
          </Button>
        </div>

        {/* New Bites Section */}
        {newBites.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Fish className="h-4 w-4" />
              New Bites
            </h3>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                {newBites.map((bite) => (
                  <button
                    key={bite.id}
                    onClick={() => onSelect(bite.id)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className="relative">
                      <Avatar className="h-14 w-14 ring-2 ring-primary ring-offset-2 ring-offset-background transition-transform group-hover:scale-105">
                        <AvatarImage src={bite.photo} alt={bite.name} />
                        <AvatarFallback>{bite.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {bite.isNew && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-[10px] text-primary-foreground font-bold">!</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                      {bite.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search matches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all' as FilterType, label: 'All' },
            { key: 'unread' as FilterType, label: 'Unread' },
            { key: 'dates' as FilterType, label: 'Dating' },
            { key: 'buddies' as FilterType, label: 'Fishing' },
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                'text-xs',
                activeFilter === filter.key
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : 'border-border hover:bg-accent'
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((convo) => (
          isMobile ? (
            <SwipeableConversationItem
              key={convo.id}
              conversation={convo}
              isSelected={selectedId === convo.id}
              onSelect={() => onSelect(convo.id)}
              onMarkRead={onMarkRead ? () => onMarkRead(convo.id) : undefined}
              onDelete={onDelete ? () => onDelete(convo.id) : undefined}
            />
          ) : (
            <button
              key={convo.id}
              onClick={() => onSelect(convo.id)}
              className={cn(
                'w-full flex items-center gap-3 p-4 text-left transition-colors border-l-2',
                selectedId === convo.id
                  ? 'bg-accent/50 border-l-primary'
                  : 'border-l-transparent hover:bg-accent/30'
              )}
            >
              {/* Avatar with status indicator */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={convo.photo} alt={convo.name} />
                  <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                  convo.isOnline ? "bg-green-500" : 
                  convo.lastSeen === 'Active now' ? "bg-yellow-500" :
                  "bg-muted-foreground/30"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm flex items-center gap-1">
                      {convo.name}
                      <VerificationBadge 
                        idVerified={convo.idVerified} 
                        liveVerified={convo.liveVerified} 
                        size="sm" 
                      />
                    </span>
                    {convo.type === 'buddy' ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/50">
                        <Fish className="h-2.5 w-2.5 mr-0.5" />
                        BUDDY
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-pink-400/50 text-pink-600">
                        💕 DATE
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-primary">{convo.time}</span>
                </div>
                {!convo.isOnline && convo.lastSeen && (
                  <p className={cn(
                    "text-xs mb-0.5",
                    convo.lastSeen === 'Active now' ? "text-yellow-600" : "text-muted-foreground"
                  )}>{convo.lastSeen}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate pr-2">
                    {convo.lastMessage}
                  </p>
                  {convo.unreadCount && convo.unreadCount > 0 ? (
                    <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-[20px] flex items-center justify-center">
                      {convo.unreadCount}
                    </Badge>
                  ) : convo.isRead ? (
                    <span className="text-sm flex-shrink-0" title="Read">🎣</span>
                  ) : (
                    <span className="text-muted-foreground text-xs flex-shrink-0">Sent</span>
                  )}
                </div>
              </div>
            </button>
          )
        ))}
      </div>
    </aside>
  );
}