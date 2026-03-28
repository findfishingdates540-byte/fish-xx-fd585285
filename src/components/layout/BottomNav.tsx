import { useState, useEffect } from 'react';
import { Home, Heart, MessageCircle, User, Fish, MapPin, Rss, Plus, Sparkles, Trophy } from 'lucide-react';
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

  const { data: pendingRequestsCount = 0 } = useQuery({
    queryKey: ["pending-buddy-requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase.from("fishing_buddies").select("*", { count: "exact", head: true }).eq("recipient_id", user.id).eq("status", "pending");
      return count || 0;
    },
    enabled: !!user?.id && (accountMode === 'fishing' || accountMode === 'both'),
  });

  const { data: unreadMessagesCount = 0 } = useQuery({
    queryKey: ["unread-messages-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data: matches } = await supabase.from("matches").select("id").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).eq("is_match", true);
      if (!matches || matches.length === 0) return 0;
      const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).in("match_id", matches.map(m => m.id)).neq("sender_id", user.id).eq("is_read", false);
      return count || 0;
    },
    enabled: !!user?.id && (accountMode === 'dating' || accountMode === 'both'),
  });

  const { data: newMatchesCount = 0 } = useQuery({
    queryKey: ["new-matches-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data: matches } = await supabase.from("matches").select("id, user1_id, user2_id, matched_at, user1_viewed_at, user2_viewed_at").or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`).eq("is_match", true);
      if (!matches) return 0;
      return matches.filter(m => {
        const viewedAt = m.user1_id === user.id ? m.user1_viewed_at : m.user2_viewed_at;
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
      const { count } = await supabase.from("matches").select("*", { count: "exact", head: true }).eq("user2_id", user.id).eq("user1_liked", true).eq("user2_liked", false).eq("is_match", false);
      return count || 0;
    },
    enabled: !!user?.id && (accountMode === 'dating' || accountMode === 'both'),
  });

  const { data: unreadBuddyMessagesCount = 0 } = useQuery({
    queryKey: ["unread-buddy-messages-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { data: buddies } = await supabase.from("fishing_buddies").select("id").eq("status", "accepted").or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
      if (!buddies || buddies.length === 0) return 0;
      const { count } = await supabase.from("buddy_messages").select("*", { count: "exact", head: true }).in("buddy_id", buddies.map(b => b.id)).neq("sender_id", user.id).eq("is_read", false);
      return count || 0;
    },
    enabled: !!user?.id && (accountMode === 'fishing' || accountMode === 'both'),
  });

  const { data: unreadMentionsCount = 0 } = useQuery({
    queryKey: ["unread-mentions-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "comment_mention").eq("is_read", false);
      return count || 0;
    },
    enabled: !!user?.id && (accountMode === 'fishing' || accountMode === 'both'),
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("mobile-nav-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "fishing_buddies", filter: `recipient_id=eq.${user.id}` }, () => queryClient.invalidateQueries({ queryKey: ["pending-buddy-requests", user.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => queryClient.invalidateQueries({ queryKey: ["unread-messages-count", user.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => queryClient.invalidateQueries({ queryKey: ["new-matches-count", user.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "buddy_messages" }, () => queryClient.invalidateQueries({ queryKey: ["unread-buddy-messages-count", user.id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => queryClient.invalidateQueries({ queryKey: ["unread-mentions-count", user.id] }))
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

  const leftItems = navItems.slice(0, 2);
  const centerItem = navItems[2];
  const rightItems = navItems.slice(3);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb pointer-events-none">
        <div className="flex items-end justify-center px-4 pb-3">
          {/* Floating plus button - positioned above the pill */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[52px] pointer-events-auto z-10">
            <button
              onClick={() => setCreateOpen(true)}
              className="h-[56px] w-[56px] rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/25 active:scale-90 transition-transform"
            >
              <Plus className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
            </button>
          </div>

          {/* Pill container */}
          <div className="relative w-full pointer-events-auto">
            {/* SVG pill shape with center notch */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 390 64"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M32 0 H163 C163 0 165 0 168 3 C174 12 182 20 195 20 C208 20 216 12 222 3 C225 0 227 0 227 0 H358 C375.673 0 390 14.327 390 32 C390 49.673 375.673 64 358 64 H32 C14.327 64 0 49.673 0 32 C0 14.327 14.327 0 32 0 Z"
                className="fill-background stroke-border"
                strokeWidth="1"
              />
            </svg>

            {/* Nav items overlay */}
            <div className="relative flex items-center h-16">
              {/* Left section */}
              <div className="flex flex-1 items-center justify-evenly">
                {leftItems.map((item) => {
                  const badgeCount = getBadgeCount(item);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex flex-col items-center justify-center py-2 px-3 transition-colors',
                          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <div className="relative flex flex-col items-center gap-0.5">
                          <item.icon className={cn('h-[22px] w-[22px]')} strokeWidth={isActive ? 2.5 : 1.8} />
                          <span className={cn("text-[10px] leading-tight", isActive && "font-semibold")}>{item.label}</span>
                          {badgeCount > 0 && (
                            <Badge variant="destructive" className="absolute -top-1.5 -right-2.5 h-3.5 min-w-3.5 flex items-center justify-center text-[9px] px-0.5 rounded-full">
                              {badgeCount > 9 ? "9+" : badgeCount}
                            </Badge>
                          )}
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>

              {/* Center spacer for the notch */}
              <div className="w-[72px] shrink-0" />

              {/* Right section */}
              <div className="flex flex-1 items-center justify-evenly">
                {rightItems.map((item) => {
                  const badgeCount = getBadgeCount(item);

                  if (item.isScoreboardHub) {
                    return (
                      <button
                        key={item.to}
                        onClick={() => setScoreboardOpen(true)}
                        className="flex flex-col items-center justify-center py-2 px-3 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <item.icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
                        <span className="text-[10px] leading-tight mt-0.5">{item.label}</span>
                      </button>
                    );
                  }

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex flex-col items-center justify-center py-2 px-3 transition-colors',
                          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <div className="relative flex flex-col items-center gap-0.5">
                          <item.icon className={cn('h-[22px] w-[22px]')} strokeWidth={isActive ? 2.5 : 1.8} />
                          <span className={cn("text-[10px] leading-tight", isActive && "font-semibold")}>{item.label}</span>
                          {badgeCount > 0 && (
                            <Badge variant="destructive" className="absolute -top-1.5 -right-2.5 h-3.5 min-w-3.5 flex items-center justify-center text-[9px] px-0.5 rounded-full">
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
          </div>
        </div>
      </nav>

      <CreateActionSheet open={createOpen} onOpenChange={setCreateOpen} accountMode={accountMode} />
      <ScoreboardSheet open={scoreboardOpen} onOpenChange={setScoreboardOpen} />
    </>
  );
}
