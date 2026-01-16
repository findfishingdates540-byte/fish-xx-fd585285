import { useState, useEffect, useRef } from 'react';
import { Bell, Heart, MessageCircle, Calendar, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { playNotificationSound } from '@/utils/notification-sound';

interface Notification {
  id: string;
  type: 'match' | 'message' | 'buddy_message' | 'trip';
  title: string;
  message: string;
  time: string;
  link: string;
  icon: React.ElementType;
  photo?: string;
  isRead?: boolean;
}

export type NotificationMode = 'dating' | 'fishing' | 'both';

interface NotificationCenterProps {
  mode?: NotificationMode;
}

export function NotificationCenter({ mode = 'both' }: NotificationCenterProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const previousCountRef = useRef<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  const showDating = mode === 'dating' || mode === 'both';
  const showFishing = mode === 'fishing' || mode === 'both';

  // Real-time subscriptions for instant notification updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time notification subscriptions for mode:', mode);

    const channel = supabase.channel('notification-center-realtime');

    // Only subscribe to dating-related tables if showing dating
    if (showDating) {
      channel
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'matches',
          },
          (payload) => {
            const match = payload.new as any;
            if (match.is_match && (match.user1_id === user.id || match.user2_id === user.id)) {
              console.log('New match detected via realtime');
              queryClient.invalidateQueries({ queryKey: ['recent-matches-notif', user.id] });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const message = payload.new as any;
            if (message.sender_id !== user.id) {
              console.log('New message detected via realtime');
              queryClient.invalidateQueries({ queryKey: ['unread-messages-notif', user.id] });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['unread-messages-notif', user.id] });
          }
        );
    }

    // Only subscribe to fishing-related tables if showing fishing
    if (showFishing) {
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'buddy_messages',
          },
          (payload) => {
            const message = payload.new as any;
            if (message.sender_id !== user.id) {
              console.log('New buddy message detected via realtime');
              queryClient.invalidateQueries({ queryKey: ['unread-buddy-messages-notif', user.id] });
            }
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
            queryClient.invalidateQueries({ queryKey: ['unread-buddy-messages-notif', user.id] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'trip_participants',
          },
          (payload) => {
            const invite = payload.new as any;
            if (invite.user_id === user.id) {
              console.log('New trip invite detected via realtime');
              queryClient.invalidateQueries({ queryKey: ['trip-invites-notif', user.id] });
            }
          }
        );
    }

    channel.subscribe((status) => {
      console.log('Notification center realtime subscription status:', status);
    });

    return () => {
      console.log('Cleaning up notification center realtime subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, mode, showDating, showFishing]);

  // Fetch recent UNVIEWED matches (only for dating mode)
  const { data: recentMatches } = useQuery({
    queryKey: ['recent-matches-notif', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
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
        .order('matched_at', { ascending: false })
        .limit(10);
      
      // Filter to only unviewed matches
      const unviewedMatches = (data || []).filter((match: any) => {
        const isUser1 = match.user1_id === user.id;
        const viewedAt = isUser1 ? match.user1_viewed_at : match.user2_viewed_at;
        
        // If never viewed, it's new
        if (!viewedAt) return true;
        
        // If matched after last viewed, it's new
        return match.matched_at && new Date(match.matched_at) > new Date(viewedAt);
      });
      
      return unviewedMatches;
    },
    enabled: !!user?.id && showDating,
  });

  // Fetch unread dating messages (only for dating mode)
  const { data: unreadMessages } = useQuery({
    queryKey: ['unread-messages-notif', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          match_id,
          sender:profiles!messages_sender_id_fkey(display_name, photos)
        `)
        .eq('is_read', false)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id && showDating,
  });

  // Fetch unread buddy messages (only for fishing mode)
  const { data: unreadBuddyMessages } = useQuery({
    queryKey: ['unread-buddy-messages-notif', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get buddy relationships
      const { data: buddies } = await supabase
        .from('fishing_buddies')
        .select('id, requester_id, recipient_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      if (!buddies || buddies.length === 0) return [];

      const buddyIds = buddies.map(b => b.id);

      const { data } = await supabase
        .from('buddy_messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          buddy_id,
          sender:profiles!buddy_messages_sender_id_fkey(display_name, photos)
        `)
        .in('buddy_id', buddyIds)
        .eq('is_read', false)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      return data || [];
    },
    enabled: !!user?.id && showFishing,
  });

  // Fetch UNSEEN trip invitations (only for fishing mode)
  const { data: tripInvites } = useQuery({
    queryKey: ['trip-invites-notif', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('trip_participants')
        .select(`
          id,
          created_at,
          status,
          seen_at,
          trip_id,
          trip:fishing_trips(title, trip_date, user_id)
        `)
        .eq('user_id', user.id)
        .in('status', ['pending', 'invited'])
        .is('seen_at', null)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get trip owner profiles
      if (data && data.length > 0) {
        const ownerIds = [...new Set(data.map((d: any) => d.trip?.user_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, photos')
          .in('id', ownerIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]));
        
        return data.map((d: any) => ({
          ...d,
          owner: profileMap.get(d.trip?.user_id)
        }));
      }
      
      return data || [];
    },
    enabled: !!user?.id && showFishing,
  });

  // Build notifications list based on mode
  const matchNotifications: Notification[] = showDating 
    ? (recentMatches || []).map((match: any) => {
        const otherUser = match.user1_id === user?.id ? match.user2 : match.user1;
        return {
          id: `match-${match.id}`,
          type: 'match',
          title: 'New Match!',
          message: `You matched with ${otherUser?.display_name || 'Someone'}`,
          time: match.matched_at,
          link: '/app/matches',
          icon: Heart,
          photo: otherUser?.photos?.[0],
        };
      })
    : [];

  const messageNotifications: Notification[] = showDating
    ? (unreadMessages || []).map((msg: any) => ({
        id: `msg-${msg.id}`,
        type: 'message',
        title: 'New Message',
        message: `${msg.sender?.display_name || 'Someone'}: ${msg.content?.slice(0, 40)}${msg.content?.length > 40 ? '...' : ''}`,
        time: msg.created_at,
        link: `/app/messages/${msg.match_id}`,
        icon: MessageCircle,
        photo: msg.sender?.photos?.[0],
      }))
    : [];

  const buddyMessageNotifications: Notification[] = showFishing
    ? (unreadBuddyMessages || []).map((msg: any) => ({
        id: `buddy-msg-${msg.id}`,
        type: 'buddy_message',
        title: 'Buddy Message',
        message: `${msg.sender?.display_name || 'A buddy'}: ${msg.content?.slice(0, 40)}${msg.content?.length > 40 ? '...' : ''}`,
        time: msg.created_at,
        link: `/app/buddy-chat/${msg.buddy_id}`,
        icon: Users,
        photo: msg.sender?.photos?.[0],
      }))
    : [];

  const tripNotifications: Notification[] = showFishing
    ? (tripInvites || []).map((invite: any) => ({
        id: `trip-${invite.id}`,
        type: 'trip',
        title: 'Trip Invitation',
        message: `${invite.owner?.display_name || 'Someone'} invited you to "${invite.trip?.title || 'a fishing trip'}"`,
        time: invite.created_at,
        link: `/app/trips/${invite.trip_id}`,
        icon: Calendar,
        photo: invite.owner?.photos?.[0],
      }))
    : [];

  const allNotifications = [
    ...matchNotifications,
    ...messageNotifications,
    ...buddyMessageNotifications,
    ...tripNotifications,
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const totalCount = allNotifications.length;
  const datingMessageCount = messageNotifications.length;
  const buddyMessageCount = buddyMessageNotifications.length;
  const messageCount = datingMessageCount + buddyMessageCount;
  const matchCount = matchNotifications.length;
  const tripCount = tripNotifications.length;

  // Play sound when new notifications arrive
  useEffect(() => {
    if (totalCount > previousCountRef.current && previousCountRef.current > 0) {
      playNotificationSound();
    }
    previousCountRef.current = totalCount;
  }, [totalCount]);

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (!user?.id) return;

    try {
      // Mark dating messages as read (only if showing dating)
      if (showDating) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .neq('sender_id', user.id);

        // Also mark matches as viewed so they stop counting in the bell
        const now = new Date().toISOString();
        await Promise.all([
          supabase
            .from('matches')
            .update({ user1_viewed_at: now })
            .eq('user1_id', user.id)
            .eq('is_match', true),
          supabase
            .from('matches')
            .update({ user2_viewed_at: now })
            .eq('user2_id', user.id)
            .eq('is_match', true),
        ]);
      }

      // Mark buddy messages as read (only if showing fishing)
      if (showFishing) {
        const { data: buddies } = await supabase
          .from('fishing_buddies')
          .select('id')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

        if (buddies && buddies.length > 0) {
          const buddyIds = buddies.map(b => b.id);
          await supabase
            .from('buddy_messages')
            .update({ is_read: true })
            .in('buddy_id', buddyIds)
            .neq('sender_id', user.id);
        }
        
        // Mark trip invites as seen
        const now = new Date().toISOString();
        await supabase
          .from('trip_participants')
          .update({ seen_at: now })
          .eq('user_id', user.id)
          .in('status', ['pending', 'invited'])
          .is('seen_at', null);
      }

      // Mark notifications in the notifications table as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      // Invalidate all relevant queries to refresh the notification counts
      queryClient.invalidateQueries({ queryKey: ['unread-messages-notif'] });
      queryClient.invalidateQueries({ queryKey: ['unread-buddy-messages-notif'] });
      queryClient.invalidateQueries({ queryKey: ['recent-matches-notif'] });
      queryClient.invalidateQueries({ queryKey: ['trip-invites-notif'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const renderNotificationItem = (notification: Notification) => (
    <Link
      key={notification.id}
      to={notification.link}
      onClick={() => setIsOpen(false)}
      className="flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors"
    >
      <div className="flex-shrink-0 mt-0.5">
        {notification.photo ? (
          <img 
            src={notification.photo} 
            alt="" 
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
            <notification.icon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{notification.title}</p>
          {notification.type === 'buddy_message' && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
              🎣 Buddy
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.time), { addSuffix: true })}
        </p>
      </div>
    </Link>
  );

  // Determine which tabs to show based on mode
  const getTabColumns = () => {
    if (mode === 'fishing') return 3; // All, Messages (buddy), Trips
    if (mode === 'dating') return 3;  // All, Messages (dating), Matches
    return 4; // All, Messages, Matches, Trips
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-destructive animate-ping opacity-75" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-[10px] px-1"
              >
                {totalCount > 99 ? '99+' : totalCount}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <Tabs defaultValue="all" className="w-full">
          <div className="p-3 border-b border-border">
            <TabsList className={cn("w-full grid", `grid-cols-${getTabColumns()}`)}>
              <TabsTrigger value="all" className="text-xs relative">
                All
                {totalCount > 0 && (
                  <span className="ml-1 text-[10px] text-muted-foreground">({totalCount})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="messages" className="text-xs relative">
                <MessageCircle className="h-3 w-3 mr-1" />
                {messageCount > 0 && (
                  <span className="text-[10px]">{messageCount}</span>
                )}
              </TabsTrigger>
              {showDating && (
                <TabsTrigger value="matches" className="text-xs">
                  <Heart className="h-3 w-3 mr-1" />
                  {matchCount > 0 && (
                    <span className="text-[10px]">{matchCount}</span>
                  )}
                </TabsTrigger>
              )}
              {showFishing && (
                <TabsTrigger value="trips" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {tripCount > 0 && (
                    <span className="text-[10px]">{tripCount}</span>
                  )}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="all" className="m-0">
            <ScrollArea className="h-[350px]">
              {allNotifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {allNotifications.map(renderNotificationItem)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="messages" className="m-0">
            <ScrollArea className="h-[350px]">
              {messageCount === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No new messages</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {[...messageNotifications, ...buddyMessageNotifications]
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .map(renderNotificationItem)}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {showDating && (
            <TabsContent value="matches" className="m-0">
              <ScrollArea className="h-[350px]">
                {matchCount === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No new matches</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {matchNotifications.map(renderNotificationItem)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          )}

          {showFishing && (
            <TabsContent value="trips" className="m-0">
              <ScrollArea className="h-[350px]">
                {tripCount === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No trip invitations</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {tripNotifications.map(renderNotificationItem)}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>

        {/* Footer with Mark All Read + Links */}
        <div className="p-2 border-t border-border">
          {totalCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mb-2 text-xs gap-2"
              onClick={handleMarkAllRead}
            >
              <Check className="h-3 w-3" />
              Mark all as read
            </Button>
          )}
          <Link 
            to="/app/notifications" 
            onClick={() => setIsOpen(false)}
            className="block text-center text-xs text-primary hover:text-primary/80 py-2 font-medium"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
