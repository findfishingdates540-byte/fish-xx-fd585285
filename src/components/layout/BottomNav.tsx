import { useState, useEffect } from 'react';
import { Home, Heart, MessageCircle, User, Fish, MapPin, Rss, LayoutDashboard, Calendar, Sparkles, Trophy, Camera, BarChart3, Swords } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
  hasLikesBadge?: boolean;
  hasMentionsBadge?: boolean;
  isScoreboardHub?: boolean;
}

const scoreboardLinks = [
  { to: "/app/leaderboard", label: "Scoreboards Hub", description: "Overall rankings and top anglers", icon: BarChart3 },
  { to: "/app/species", label: "Species Explorer", description: "Browse species directory and records", icon: Fish },
  { to: "/app/challenges", label: "Fishing Challenges", description: "Compete in live and upcoming events", icon: Swords },
  { to: "/app/photo-challenges", label: "Photo Challenges", description: "Submit photos, vote & win prizes", icon: Camera },
  { to: "/app/teams", label: "Teams", description: "Create or join a fishing team", icon: Trophy },
];

const getNavItems = (mode: AccountMode, isComboUser: boolean): NavItem[] => {
  if (mode === 'dating') {
    const items: NavItem[] = [
      { to: '/app/discover', icon: Home, label: 'Discover' },
      { to: '/app/likes', icon: Sparkles, label: 'Likes', hasLikesBadge: true },
      { to: '/app/matches', icon: Heart, label: 'Matches', hasMatchBadge: true },
      { to: '/app/messages', icon: MessageCircle, label: 'Messages', hasMessageBadge: true },
    ];
    items.push({ to: '/app/profile', icon: User, label: 'Profile' });
    return items;
  }

  if (mode === 'fishing') {
    const items: NavItem[] = [
      { to: '/app/feed', icon: Rss, label: 'Feed', hasMentionsBadge: true },
      { to: '/app/spots', icon: MapPin, label: 'Spots' },
      { to: '/app/leaderboard', icon: Trophy, label: 'Rankings', isScoreboardHub: true },
      { to: '/app/photo-challenges', icon: Camera, label: 'Challenges' },
      { to: '/app/buddies', icon: Fish, label: 'Buddies', hasBuddyBadge: true },
    ];
    return items;
  }

  // Both mode - dashboard-centric navigation
  return [
    { to: '/app/dashboard', icon: Home, label: 'Home' },
    { to: '/app/feed', icon: Rss, label: 'Feed', hasMentionsBadge: true },
    { to: '/app/messages', icon: MessageCircle, label: 'Messages', hasMessageBadge: true },
    { to: '/app/profile', icon: User, label: 'Profile' },
  ];
};

export function BottomNav({ accountMode }: BottomNavProps) {
  const { isComboUser } = useActiveMode();
  const navItems = getNavItems(accountMode, isComboUser);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [scoreboardOpen, setScoreboardOpen] = useState(false);

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

  // Fetch new matches count (unviewed matches)
  const { data: newMatchesCount = 0 } = useQuery({
    queryKey: ["new-matches-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      // Get all matches with viewed timestamps
      const { data: matches } = await supabase
        .from("matches")
        .select("id, user1_id, user2_id, matched_at, user1_viewed_at, user2_viewed_at")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("is_match", true);

      if (!matches) return 0;

      // Count unviewed matches
      const unviewedCount = matches.filter(m => {
        const isUser1 = m.user1_id === user.id;
        const viewedAt = isUser1 ? m.user1_viewed_at : m.user2_viewed_at;
        
        // If never viewed, it's new
        if (!viewedAt) return true;
        
        // If matched after last viewed, it's new
        return m.matched_at && new Date(m.matched_at) > new Date(viewedAt);
      }).length;

      return unviewedCount;
    },
    enabled: !!user?.id && (accountMode === 'dating' || accountMode === 'both'),
  });

  // Fetch pending likes count (people who liked you but you haven't responded)
  const { data: pendingLikesCount = 0 } = useQuery({
    queryKey: ["pending-likes-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("user2_id", user.id)
        .eq("user1_liked", true)
        .eq("user2_liked", false)
        .eq("is_match", false);

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

  // Fetch unread mentions count
  const { data: unreadMentionsCount = 0 } = useQuery({
    queryKey: ["unread-mentions-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", "comment_mention")
        .eq("is_read", false);

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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-mentions-count", user.id] });
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
    if (item.hasLikesBadge) return pendingLikesCount;
    if (item.hasMentionsBadge) return unreadMentionsCount;
    return 0;
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-pb">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const badgeCount = getBadgeCount(item);

            // Scoreboard hub item opens a sheet instead of navigating
            if (item.isScoreboardHub) {
              return (
                <button
                  key={item.to}
                  onClick={() => setScoreboardOpen(true)}
                  className={cn(
                    'flex items-center justify-center flex-1 h-full transition-colors relative',
                    'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className="relative">
                    <item.icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                </button>
              );
            }

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
                      className={cn('h-6 w-6', isActive && 'fill-current')}
                      strokeWidth={isActive ? 2.5 : 2}
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

      {/* Scoreboard Hub Sheet */}
      <Sheet open={scoreboardOpen} onOpenChange={setScoreboardOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-2">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-center">Scoreboard Hub</SheetTitle>
          </SheetHeader>
          <div className="grid gap-1">
            {scoreboardLinks.map((link) => (
              <button
                key={link.to}
                onClick={() => {
                  setScoreboardOpen(false);
                  navigate(link.to);
                }}
                className="flex items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  <link.icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{link.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
