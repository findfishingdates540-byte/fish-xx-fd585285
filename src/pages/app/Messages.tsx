import { useMemo } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessagesHeader } from '@/components/messages/MessagesHeader';
import { ConversationList } from '@/components/messages/ConversationList';
import { useOnlineStatus, formatLastSeen } from '@/hooks/use-online-presence';
import { useDatingConversations } from '@/hooks/use-dating-conversations';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { matchId } = useParams();
  const isMobile = useIsMobile();

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

  // Fetch real conversations
  const { conversations, isLoading, totalUnread } = useDatingConversations();

  // Get all conversation user IDs for online status tracking
  const conversationUserIds = useMemo(() => conversations.map(c => c.matchedUserId), [conversations]);
  const { isOnline, getLastSeen } = useOnlineStatus(conversationUserIds);

  // Update conversations with real online status
  const conversationsWithStatus = useMemo(() => 
    conversations.map(convo => ({
      id: convo.id,
      name: convo.name,
      photo: convo.photo,
      lastMessage: convo.lastMessage || 'No messages yet',
      time: convo.time,
      unreadCount: convo.unreadCount,
      isOnline: isOnline(convo.matchedUserId),
      lastSeen: !isOnline(convo.matchedUserId) ? formatLastSeen(getLastSeen(convo.matchedUserId)) : undefined,
      type: 'date' as const,
    })), [conversations, isOnline, getLastSeen]);

  // New bites - recent matches without messages
  const newBites = useMemo(() => 
    conversations
      .filter(c => !c.lastMessage)
      .slice(0, 5)
      .map(c => ({ id: c.id, name: c.name, photo: c.photo, isNew: true })),
    [conversations]);

  const handleSelectConversation = (id: string) => {
    navigate(`/app/messages/${id}`);
  };

  // Loading state
  const renderLoading = () => (
    <div className="flex-1 p-4 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state for no matches
  const renderEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageCircle className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No conversations yet</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        Match with someone to start chatting! Head to Discover to find your perfect catch.
      </p>
      <Button asChild>
        <Link to="/app/discover">
          <Heart className="h-4 w-4 mr-2" />
          Start Discovering
        </Link>
      </Button>
    </div>
  );

  // Empty chat panel for desktop when no conversation is selected
  const renderEmptyChatPanel = () => (
    <div className="flex-1 hidden lg:flex flex-col items-center justify-center bg-muted/30">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageCircle className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        Choose a match from the list to start chatting
      </p>
    </div>
  );

  // Conversation list panel
  const ConversationListPanel = () => (
    <div className={`${isMobile && matchId ? 'hidden' : 'flex'} flex-col w-full lg:w-96 lg:border-r border-border bg-background h-full`}>
      {/* Header with navigation */}
      <MessagesHeader
        userName={profile?.display_name || 'User'}
        userPhoto={profile?.photos?.[0]}
        notificationCount={totalUnread}
        accountMode={profile?.account_mode || 'dating'}
      />
      
      {/* Content */}
      {isLoading ? (
        renderLoading()
      ) : conversations.length === 0 ? (
        renderEmptyState()
      ) : (
        <ConversationList
          conversations={conversationsWithStatus}
          selectedId={matchId}
          onSelect={handleSelectConversation}
          newBites={newBites}
        />
      )}
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden">
      {/* Conversation List Panel */}
      <ConversationListPanel />
      
      {/* Chat Area - Desktop inline or Mobile full screen */}
      {!isMobile ? (
        // Desktop: Show Outlet (Chat component) or empty state
        matchId ? (
          <Outlet context={{ isInline: true }} />
        ) : (
          renderEmptyChatPanel()
        )
      ) : (
        // Mobile: Show Outlet when matchId exists (will navigate to full page)
        matchId && <Outlet context={{ isInline: false }} />
      )}
    </div>
  );
}
