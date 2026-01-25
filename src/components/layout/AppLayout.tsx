import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ActiveModeProvider, useActiveMode } from '@/contexts/ActiveModeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { FishingHeader } from './FishingHeader';
import { BothHeader } from './BothHeader';
import { ComboSharedHeader } from './ComboSharedHeader';
import { MobileModeSwitcher } from './MobileModeSwitcher';
import { PageTransition } from './PageTransition';
import { Skeleton } from '@/components/ui/skeleton';
import { useOnlinePresence } from '@/hooks/use-online-presence';
import { useTripInvitationNotifications } from '@/hooks/use-trip-notifications';
import { useMessageNotifications } from '@/hooks/use-message-notifications';
import { useMentionNotifications } from '@/hooks/use-mention-notifications';
import { useEffect } from 'react';

function AppLayoutContent() {
  const location = useLocation();
  const { effectiveMode, isComboUser } = useActiveMode();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Track online presence for the current user
  useOnlinePresence();
  
  // Listen for trip invitation responses (real-time notifications)
  useTripInvitationNotifications();

  // Listen for new message notifications
  useMessageNotifications();

  // Listen for mention notifications (play sound + toast)
  useMentionNotifications();

  // Prefetch commonly accessed data for faster page loads
  useEffect(() => {
    if (!user?.id) return;
    
    // Prefetch feed posts with profile data
    queryClient.prefetchQuery({
      queryKey: ['feed-posts', user.id],
      queryFn: async () => {
        // Get posts
        const { data: posts } = await supabase
          .from('feed_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!posts || posts.length === 0) return [];

        // Get unique user IDs and catch IDs
        const userIds = [...new Set(posts.map(p => p.user_id))];
        const catchIds = posts.map(p => p.catch_id).filter(Boolean) as string[];

        // Fetch profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, photos, id_verified, live_verified')
          .in('id', userIds);

        // Fetch catches if any
        let catches: any[] = [];
        if (catchIds.length > 0) {
          const { data: catchData } = await supabase
            .from('catches')
            .select('id, species_name, weight_lbs, length_in, photos')
            .in('id', catchIds);
          catches = catchData || [];
        }

        // Get user's likes
        const { data: likes } = await supabase
          .from('feed_likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        const userLikes = likes?.map(l => l.post_id) || [];

        // Map profiles and catches to posts
        const profileMap = new Map(
          profiles?.filter(p => p.id !== null).map(p => [p.id, p]) || []
        );
        const catchMap = new Map(catches.map(c => [c.id, c]));

        return posts.map(post => ({
          ...post,
          profile: profileMap.get(post.user_id) || null,
          catch_data: post.catch_id ? catchMap.get(post.catch_id) || null : null,
          user_has_liked: userLikes.includes(post.id)
        }));
      },
      staleTime: 60 * 1000,
    });

    // Prefetch buddy page data
    queryClient.prefetchQuery({
      queryKey: ['buddy-page-data', user.id],
      queryFn: async () => {
        const { data } = await supabase.rpc('get_buddy_page_data', {
          p_user_id: user.id,
        });
        return data;
      },
      staleTime: 30 * 1000,
    });

    // Prefetch dating conversations
    queryClient.prefetchQuery({
      queryKey: ['dating-conversations', user.id],
      queryFn: async () => {
        const { data } = await supabase.rpc('get_dating_conversations', { p_user_id: user.id });
        return data || [];
      },
      staleTime: 30 * 1000,
    });

    // Prefetch buddy conversations with same transform as useBuddyConversations
    queryClient.prefetchQuery({
      queryKey: ['buddy-conversations', user.id],
      queryFn: async () => {
        const { data } = await supabase.rpc('get_buddy_conversations', { p_user_id: user.id });
        return (data || []).map((row: any) => ({
          buddyId: row.buddy_id,
          buddyUserId: row.buddy_user_id,
          displayName: row.display_name || 'Anonymous',
          photo: row.photo || '',
          lastMessage: row.last_message || null,
          lastMessageTime: row.last_message_time || null,
          lastMessageSenderId: row.last_message_sender_id || null,
          unreadCount: Number(row.unread_count) || 0,
        }));
      },
      staleTime: 30 * 1000,
    });

    // Prefetch notifications count
    queryClient.prefetchQuery({
      queryKey: ['unread-notifications-count', user.id],
      queryFn: async () => {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        return count || 0;
      },
      staleTime: 30 * 1000,
    });
  }, [user?.id, queryClient]);
  
  // Check if we're on the combo dashboard - it has its own layout
  const isComboDashboard = location.pathname === '/app/dashboard';
  
  // Routes that have their own sidebars (dating pages) or special layouts
  const datingRoutes = ['/app/discover', '/app/matches', '/app/likes', '/app/messages'];
  const sharedRoutes = ['/app/settings', '/app/profile'];
  const fishingRoutes = ['/app/feed', '/app/spots', '/app/catches', '/app/trips', '/app/buddies', '/app/buddy-messages'];
  const isDatingRoute = datingRoutes.some(route => location.pathname.startsWith(route));
  const isSharedRoute = sharedRoutes.some(route => location.pathname.startsWith(route));
  const isFishingRoute = fishingRoutes.some(route => location.pathname.startsWith(route));

  // Discover should be a fixed, non-scroll viewport between header and bottom nav on mobile
  const isDiscoverNoScroll = location.pathname.startsWith('/app/discover');

  // Chat pages hide the bottom nav for Instagram-like experience
  const isChatPage = location.pathname.includes('/buddy-chat/') || location.pathname.includes('/messages/');

  // Determine which desktop header to show based on effective mode
  const renderDesktopHeader = () => {
    // Dating mode (or combo user in dating-only mode) - no header, pages have sidebar
    if (effectiveMode === 'dating') {
      return null;
    }
    
    // Fishing mode - always show FishingHeader
    if (effectiveMode === 'fishing') {
      return <FishingHeader />;
    }
    
    // Combo mode (unified view)
    if (effectiveMode === 'both') {
      // On dating routes, pages have their own sidebar (DiscoverSidebar)
      if (isDatingRoute) {
        return null;
      }
      // On shared routes, show ComboSharedHeader
      if (isSharedRoute) {
        return <ComboSharedHeader />;
      }
      // On fishing routes (including feed) and combo dashboard, show BothHeader
      return <BothHeader />;
    }
    
    return null;
  };

  // Combo dashboard has its own full layout with sidebar on desktop, but uses mobile components
  if (isComboDashboard) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header for Dashboard */}
        <div className="lg:hidden">
          <AppHeader />
        </div>
        
        <main className="pb-16 lg:pb-0">
          <PageTransition>
            <Outlet context={{ accountMode: effectiveMode, isComboUser }} />
          </PageTransition>
        </main>

        {/* Mobile Bottom Nav for Dashboard */}
        <div className="lg:hidden">
          <BottomNav accountMode={effectiveMode} />
        </div>

        {/* Mobile Mode Switcher FAB */}
        <MobileModeSwitcher />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        {renderDesktopHeader()}
      </div>

      {/* Mobile Header - hide on chat pages which have their own header */}
      {!isChatPage && (
        <div className="lg:hidden">
          <AppHeader />
        </div>
      )}
      
      <main className={`${isDiscoverNoScroll || isChatPage ? 'pb-0' : 'pb-16'} lg:pb-0`}>
        <PageTransition>
          <Outlet context={{ accountMode: effectiveMode, isComboUser }} />
        </PageTransition>
      </main>

      {/* Mobile Bottom Nav - hide on chat pages for Instagram-like experience */}
      {!isChatPage && (
        <div className="lg:hidden">
          <BottomNav accountMode={effectiveMode} />
        </div>
      )}

      {/* Mobile Mode Switcher FAB */}
      <MobileModeSwitcher />
    </div>
  );
}

