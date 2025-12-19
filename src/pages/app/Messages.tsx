import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessagesHeader } from '@/components/messages/MessagesHeader';
import { ConversationList } from '@/components/messages/ConversationList';
import { EmptyMessages } from '@/components/messages/EmptyMessages';
import { useOnlineStatus, formatLastSeen } from '@/hooks/use-online-presence';
import { useDatingConversations } from '@/hooks/use-dating-conversations';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
      lastSeen: !isOnline(convo.matchedUserId) ? formatLastSeen(getLastSeen(convo.matchedUserId)) : undefined
    })), [conversations, isOnline, getLastSeen]);

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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Header (Desktop only) */}
      <div className="hidden lg:block">
        <MessagesHeader
          userName={profile?.display_name || 'User'}
          userPhoto={profile?.photos?.[0]}
          notificationCount={totalUnread}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation Sidebar */}
        {isLoading ? (
          <div className="w-full lg:w-80 border-r border-border">
            {renderLoading()}
          </div>
        ) : conversations.length === 0 ? (
          <div className="w-full">
            {renderEmptyState()}
          </div>
        ) : (
          <>
            <ConversationList
              conversations={conversationsWithStatus}
              selectedId={undefined}
              onSelect={handleSelectConversation}
            />
            {/* Empty State / Chat Area */}
            <EmptyMessages />
          </>
        )}
      </div>
    </div>
  );
}
