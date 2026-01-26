import { useMemo, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessagesHeader } from '@/components/messages/MessagesHeader';
import { useOnlineStatus, formatLastSeen } from '@/hooks/use-online-presence';
import { useDatingConversations } from '@/hooks/use-dating-conversations';
import { useMatches } from '@/hooks/use-matches';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { NewMatchesRow } from '@/components/messages/NewMatchesRow';
import { EmptyMessagesState } from '@/components/messages/EmptyMessagesState';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { matchId } = useParams();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch pending likes count (people who liked you but you haven't responded)
  const { data: likesCount = 0 } = useQuery({
    queryKey: ['pending-likes-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('user2_id', user.id)
        .eq('user1_liked', true)
        .eq('user2_liked', false)
        .eq('is_match', false);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Real-time subscription for likes count updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('messages-likes-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `user2_id=eq.${user.id}`,
        },
        () => {
          // Invalidate likes count when matches involving this user change
          queryClient.invalidateQueries({ queryKey: ['pending-likes-count', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Fetch real conversations
  const { conversations, isLoading, totalUnread } = useDatingConversations();
  
  // Fetch all matches with proper profile data for the NewMatchesRow
  const { matches: allMatches } = useMatches();

  // Get all conversation user IDs for online status tracking
  const conversationUserIds = useMemo(() => conversations.map(c => c.matchedUserId), [conversations]);
  const { isOnline, getLastSeen } = useOnlineStatus(conversationUserIds);

  // Update conversations with real online status
  const conversationsWithStatus = useMemo(() => 
    conversations.map(convo => ({
      id: convo.id,
      matchedUserId: convo.matchedUserId,
      name: convo.name,
      photo: convo.photo,
      lastMessage: convo.lastMessage || '',
      time: convo.time,
      unreadCount: convo.unreadCount,
      isOnline: isOnline(convo.matchedUserId),
      lastSeen: !isOnline(convo.matchedUserId) ? formatLastSeen(getLastSeen(convo.matchedUserId)) : undefined,
      type: 'date' as const,
    })), [conversations, isOnline, getLastSeen]);

  // Get conversation match IDs that have messages
  const conversationMatchIds = useMemo(() => 
    new Set(conversationsWithStatus.filter(c => c.lastMessage).map(c => c.id)),
    [conversationsWithStatus]
  );

  // New matches - matches from useMatches that don't have messages yet
  const newMatches = useMemo(() => 
    allMatches
      .filter(m => !conversationMatchIds.has(m.matchId))
      .slice(0, 6)
      .map(m => ({ id: m.matchId, name: m.name, photo: m.photo, isNew: m.isNew })),
    [allMatches, conversationMatchIds]);

  // Conversations with messages (for list below), filtered by search
  const activeConversations = useMemo(() => 
    conversationsWithStatus
      .filter(c => c.lastMessage)
      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [conversationsWithStatus, searchQuery]);

  const handleSelectConversation = (id: string) => {
    navigate(`/app/messages/${id}`);
  };

  // Loading state
  const renderLoading = () => (
    <div className="flex-1 p-4 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );

  // Empty chat panel for desktop when no conversation is selected
  const renderEmptyChatPanel = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-muted/30">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        Choose a match from the list to start chatting
      </p>
    </div>
  );

  // Dark themed conversation list
  const DarkConversationList = () => (
    <div className="flex-1 overflow-y-auto">
      {activeConversations.length === 0 && newMatches.length === 0 ? (
        <EmptyMessagesState />
      ) : activeConversations.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-muted-foreground text-sm">
            No messages yet. Send a message to one of your matches above!
          </p>
        </div>
      ) : (
        activeConversations.map((convo) => (
          <button
            key={convo.id}
            onClick={() => handleSelectConversation(convo.id)}
            className={cn(
              'w-full flex items-center gap-3 p-4 text-left transition-colors',
              matchId === convo.id
                ? 'bg-accent'
                : 'hover:bg-accent/50'
            )}
          >
            {/* Avatar with online status */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-14 w-14">
                <AvatarImage src={convo.photo} alt={convo.name} />
                <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {convo.isOnline && (
                <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{convo.name}</span>
                <span className="text-xs text-muted-foreground">{convo.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className={cn(
                  "text-sm truncate pr-2",
                  convo.unreadCount && convo.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {convo.lastMessage}
                </p>
                {convo.unreadCount > 0 && (
                  <div className="flex-shrink-0 h-5 min-w-[20px] bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground px-1.5">
                      {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );

  // Conversation list panel (left side)
  const ConversationListPanel = () => (
    <div className={`${isMobile && matchId ? 'hidden' : 'flex'} flex-col w-full lg:w-96 lg:border-r border-border bg-background h-full`}>
      {/* Search Header */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${conversations.length} Matches`}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* New Matches Row - Always visible */}
      <div className="border-b border-border">
        <NewMatchesRow
          matches={newMatches}
          likesCount={likesCount}
          onSelect={handleSelectConversation}
        />
      </div>
      
      {/* Content */}
      {isLoading ? renderLoading() : <DarkConversationList />}
    </div>
  );

  // Right panel with header
  const RightPanel = () => (
    <div className="flex-1 hidden lg:flex flex-col h-full bg-background">
      {/* Header with navigation */}
      <MessagesHeader
        userName={profile?.display_name || 'User'}
        userPhoto={profile?.photos?.[0]}
        notificationCount={totalUnread}
        accountMode={profile?.account_mode || 'dating'}
      />
      
      {/* Content area */}
      {matchId ? (
        <Outlet context={{ isInline: true }} />
      ) : (
        renderEmptyChatPanel()
      )}
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Conversation List Panel (Left) */}
      <ConversationListPanel />
      
      {/* Right Panel with Header */}
      {!isMobile ? (
        <RightPanel />
      ) : (
        matchId && <Outlet context={{ isInline: false }} />
      )}
    </div>
  );
}
