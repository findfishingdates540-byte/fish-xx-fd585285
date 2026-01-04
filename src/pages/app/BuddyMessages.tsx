import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Fish, ArrowLeft, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnlineStatus, formatLastSeen } from '@/hooks/use-online-presence';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { playNotificationSound } from '@/utils/notification-sound';

interface BuddyConversation {
  buddyId: string;
  buddyUserId: string;
  buddyProfile: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount: number;
}

export default function BuddyMessages() {
  const { buddyId } = useParams<{ buddyId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<BuddyConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('buddy-messages-list')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buddy_messages',
        },
        (payload) => {
          // Play notification sound if message is from someone else
          if (payload.new && payload.new.sender_id !== user.id) {
            playNotificationSound();
          }
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'buddy_messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get all accepted buddy relationships
      const { data: buddies } = await supabase
        .from('fishing_buddies')
        .select('id, requester_id, recipient_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      if (!buddies || buddies.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get buddy profile IDs
      const buddyProfileIds = buddies.map(b => 
        b.requester_id === user.id ? b.recipient_id : b.requester_id
      );

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photos')
        .in('id', buddyProfileIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      // Fetch last message and unread count for each buddy
      const conversationData: BuddyConversation[] = [];

      for (const buddy of buddies) {
        const otherUserId = buddy.requester_id === user.id ? buddy.recipient_id : buddy.requester_id;
        const profile = profileMap.get(otherUserId);

        if (!profile) continue;

        // Get last message
        const { data: lastMessages } = await supabase
          .from('buddy_messages')
          .select('content, created_at, sender_id')
          .eq('buddy_id', buddy.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('buddy_messages')
          .select('*', { count: 'exact', head: true })
          .eq('buddy_id', buddy.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        conversationData.push({
          buddyId: buddy.id,
          buddyUserId: otherUserId,
          buddyProfile: profile,
          lastMessage: lastMessages?.[0],
          unreadCount: unreadCount || 0
        });
      }

      // Sort by last message time
      conversationData.sort((a, b) => {
        const timeA = a.lastMessage?.created_at || '1970-01-01';
        const timeB = b.lastMessage?.created_at || '1970-01-01';
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });

      setConversations(conversationData);
    } catch (error) {
      console.error('Error fetching buddy conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get online status for all buddies
  const buddyUserIds = useMemo(() => conversations.map(c => c.buddyUserId), [conversations]);
  const { isOnline, getLastSeen } = useOnlineStatus(buddyUserIds);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.buddyProfile.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleSelectConversation = (id: string) => {
    if (isMobile) {
      navigate(`/app/buddy-chat/${id}`);
    } else {
      navigate(`/app/buddy-messages/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No fishing buddies yet</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Connect with other anglers to start chatting and plan fishing trips together!
        </p>
        <Button onClick={() => navigate('/app/buddies')}>
          <Fish className="h-4 w-4 mr-2" />
          Find Buddies
        </Button>
      </div>
    );
  }

  // Conversation List Component
  const ConversationListPanel = () => (
    <div className={cn(
      "flex flex-col bg-background border-r border-border",
      isMobile ? "w-full h-full" : "w-80 lg:w-96 flex-shrink-0"
    )}>
      {/* Search - hidden on mobile */}
      <div className="p-4 border-b border-border hidden lg:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search buddies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {filteredConversations.map((conv) => {
            const online = isOnline(conv.buddyUserId);
            const lastSeen = getLastSeen(conv.buddyUserId);
            const isSelected = !isMobile && buddyId === conv.buddyId;
            
            return (
              <button
                key={conv.buddyId}
                onClick={() => handleSelectConversation(conv.buddyId)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-accent/50",
                  conv.unreadCount > 0 && "bg-accent/30",
                  isSelected && "bg-accent"
                )}
              >
                {/* Avatar with online indicator */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.buddyProfile.photos?.[0]} className="object-cover" />
                    <AvatarFallback>
                      {conv.buddyProfile.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                    online ? "bg-green-500" : "bg-muted-foreground/30"
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-semibold text-sm",
                        conv.unreadCount > 0 && "font-bold"
                      )}>
                        {conv.buddyProfile.display_name || 'Anonymous'}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/50">
                        <Fish className="h-2.5 w-2.5 mr-0.5" />
                        BUDDY
                      </Badge>
                    </div>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conv.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  
                  {!online && lastSeen && (
                    <p className="text-xs text-muted-foreground mb-0.5">
                      {formatLastSeen(lastSeen)}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-sm truncate pr-2",
                      conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {conv.lastMessage?.sender_id === user?.id && (
                        <span className="text-muted-foreground">You: </span>
                      )}
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                    {conv.unreadCount > 0 ? (
                      <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-[20px] flex items-center justify-center">
                        {conv.unreadCount}
                      </Badge>
                    ) : conv.lastMessage?.sender_id === user?.id ? (
                      <span className="text-sm flex-shrink-0" title="Sent">🎣</span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  // Empty Chat State for Desktop
  const EmptyChatPanel = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8 text-center">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <MessageCircle className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-semibold mb-2">Your Buddy Chats</h3>
      <p className="text-muted-foreground max-w-md">
        Select a conversation from the list to start chatting with your fishing buddies.
        Share spots, plan trips, and connect with fellow anglers!
      </p>
    </div>
  );

  // Mobile: Show only list or only chat based on route
  if (isMobile) {
    return <ConversationListPanel />;
  }

  // Desktop: Split panel layout
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <ConversationListPanel />
      {buddyId ? (
        <Outlet />
      ) : (
        <EmptyChatPanel />
      )}
    </div>
  );
}
