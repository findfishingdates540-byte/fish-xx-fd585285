import { useEffect } from 'react';
import { Home, Heart, MessageCircle, User, Fish, MapPin, Rss, LayoutDashboard, Calendar } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

type AccountMode = 'dating' | 'fishing' | 'both';

interface BottomNavProps {
  accountMode: AccountMode;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  hasBuddyBadge?: boolean;
  hasMessageBadge?: boolean;
  hasMatchBadge?: boolean;
  hasBuddyMessageBadge?: boolean;
  hasTripBadge?: boolean;
}

const getNavItems = (mode: AccountMode, wasOriginallyCombo: boolean): NavItem[] => {
  if (mode === 'dating') {
    const items: NavItem[] = [
      { to: '/app/discover', icon: Home, label: 'Discover' },
      { to: '/app/matches', icon: Heart, label: 'Matches', hasMatchBadge: true },
      { to: '/app/messages', icon: MessageCircle, label: 'Messages', hasMessageBadge: true },
    ];
    // Add dashboard link for originally-combo users
    if (wasOriginallyCombo) {
      items.push({ to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' });
    }
    items.push({ to: '/app/profile', icon: User, label: 'Profile' });
    return items;
  }

  if (mode === 'fishing') {
    const items: NavItem[] = [
      { to: '/app/feed', icon: Rss, label: 'Feed' },
      { to: '/app/spots', icon: MapPin, label: 'Spots' },
      { to: '/app/buddies', icon: Fish, label: 'Buddies', hasBuddyBadge: true },
      { to: '/app/buddy-messages', icon: MessageCircle, label: 'Messages', hasBuddyMessageBadge: true },
      { to: '/app/trips', icon: Calendar, label: 'Trips', hasTripBadge: true },
    ];
    // Add dashboard link for originally-combo users
    if (wasOriginallyCombo) {
      items.push({ to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' });
    }
    return items;
  }

  // Both mode - dashboard-centric navigation
  return [
    { to: '/app/dashboard', icon: Home, label: 'Home' },
    { to: '/app/feed', icon: Rss, label: 'Feed' },
    { to: '/app/messages', icon: MessageCircle, label: 'Messages', hasMessageBadge: true },
    { to: '/app/profile', icon: User, label: 'Profile' },
  ];
};

export function BottomNav({ accountMode }: BottomNavProps) {
  const { wasOriginallyCombo } = useActiveMode();
  const navItems = getNavItems(accountMode, wasOriginallyCombo);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pending buddy requests count
  const { data: pendingRequestsCount = 0 } = useQuery({
    queryKey: ["pending-buddy-requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase
        .from("fishing_buddies")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("status", "pending");
      return count || 0;
    },
    enabled: !!user?.id && (accountMode === 'fishing' || accountMode === 'both'),
  });

  // Fetch unread messages count
  const { data: unreadMessagesCount = 0 } = useQuery({
    queryKey: ["unread-messages-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      // First get all matches where user is a participant
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("is_match", true);

      if (!matches || matches.length === 0) return 0;

      const matchIds = matches.map(m => m.id);
      
      // Count unread messages in those matches
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("match_id", matchIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      return count || 0;
    },
    enabled: !!user?.id && (accountMode === 'dating' || accountMode === 'both'),
  });

  // Fetch new matches count (within last 24 hours)
  const { data: newMatchesCount = 0 } = useQuery({
    queryKey: ["new-matches-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { count } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("is_match", true)
        .gte("matched_at", twentyFourHoursAgo);

      return count || 0;
    },
    enabled: !!user?.id && (accountMode === 'dating' || accountMode === 'both'),
  });

  // Fetch unread buddy messages count
  const { data: unreadBuddyMessagesCount = 0 } = useQuery({
    queryKey: ["unread-buddy-messages-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      // First get all buddy relationships
      const { data: buddies } = await supabase
        .from("fishing_buddies")
        .select("id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      if (!buddies || buddies.length === 0) return 0;

      const buddyIds = buddies.map(b => b.id);
      
      // Count unread buddy messages
      const { count } = await supabase
        .from("buddy_messages")
        .select("*", { count: "exact", head: true })
        .in("buddy_id", buddyIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      return count || 0;
    },
    enabled: !!user?.id && (accountMode === 'fishing' || accountMode === 'both'),
  });

  // Fetch pending trip invitations count
  const { data: tripInvitesCount = 0 } = useQuery({
    queryKey: ["trip-invites-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count } = await supabase
        .from("trip_participants")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["pending", "invited"]);

      return count || 0;
    },
    enabled: !!user?.id && (accountMode === 'fishing' || accountMode === 'both'),
  });

  // Real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("mobile-nav-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fishing_buddies",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pending-buddy-requests", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-messages-count", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["new-matches-count", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "buddy_messages",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-buddy-messages-count", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_participants",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["trip-invites-count", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const getBadgeCount = (item: NavItem): number => {
    if (item.hasBuddyBadge) return pendingRequestsCount + unreadBuddyMessagesCount;
    if (item.hasMessageBadge) return unreadMessagesCount;
    if (item.hasMatchBadge) return newMatchesCount;
    if (item.hasBuddyMessageBadge) return unreadBuddyMessagesCount;
    if (item.hasTripBadge) return tripInvitesCount;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const badgeCount = getBadgeCount(item);
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-center flex-1 h-full transition-colors relative',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <div className="relative">
                  <item.icon
                    className={cn('h-6 w-6', isActive ? 'fill-current' : 'fill-current opacity-60')}
                    strokeWidth={1.5}
                  />
                  {badgeCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-3 h-4 min-w-4 flex items-center justify-center text-[10px] px-1"
                    >
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </Badge>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
