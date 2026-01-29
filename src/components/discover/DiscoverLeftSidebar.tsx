import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Settings, SlidersHorizontal, UserPlus, Copy, Check, LayoutDashboard, Heart, Anchor, Bell } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveMode, ActiveMode } from '@/contexts/ActiveModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useUnreadNotificationsCount } from '@/hooks/use-notifications';

interface MatchQueueItem {
  id: string;
  name: string;
  photo: string;
  isNew?: boolean;
}

interface ConversationItem {
  id: string;
  name: string;
  photo: string;
  lastMessage: string;
  time: string;
  isYourMove: boolean;
  isOnline?: boolean;
  expiresIn?: string | null;
  unreadCount?: number;
}

interface DiscoverLeftSidebarProps {
  userName: string;
  userPhoto?: string;
  onFiltersClick?: () => void;
}

const modeOptions = [
  { value: 'unified' as ActiveMode, icon: LayoutDashboard, label: 'Dashboard', route: '/app/dashboard' },
  { value: 'dating' as ActiveMode, icon: Heart, label: 'Dating', route: '/app/discover' },
  { value: 'fishing' as ActiveMode, icon: Anchor, label: 'Fishing', route: '/app/feed' },
];

export function DiscoverLeftSidebar({
  userName,
  userPhoto,
  onFiltersClick,
}: DiscoverLeftSidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeMode, setActiveMode, isComboUser } = useActiveMode();
  const [conversationsOpen, setConversationsOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const { data: notificationUnreadCount = 0 } = useUnreadNotificationsCount();
  
  const initials = userName?.charAt(0)?.toUpperCase() || 'U';

  const handleModeSwitch = (mode: ActiveMode, route: string) => {
    setActiveMode(mode);
    navigate(route);
  };

  // Fetch pending likes count (blurred avatars in match queue)
  const { data: pendingLikesCount = 0 } = useQuery({
    queryKey: ['pending-likes-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('user2_id', user.id)
        .eq('is_match', false)
        .eq('user1_liked', true)
        .eq('user2_liked', false);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Fetch match queue (recent matches)
  const { data: matchQueue = [] } = useQuery({
    queryKey: ['match-queue-sidebar', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data } = await supabase
        .from('matches')
        .select(`
          id,
          matched_at,
          user1_id,
          user2_id,
          user1_viewed_at,
          user2_viewed_at,
          user1:profiles!matches_user1_id_fkey(display_name, photos),
          user2:profiles!matches_user2_id_fkey(display_name, photos)
        `)
        .eq('is_match', true)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .gte('matched_at', sevenDaysAgo.toISOString())
        .order('matched_at', { ascending: false })
        .limit(10);
      
      return (data || []).map((match: any) => {
        const otherUser = match.user1_id === user.id ? match.user2 : match.user1;
        const isUser1 = match.user1_id === user.id;
        const viewedAt = isUser1 ? match.user1_viewed_at : match.user2_viewed_at;
        const isNew = !viewedAt || (match.matched_at && new Date(match.matched_at) > new Date(viewedAt));
        
        return {
          id: match.id,
          name: otherUser?.display_name || 'Someone',
          photo: otherUser?.photos?.[0] || '',
          isNew,
        };
      });
    },
    enabled: !!user?.id,
  });

  // Fetch conversations with "Your move" status
  const { data: conversations = [] } = useQuery({
    queryKey: ['discover-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          matched_at,
          user1:profiles!matches_user1_id_fkey(display_name, photos, last_active_at),
          user2:profiles!matches_user2_id_fkey(display_name, photos, last_active_at)
        `)
        .eq('is_match', true)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      
      if (!matchesData || matchesData.length === 0) return [];

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const conversationsWithMessages = await Promise.all(
        matchesData.map(async (match: any) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', match.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);
          
          const lastMessage = messages?.[0];
          const otherUser = match.user1_id === user.id ? match.user2 : match.user1;
          const lastActive = otherUser?.last_active_at ? new Date(otherUser.last_active_at) : null;
          const isOnline = lastActive ? lastActive > fiveMinutesAgo : false;
          
          // Determine if it's "Your move" - other person sent last message
          const isYourMove = lastMessage ? lastMessage.sender_id !== user.id : false;
          
          return {
            id: match.id,
            name: otherUser?.display_name || 'Someone',
            photo: otherUser?.photos?.[0] || '',
            lastMessage: lastMessage 
              ? lastMessage.content.slice(0, 35) + (lastMessage.content.length > 35 ? '...' : '')
              : 'Start the conversation!',
            time: lastMessage 
              ? formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: false })
              : 'New',
            isYourMove,
            isOnline,
            unreadCount: unreadCount || 0,
            expiresIn: null, // Future feature: match expiration
          };
        })
      );

      return conversationsWithMessages.sort((a, b) => {
        // Sort by unread first, then by your move
        if (a.unreadCount && !b.unreadCount) return -1;
        if (!a.unreadCount && b.unreadCount) return 1;
        return 0;
      });
    },
    enabled: !!user?.id,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('discover-sidebar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        queryClient.invalidateQueries({ queryKey: ['match-queue-sidebar', user.id] });
        queryClient.invalidateQueries({ queryKey: ['pending-likes-count', user.id] });
        queryClient.invalidateQueries({ queryKey: ['discover-conversations', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['discover-conversations', user.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const handleInvite = async () => {
    const PRODUCTION_URL = 'https://findfishingdates.net';
    const inviteUrl = `${PRODUCTION_URL}?ref=${user?.id?.slice(0, 8)}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Join me on Find Fishing Dates!',
          text: 'Find fishing buddies and dates who share your passion.',
          url: inviteUrl,
        });
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        toast.success('Invite link copied!');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        toast.success('Invite link copied!');
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const totalMatchQueueCount = pendingLikesCount + matchQueue.length;

  return (
    <aside className="hidden lg:flex flex-col w-80 h-screen border-r border-border bg-background fixed top-0 left-0 z-40">
      {/* User Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link to="/app/profile">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={userPhoto} alt={userName} />
              <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to="/app/profile" className="font-semibold text-lg hover:underline">
              {userName}
            </Link>
          </div>
          
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-accent relative"
            onClick={() => navigate('/app/notifications')}
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            {notificationUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-[20px] bg-primary rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary-foreground px-1">
                  {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                </span>
              </span>
            )}
          </Button>
          
          {/* Mode Switcher for Combo Users */}
          {isComboUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-accent"
                >
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="flex flex-row items-center gap-1 p-2 min-w-0 w-auto bg-popover border border-border shadow-lg"
              >
                <TooltipProvider delayDuration={300}>
                  {modeOptions.map((option) => (
                    <Tooltip key={option.value}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleModeSwitch(option.value, option.route)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            activeMode === option.value
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent text-foreground"
                          )}
                        >
                          <option.icon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Switch to {option.label}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Match Queue Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Match Queue {totalMatchQueueCount > 0 && `(${totalMatchQueueCount})`}
          </h3>
        </div>
        
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {/* Pending Likes - Blurred with count */}
          {pendingLikesCount > 0 && (
            <button
              onClick={() => navigate('/app/likes')}
              className="flex-shrink-0 relative"
            >
              <div className="relative">
                <div className="h-14 w-14 rounded-full bg-foreground flex items-center justify-center">
                  <span className="text-lg font-bold text-background">{pendingLikesCount}</span>
                </div>
              </div>
            </button>
          )}
          
          {/* Match Queue Avatars */}
          {matchQueue.map((match) => (
            <button
              key={match.id}
              onClick={() => navigate(`/app/messages/${match.id}`)}
              className="flex-shrink-0 relative group"
            >
              <Avatar className={cn(
                "h-14 w-14 ring-2 ring-offset-2 ring-offset-background transition-all group-hover:ring-primary",
                match.isNew ? "ring-primary" : "ring-muted"
              )}>
                <AvatarImage src={match.photo} alt={match.name} />
                <AvatarFallback>{match.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {match.isNew && (
                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-primary rounded-full border-2 border-background" />
              )}
            </button>
          ))}
          
          {totalMatchQueueCount === 0 && (
            <p className="text-sm text-muted-foreground py-2">No matches yet</p>
          )}
        </div>
      </div>

      {/* Conversations Section */}
      <Collapsible open={conversationsOpen} onOpenChange={setConversationsOpen} className="flex-1 flex flex-col min-h-0">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
            <span className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              {conversationsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Conversations
              <span className="text-xs text-muted-foreground">(Recent)</span>
            </span>
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-2 pb-4 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2 py-4">No conversations yet</p>
            ) : (
              conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => navigate(`/app/messages/${convo.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors text-left"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={convo.photo} alt={convo.name} />
                      <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {convo.isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium truncate",
                        convo.unreadCount && convo.unreadCount > 0 ? "font-bold" : ""
                      )}>
                        {convo.name}
                      </span>
                      {convo.isYourMove && (
                        <Badge className="bg-foreground hover:bg-foreground text-background text-[10px] px-1.5 py-0 h-5 font-medium">
                          Your move
                        </Badge>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm truncate",
                      convo.unreadCount && convo.unreadCount > 0 
                        ? "text-foreground font-medium" 
                        : "text-muted-foreground"
                    )}>
                      {convo.lastMessage}
                    </p>
                    {convo.expiresIn && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Conversation expires in {convo.expiresIn}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </aside>
  );
}
