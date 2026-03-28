import { useState, useEffect } from 'react';
import { Home, Heart, MessageCircle, User, Fish, MapPin, Rss, Plus, Sparkles, Trophy, Camera } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { CreateActionSheet } from './CreateActionSheet';
import { ScoreboardSheet } from './ScoreboardSheet';

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
  isCenterAction?: boolean;
}

const getNavItems = (mode: AccountMode): NavItem[] => {
  if (mode === 'dating') {
    return [
      { to: '/app/discover', icon: Home, label: 'Discover' },
      { to: '/app/likes', icon: Sparkles, label: 'Likes', hasLikesBadge: true },
      { to: '#create', icon: Plus, label: 'Create', isCenterAction: true },
      { to: '/app/matches', icon: Heart, label: 'Matches', hasMatchBadge: true },
      { to: '/app/messages', icon: MessageCircle, label: 'Messages', hasMessageBadge: true },
    ];
  }

  if (mode === 'fishing') {
    return [
      { to: '/app/feed', icon: Rss, label: 'Feed', hasMentionsBadge: true },
      { to: '/app/spots', icon: MapPin, label: 'Spots' },
      { to: '#create', icon: Plus, label: 'Create', isCenterAction: true },
      { to: '/app/leaderboard', icon: Trophy, label: 'Rankings', isScoreboardHub: true },
      { to: '/app/buddies', icon: Fish, label: 'Buddies', hasBuddyBadge: true },
    ];
  }

  // Both mode
  return [
    { to: '/app/feed', icon: Rss, label: 'Feed', hasMentionsBadge: true },
    { to: '/app/spots', icon: MapPin, label: 'Spots' },
    { to: '#create', icon: Plus, label: 'Create', isCenterAction: true },
    { to: '/app/messages', icon: MessageCircle, label: 'Messages', hasMessageBadge: true },
    { to: '/app/profile', icon: User, label: 'Profile' },
  ];
};

export function BottomNav({ accountMode }: BottomNavProps) {
  const { isComboUser } = useActiveMode();
  const navItems = getNavItems(accountMode);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
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

  const { data: unreadMessagesCount = 0 } = useQuery({
    queryKey: ["unread-messages-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("is_match", true);
      if (!matches || matches.length === 0) return 0;
      const matchIds = matches.map(m => m.id);
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

  const { data: newMatchesCount = 0 } = useQuery({
    queryKey: ["new-matches-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data: matches } = await supabase
        .from("matches")
        .select("id, user1_id, user2_id, matched_at, user1_viewed_at, user2_viewed_at")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("is_match", true);
      if (!matches) return 0;
      return matches.filter(m => {
        const isUser1 = m.user1_id === user.id;
        const viewedAt = isUser1 ? m.user1_viewed_at : m.user2_viewed_at;
        if (!viewedAt) return true;
        return m.matched_at && new Date(m.matched_at) > new Date(viewedAt);
      }).length;
    },
    enabled: !!user?.id && (accountMode === 'dating' || accountMode === 'both'),
  });

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

  const { data: unreadBuddyMessagesCount = 0 } = useQuery({
    queryKey: ["unread-buddy-messages-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data: buddies } = await supabase
        .from("fishing_buddies")
        .select("id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
      if (!buddies || buddies.length === 0) return 0;
      const buddyIds = buddies.map(b => b.id);
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
      .on("postgres_changes", { event: "*", schema: "public", table: "fishing_buddies", filter: `recipient_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["pending-buddy-requests", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["unread-messages-count", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        queryClient.invalidateQueries({ queryKey: ["new-matches-count", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "buddy_messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["unread-buddy-messages-count", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["unread-mentions-count", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const getBadgeCount = (item: NavItem): number => {
    if (item.hasBuddyBadge) return pendingRequestsCount + unreadBuddyMessagesCount;
    if (item.hasMessageBadge) return unreadMessagesCount;
    if (item.hasMatchBadge) return newMatchesCount;
    if (item.hasLikesBadge) return pendingLikesCount;
    if (item.hasMentionsBadge) return unreadMentionsCount;
    return 0;
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
        {/* Background shape with notch */}
        <div className="relative">
          <div className="absolute inset-0 bg-background border-t border-border" />
          
          <div className="relative flex items-end justify-around h-16 px-1">
            {navItems.map((item, index) => {
              const badgeCount = getBadgeCount(item);

              // Center raised plus button
              if (item.isCenterAction) {
                return (
                  <div key="center-action" className="flex items-center justify-center flex-1 relative -mt-5">
                    <button
                      onClick={() => setCreateOpen(true)}
                      className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform"
                    >
                      <Plus className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
                    </button>
                  </div>
                );
              }

              // Scoreboard hub
              if (item.isScoreboardHub) {
                return (
                  <button
                    key={item.to}
                    onClick={() => setScoreboardOpen(true)}
                    className={cn(
                      'flex flex-col items-center justify-center flex-1 h-full pt-2 transition-colors',
                      'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-6 w-6" strokeWidth={2} />
                    <span className="text-[10px] mt-0.5">{item.label}</span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center justify-center flex-1 h-full pt-2 transition-colors',
                      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )
                  }
                >
                  {({ isActive }) => (
                    <div className="relative flex flex-col items-center">
                      <item.icon
                        className={cn('h-6 w-6', isActive && 'fill-current')}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className={cn("text-[10px] mt-0.5", isActive && "font-medium")}>{item.label}</span>
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
        </div>
      </nav>

      <CreateActionSheet open={createOpen} onOpenChange={setCreateOpen} accountMode={accountMode} />
      <ScoreboardSheet open={scoreboardOpen} onOpenChange={setScoreboardOpen} />
    </>
  );
}
