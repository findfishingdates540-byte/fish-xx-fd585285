import { useEffect } from 'react';
import { Bell, Compass, Sparkles, Heart, MessageSquare, Home, MapPin } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface MessagesHeaderProps {
  userName: string;
  userPhoto?: string;
  notificationCount?: number;
  accountMode?: 'dating' | 'fishing' | 'both';
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badgeType?: 'messages' | 'matches';
}

// Dating-specific nav items
const datingNavLinks: NavItem[] = [
  { to: '/app/discover', label: 'Discover', icon: Compass },
  { to: '/app/likes', label: 'Who Likes You', icon: Sparkles },
  { to: '/app/matches', label: 'Matches', icon: Heart, badgeType: 'matches' },
  { to: '/app/messages', label: 'Messages', icon: MessageSquare, badgeType: 'messages' },
];

// Fishing/Both mode nav items  
const fishingNavLinks: NavItem[] = [
  { to: '/app/discover', label: 'Home', icon: Home },
  { to: '/app/matches', label: 'Matches', icon: Heart, badgeType: 'matches' },
  { to: '/app/spots', label: 'Fishing Map', icon: MapPin },
  { to: '/app/messages', label: 'Messages', icon: MessageSquare, badgeType: 'messages' },
];

export function MessagesHeader({ userName, userPhoto, notificationCount = 0, accountMode = 'dating' }: MessagesHeaderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const initials = userName?.charAt(0)?.toUpperCase() || 'U';
  const navLinks = accountMode === 'dating' ? datingNavLinks : fishingNavLinks;

  // Fetch unread messages count
  const { data: unreadMessagesCount = 0 } = useQuery({
    queryKey: ["header-unread-messages", user?.id],
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
    enabled: !!user?.id,
  });

  // Fetch new matches count (within last 24 hours)
  const { data: newMatchesCount = 0 } = useQuery({
    queryKey: ["header-new-matches", user?.id],
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
      .channel("header-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["header-unread-messages", user.id] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["header-new-matches", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const getBadgeCount = (badgeType?: 'messages' | 'matches') => {
    if (badgeType === 'messages') return unreadMessagesCount;
    if (badgeType === 'matches') return newMatchesCount;
    return 0;
  };

  const renderNavItem = (link: NavItem, isActive: boolean) => (
    <>
      <link.icon className="h-4 w-4" />
      <span>{link.label}</span>
      {link.badgeType && getBadgeCount(link.badgeType) > 0 && (
        <Badge 
          variant={link.badgeType === 'messages' ? 'destructive' : 'default'}
          className="h-5 min-w-5 flex items-center justify-center text-xs px-1.5 ml-1"
        >
          {getBadgeCount(link.badgeType) > 99 ? "99+" : getBadgeCount(link.badgeType)}
        </Badge>
      )}
    </>
  );

  return (
    <header className="border-b border-border bg-background">
      <div className="h-14 px-4 md:px-6 flex items-center justify-between">
        {/* Navigation links - left side */}
        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              {({ isActive }) => renderNavItem(link, isActive)}
            </NavLink>
          ))}
        </nav>

        {/* Right side - notification bell + avatar */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </Button>
          <Link to="/app/profile">
            <Avatar className="h-9 w-9 ring-2 ring-border">
              <AvatarImage src={userPhoto} alt={userName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
