import { useMemo, useState } from 'react';
import { useNavigate, useParams, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle, Fish, Users, Camera, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnlineStatus, formatLastSeen } from '@/hooks/use-online-presence';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBuddyConversations } from '@/hooks/use-buddy-conversations';
import { useMessageRequests, useAcceptMessageRequest, useDeclineMessageRequest } from '@/hooks/use-message-requests';
import { OnlineBuddiesRow } from '@/components/messages/OnlineBuddiesRow';
import { Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TabType = 'primary' | 'general' | 'requests';
type FilterType = 'all' | 'unread' | 'unanswered';

export default function BuddyMessages() {
  const { buddyId } = useParams<{ buddyId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('primary');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Fetch current user's profile for the online row
  const { data: currentUserProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, photos')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { conversations, isLoading } = useBuddyConversations();
  const { data: messageRequests = [], isLoading: requestsLoading } = useMessageRequests();
  const acceptRequest = useAcceptMessageRequest();
  const declineRequest = useDeclineMessageRequest();

  // Get online status for all buddies
  const buddyUserIds = useMemo(() => conversations.map(c => c.buddyUserId), [conversations]);
  const { isOnline, getLastSeen } = useOnlineStatus(buddyUserIds);

  // Format activity status
  const formatActivityStatus = (userId: string) => {
    if (isOnline(userId)) {
      return 'Active now';
    }
    const lastSeen = getLastSeen(userId);
    if (lastSeen) {
      const formatted = formatLastSeen(lastSeen);
      // Don't add "Active" prefix if formatLastSeen already includes it
      if (formatted.startsWith('Active')) {
        return formatted;
      }
      return `Active ${formatted}`;
    }
    return '';
  };

  // Online buddies for the top row
  const onlineBuddies = useMemo(() => 
    conversations
      .filter(conv => isOnline(conv.buddyUserId))
      .map(conv => ({
        buddyId: conv.buddyId,
        displayName: conv.displayName || 'Unknown',
        photo: conv.photo || '',
      })),
    [conversations, isOnline]
  );

  // Count unread messages for Primary tab badge
  const primaryUnreadCount = useMemo(() => 
    conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    let result = conversations.filter(conv =>
      conv.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Apply filter
    if (activeFilter === 'unread') {
      result = result.filter(conv => conv.unreadCount > 0);
    } else if (activeFilter === 'unanswered') {
      // Unanswered = last message was from them (not from current user)
      result = result.filter(conv => conv.lastMessageSenderId !== user?.id && conv.lastMessage);
    }
    
    return result;
  }, [conversations, searchQuery, activeFilter, user?.id]);

  const handleSelectConversation = (id: string) => {
    if (isMobile) {
      navigate(`/app/buddy-chat/${id}`);
    } else {
      navigate(`/app/buddy-messages/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0 && messageRequests.length === 0) {
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

  // Filter Tabs Component
  const FilterTabs = () => (
    <div className="flex gap-2 px-4 py-3 border-b border-border">
      <Button
        variant={activeTab === 'primary' ? 'default' : 'secondary'}
        size="sm"
        className={cn(
          "flex-1 rounded-lg gap-1.5 justify-center",
          activeTab === 'primary' && "bg-foreground text-background hover:bg-foreground/90"
        )}
        onClick={() => setActiveTab('primary')}
      >
        {primaryUnreadCount > 0 && (
          <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
        )}
        Primary
        {primaryUnreadCount > 0 && (
          <span className="text-xs">{primaryUnreadCount}</span>
        )}
      </Button>
      <Button
        variant={activeTab === 'general' ? 'default' : 'secondary'}
        size="sm"
        className={cn(
          "flex-1 rounded-lg justify-center",
          activeTab === 'general' && "bg-foreground text-background hover:bg-foreground/90"
        )}
        onClick={() => setActiveTab('general')}
      >
        General
      </Button>
      <Button
        variant={activeTab === 'requests' ? 'default' : 'secondary'}
        size="sm"
        className={cn(
          "flex-1 rounded-lg justify-center",
          activeTab === 'requests' && "bg-foreground text-background hover:bg-foreground/90"
        )}
        onClick={() => setActiveTab('requests')}
      >
        Requests
        {messageRequests.length > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-primary text-primary-foreground">
            {messageRequests.length}
          </Badge>
        )}
      </Button>
    </div>
  );

  // Requests Content
  const RequestsContent = () => (
    <div className="flex-1 overflow-y-auto">
      {messageRequests.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-muted-foreground">No message requests</p>
          <p className="text-xs text-muted-foreground mt-1">
            When someone who isn't your buddy messages you, it'll appear here
          </p>
        </div>
      ) : (
        messageRequests.map((request) => (
          <div
            key={request.buddyId}
            className="flex items-center gap-3 p-4 border-b border-border"
          >
            <Avatar className="h-14 w-14">
              <AvatarImage src={request.requesterPhoto} className="object-cover" />
              <AvatarFallback>
                {request.requesterName?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{request.requesterName}</p>
              <p className="text-sm text-muted-foreground">
                {request.messageCount} message{request.messageCount > 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => declineRequest.mutate(request.buddyId)}
                disabled={declineRequest.isPending}
              >
                <X className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => acceptRequest.mutate(request.buddyId)}
                disabled={acceptRequest.isPending}
              >
                <Check className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // Conversation List Component
  const ConversationListPanel = () => (
    <div className={cn(
      "flex flex-col bg-background border-r border-border",
      isMobile ? "w-full h-full" : "w-80 lg:w-96 flex-shrink-0"
    )}>
      {/* Search with Filter button */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-0 rounded-xl"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "font-semibold gap-1",
                  activeFilter !== 'all' ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Filter className="h-4 w-4" />
                {activeFilter === 'all' ? 'Filter' : activeFilter === 'unread' ? 'Unread' : 'Unanswered'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setActiveFilter('all')}
                className={activeFilter === 'all' ? 'bg-accent' : ''}
              >
                All messages
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setActiveFilter('unread')}
                className={activeFilter === 'unread' ? 'bg-accent' : ''}
              >
                Unread
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setActiveFilter('unanswered')}
                className={activeFilter === 'unanswered' ? 'bg-accent' : ''}
              >
                Unanswered
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Online Buddies Row */}
      <OnlineBuddiesRow 
        buddies={onlineBuddies} 
        onSelect={handleSelectConversation}
        currentUser={currentUserProfile ? {
          name: currentUserProfile.display_name || 'You',
          photo: currentUserProfile.photos?.[0] || '',
        } : undefined}
      />

      {/* Filter Tabs */}
      <FilterTabs />

      {/* Content based on active tab */}
      {activeTab === 'requests' ? (
        <RequestsContent />
      ) : (
        <ScrollArea className="flex-1">
          <div className="divide-y divide-border">
            {filteredConversations.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const online = isOnline(conv.buddyUserId);
                const isSelected = !isMobile && buddyId === conv.buddyId;
                const activityStatus = formatActivityStatus(conv.buddyUserId);
                
                return (
                  <button
                    key={conv.buddyId}
                    onClick={() => handleSelectConversation(conv.buddyId)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-accent/50",
                      isSelected && "bg-accent"
                    )}
                  >
                    {/* Avatar with online indicator */}
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={conv.photo} className="object-cover" />
                        <AvatarFallback>
                          {conv.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {online && (
                        <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-semibold truncate",
                        conv.unreadCount > 0 && "font-bold"
                      )}>
                        {conv.displayName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activityStatus}
                      </p>
                    </div>

                    {/* Right side: unread badge */}
                    {conv.unreadCount > 0 && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-[20px] flex items-center justify-center">
                          {conv.unreadCount}
                        </Badge>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}
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
