import { useEffect } from 'react';
import { Home, Heart, MapPin, MessageSquare, Settings, Compass, Sparkles, ArrowLeft, LayoutDashboard, Anchor } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveMode, ActiveMode } from '@/contexts/ActiveModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import logoImage from '@/assets/logo.png';
import datingLogoImage from '@/assets/dating-logo.png';

type AccountMode = 'dating' | 'fishing' | 'both';
type DiscoveryMode = 'fishing' | 'dating' | 'combo';

interface DiscoverSidebarProps {
  accountMode: AccountMode;
  discoveryMode: DiscoveryMode;
  onDiscoveryModeChange: (mode: DiscoveryMode) => void;
  userName: string;
  userPhoto?: string;
  isPremium?: boolean;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  hasMessageBadge?: boolean;
  hasMatchBadge?: boolean;
}

// Dating-specific nav items
const datingNavItems: NavItem[] = [
  { to: '/app/discover', icon: Compass, label: 'Discover' },
  { to: '/app/likes', icon: Sparkles, label: 'Who Likes You' },
  { to: '/app/matches', icon: Heart, label: 'Matches', hasMatchBadge: true },
  { to: '/app/messages', icon: MessageSquare, label: 'Messages', hasMessageBadge: true },
];

// Fishing/Both mode nav items
const fishingNavItems: NavItem[] = [
  { to: '/app/discover', icon: Home, label: 'Home' },
  { to: '/app/matches', icon: Heart, label: 'Matches', hasMatchBadge: true },
  { to: '/app/spots', icon: MapPin, label: 'Fishing Map' },
  { to: '/app/messages', icon: MessageSquare, label: 'Messages', hasMessageBadge: true },
];

export function DiscoverSidebar({
  accountMode,
  discoveryMode,
  onDiscoveryModeChange,
  userName,
  userPhoto,
  isPremium,
}: DiscoverSidebarProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Get active mode context for combo users
  const { activeMode, setActiveMode, isComboUser } = useActiveMode();

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
    enabled: !!user?.id,
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
    enabled: !!user?.id,
  });

  // Real-time subscription for messages and matches
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("sidebar-updates")
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const getModeLabel = () => {
    // Use activeMode for combo users to show their current active mode
    if (isComboUser) {
      switch (activeMode) {
        case 'dating':
          return 'DATING MODE';
        case 'fishing':
          return 'FISHING MODE';
        case 'unified':
        default:
          return 'COMBO MODE';
      }
    }
    // Non-combo users
    switch (accountMode) {
      case 'dating':
        return 'DATING MODE';
      case 'fishing':
        return 'FISHING MODE';
      default:
        return 'COMBO MODE';
    }
  };

  const initials = userName?.charAt(0)?.toUpperCase() || 'U';
  const isDatingMode = accountMode === 'dating';
  // Combo mode users see dating nav items when in dating section
  const navItems = isDatingMode || isComboUser ? datingNavItems : fishingNavItems;

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen border-r border-border bg-background p-6 fixed top-0 left-0 z-40">
      {/* Mode Switcher for Combo Users */}
      {isComboUser && (
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild className="gap-2 justify-start -ml-2 mb-2">
            <Link to="/app/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex bg-muted rounded-lg p-1 gap-1">
            {[
              { value: 'unified' as ActiveMode, label: 'All', icon: LayoutDashboard },
              { value: 'dating' as ActiveMode, label: 'Dating', icon: Heart },
              { value: 'fishing' as ActiveMode, label: 'Fishing', icon: Anchor },
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => setActiveMode(mode.value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                  activeMode === mode.value
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <mode.icon className="h-3 w-3" />
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Logo */}
      <div className={cn("mb-8", isComboUser && "mb-6")}>
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="Find Fishing Dates" className="h-8 w-8 rounded-lg" />
          <span className="font-bold text-lg">Find Fishing Dates</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{getModeLabel()}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium relative',
                isActive
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{item.label}</span>
            {item.hasMessageBadge && unreadMessagesCount > 0 && (
              <Badge 
                variant="destructive" 
                className="h-5 min-w-5 flex items-center justify-center text-xs px-1.5"
              >
                {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
              </Badge>
            )}
            {item.hasMatchBadge && newMatchesCount > 0 && (
              <Badge 
                className="h-5 min-w-5 flex items-center justify-center text-xs px-1.5 bg-primary"
              >
                {newMatchesCount > 99 ? "99+" : newMatchesCount}
              </Badge>
            )}
          </NavLink>
        ))}

        {/* Discovery Mode Section - Only for account mode 'both' but not using activeMode context */}
        {accountMode === 'both' && !isComboUser && (
          <div className="pt-6">
            <p className="text-xs font-semibold text-muted-foreground px-4 mb-3">DISCOVERY</p>
            <div className="flex flex-wrap gap-2 px-2">
              {(['fishing', 'dating', 'combo'] as DiscoveryMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onDiscoveryModeChange(mode)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize',
                    discoveryMode === mode
                      ? 'bg-foreground text-background'
                      : 'border border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="flex items-center gap-3 pt-6 border-t border-border">
        <NavLink to="/app/profile" className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userPhoto} alt={userName} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">
              {isPremium ? 'Pro Member' : 'Free Member'}
            </p>
          </div>
        </NavLink>
        <NavLink to="/app/settings" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-5 w-5" />
        </NavLink>
      </div>
    </aside>
  );
}