export function AppLayout() {
  const { user, loading: authLoading } = useAuth();

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile-mode', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('account_mode, onboarding_completed, is_premium, premium_expires_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute
    retry: 2,
  });

  const { data: adminRole, isLoading: adminRoleLoading } = useQuery({
    queryKey: ['admin-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'moderator'])
        .maybeSingle();
      return data?.role ?? null;
    },
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute
    retry: 2,
  });

  if (authLoading || ((profileLoading || adminRoleLoading) && user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profileError) {
    console.error('Profile error:', profileError);
    return <Navigate to="/auth" replace />;
  }

  if (!profile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // Check if fishing/both users have valid premium access (with 3-day grace period after expiration)
  // NOTE: admins/moderators are exempt from premium gating.
  const isAdmin = !!adminRole;
  const requiresPremium = profile?.account_mode === 'fishing' || profile?.account_mode === 'both';
  const gracePeriodMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
  const isPremiumExpired =
    profile?.premium_expires_at &&
    new Date(profile.premium_expires_at).getTime() + gracePeriodMs < Date.now();
  const hasPremiumAccess = profile?.is_premium && !isPremiumExpired;

  if (requiresPremium && !hasPremiumAccess && !isAdmin) {
    return <Navigate to="/pricing" replace />;
  }

  // Redirect admins to /admin by default when visiting /app
  if (isAdmin && location.pathname === '/app') {
    return <Navigate to="/admin" replace />;
  }

  const baseAccountMode = profile?.account_mode || 'both';

  return (
    <ActiveModeProvider 
      baseAccountMode={baseAccountMode}
      isPremium={profile?.is_premium || false}
      premiumExpiresAt={profile?.premium_expires_at || null}
    >
      <AppLayoutContent />
    </ActiveModeProvider>
  );
}
