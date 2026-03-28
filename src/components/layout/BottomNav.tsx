import { useState, useEffect } from 'react';
import { Home, Heart, MessageCircle, Fish, MapPin, Rss, Plus, Sparkles, Trophy, Calendar } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { CreateActionSheet } from './CreateActionSheet';
import { ScoreboardSheet } from './ScoreboardSheet';

type AccountMode = 'dating' | 'fishing';

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
  hasBuddyMessagesBadge?: boolean;
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
      { to: '/app/trips', icon: Calendar, label: 'Trips' },
      { to: '#create', icon: Plus, label: 'Create', isCenterAction: true },
      { to: '/app/leaderboard', icon: Trophy, label: 'Rankings', isScoreboardHub: true },
      { to: '/app/buddies', icon: Fish, label: 'Buddies', hasBuddyBadge: true },
      { to: '/app/buddy-messages', icon: MessageCircle, label: 'Messages', hasBuddyMessagesBadge: true },
    ];
  }
  // No 'both' mode — upstream always resolves to 'dating' or 'fishing'
  return [];
};

/* ---- Pill background with smooth notch ---- */
function PillBackground() {
  return (
    <div className="absolute inset-0 w-full h-full drop-shadow-sm">
      {/* Left rounded end */}
      <div className="absolute left-0 top-0 bottom-0 w-8">
        <svg className="w-full h-full" viewBox="0 0 32 64" fill="none" preserveAspectRatio="none">
          <path d="M 0 32 C 0 14.327 14.327 0 32 0 L 32 64 L 32 64 C 14.327 64 0 49.673 0 32 Z" className="fill-background stroke-border" strokeWidth="0.8" />
        </svg>
      </div>
      {/* Left flat bar */}
      <div className="absolute left-8 top-0 bottom-0 right-[calc(50%+44px)]">
        <svg className="w-full h-full" viewBox="0 0 1 64" fill="none" preserveAspectRatio="none">
          <rect x="0" y="0" width="1" height="64" className="fill-background" />
          <line x1="0" y1="0" x2="1" y2="0" className="stroke-border" strokeWidth="0.8" />
          <line x1="0" y1="64" x2="1" y2="64" className="stroke-border" strokeWidth="0.8" />
        </svg>
      </div>
      {/* Center notch — fixed width */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[88px]">
        <svg className="w-full h-full" viewBox="0 0 88 64" fill="none" preserveAspectRatio="xMidYMin meet">
          <path
            d={[
              'M 0 0',
              'C 5 0 8 1 10 5',
              'Q 16 18 24 28',
              'Q 32 38 44 38',
              'Q 56 38 64 28',
              'Q 72 18 78 5',
              'C 80 1 83 0 88 0',
              'L 88 64',
              'L 0 64',
              'Z',
            ].join(' ')}
            className="fill-background stroke-border"
            strokeWidth="0.8"
          />
        </svg>
      </div>
      {/* Right flat bar */}
      <div className="absolute right-8 top-0 bottom-0 left-[calc(50%+44px)]">
        <svg className="w-full h-full" viewBox="0 0 1 64" fill="none" preserveAspectRatio="none">
          <rect x="0" y="0" width="1" height="64" className="fill-background" />
          <line x1="0" y1="0" x2="1" y2="0" className="stroke-border" strokeWidth="0.8" />
          <line x1="0" y1="64" x2="1" y2="64" className="stroke-border" strokeWidth="0.8" />
        </svg>
      </div>
      {/* Right rounded end */}
      <div className="absolute right-0 top-0 bottom-0 w-8">
        <svg className="w-full h-full" viewBox="0 0 32 64" fill="none" preserveAspectRatio="none">
          <path d="M 0 0 L 0 0 C 17.673 0 32 14.327 32 32 C 32 49.673 17.673 64 0 64 L 0 64 Z" className="fill-background stroke-border" strokeWidth="0.8" />
        </svg>
      </div>
    </div>
  );
}

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
    enabled: !!user?.id && accountMode === 'fishing',
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
    enabled: !!user?.id && accountMode === 'dating',
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
    enabled: !!user?.id && accountMode === 'dating',
  });

  const { data: pendingLikesCount = 0 } = useQuery({
    queryKey: ["pending-likes-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase.from("matches").select("*", { count: "exact", head: true }).eq("user2_id", user.id).eq("user1_liked", true).eq("user2_liked", false).eq("is_match", false);
      return count || 0;
    },
    enabled: !!user?.id && accountMode === 'dating',
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
    enabled: !!user?.id && accountMode === 'fishing',
  });

  const { data: unreadMentionsCount = 0 } = useQuery({
    queryKey: ["unread-mentions-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "comment_mention").eq("is_read", false);
      return count || 0;
    },
    enabled: !!user?.id && accountMode === 'fishing',
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
    if (item.hasBuddyBadge) return pendingRequestsCount;
    if (item.hasMessageBadge) return unreadMessagesCount;
    if (item.hasMatchBadge) return newMatchesCount;
    if (item.hasLikesBadge) return pendingLikesCount;
    if (item.hasMentionsBadge) return unreadMentionsCount;
    if (item.hasBuddyMessagesBadge) return unreadBuddyMessagesCount;
    return 0;
  };

  const centerIndex = navItems.findIndex(i => i.isCenterAction);
  const leftItems = navItems.slice(0, centerIndex);
  const rightItems = navItems.slice(centerIndex + 1);

  const renderNavItem = (item: NavItem) => {
    const badgeCount = getBadgeCount(item);

    if (item.isScoreboardHub) {
      return (
        <button
          key={item.to}
          onClick={() => setScoreboardOpen(true)}
          className="flex flex-col items-center justify-center py-2 px-1.5 transition-colors text-muted-foreground hover:text-foreground"
        >
          <item.icon className="h-5 w-5" strokeWidth={1.8} />
          <span className="text-[9px] leading-tight mt-0.5">{item.label}</span>
        </button>
      );
    }

    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center py-2 px-1.5 transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )
        }
      >
        {({ isActive }) => (
          <div className="relative flex flex-col items-center gap-0.5">
            <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={cn("text-[9px] leading-tight", isActive && "font-semibold")}>{item.label}</span>
            {badgeCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1.5 -right-2.5 h-3.5 min-w-3.5 flex items-center justify-center text-[9px] px-0.5 rounded-full">
                {badgeCount > 9 ? "9+" : badgeCount}
              </Badge>
            )}
          </div>
        )}
      </NavLink>
    );
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb pointer-events-none">
        <div className="relative flex items-end justify-center px-3 pb-2">
          {/* Floating plus button — nestled into the notch with gap */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[38px] pointer-events-auto z-10">
            <button
              onClick={() => setCreateOpen(true)}
              className="h-[52px] w-[52px] rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/25 active:scale-90 transition-transform"
            >
              <Plus className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
            </button>
          </div>

          {/* Pill with notch */}
          <div className="relative w-full h-16 pointer-events-auto">
            <PillBackground />

            <div className="relative flex items-center h-full">
              {/* Left nav items */}
              <div className="flex flex-1 items-center justify-evenly">
                {leftItems.map(renderNavItem)}
              </div>

              {/* Center spacer (notch area) */}
              <div className="w-[68px] shrink-0" />

              {/* Right nav items */}
              <div className="flex flex-1 items-center justify-evenly">
                {rightItems.map(renderNavItem)}
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
