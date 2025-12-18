import { Bell, Heart, MessageCircle, Fish, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export function AppHeader() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, photos')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch recent matches
  const { data: recentMatches } = useQuery({
    queryKey: ['recent-matches', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('matches')
        .select(`
          id,
          matched_at,
          user1_id,
          user2_id,
          user1:profiles!matches_user1_id_fkey(display_name, photos),
          user2:profiles!matches_user2_id_fkey(display_name, photos)
        `)
        .eq('is_match', true)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('matched_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch recent unread messages
  const { data: unreadMessages } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          sender:profiles!messages_sender_id_fkey(display_name, photos)
        `)
        .eq('is_read', false)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch trip invitations
  const { data: tripInvites } = useQuery({
    queryKey: ['trip-invites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('trip_participants')
        .select(`
          id,
          created_at,
          trip:fishing_trips(title, trip_date, user_id),
          organizer:fishing_trips(profiles:user_id(display_name))
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const avatarUrl = profile?.photos?.[0] || '';
  const initials = profile?.display_name?.charAt(0)?.toUpperCase() || 'U';

  const totalNotifications = 
    (recentMatches?.length || 0) + 
    (unreadMessages?.length || 0) + 
    (tripInvites?.length || 0);

  const notifications = [
    ...(recentMatches?.map((match: any) => {
      const otherUser = match.user1_id === user?.id ? match.user2 : match.user1;
      return {
        id: `match-${match.id}`,
        type: 'match' as const,
        title: 'New Match!',
        message: `You matched with ${otherUser?.display_name || 'Someone'}`,
        time: match.matched_at,
        link: '/app/matches',
        icon: Heart,
      };
    }) || []),
    ...(unreadMessages?.map((msg: any) => ({
      id: `msg-${msg.id}`,
      type: 'message' as const,
      title: 'New Message',
      message: `${msg.sender?.display_name || 'Someone'}: ${msg.content?.slice(0, 30)}...`,
      time: msg.created_at,
      link: '/app/messages',
      icon: MessageCircle,
    })) || []),
    ...(tripInvites?.map((invite: any) => ({
      id: `trip-${invite.id}`,
      type: 'trip' as const,
      title: 'Trip Invitation',
      message: `You're invited to "${invite.trip?.title || 'a fishing trip'}"`,
      time: invite.created_at,
      link: '/app/trips',
      icon: Calendar,
    })) || []),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <Link to="/app" className="font-bold text-lg tracking-tight">
          Find Fishing Dates
        </Link>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {totalNotifications > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-3 border-b border-border">
                <h4 className="font-semibold text-sm">Notifications</h4>
              </div>
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    No new notifications
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        to={notification.link}
                        className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <notification.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.time), { addSuffix: true })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Link to="/app/profile">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={avatarUrl} alt={profile?.display_name || 'Profile'} />
              <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
