import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ActiveModeProvider } from '@/contexts/ActiveModeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { FishingHeader } from './FishingHeader';

import { PageTransition } from './PageTransition';
import { Skeleton } from '@/components/ui/skeleton';
import { useOnlinePresence } from '@/hooks/use-online-presence';
import { useTripInvitationNotifications } from '@/hooks/use-trip-notifications';
import { useMessageNotifications } from '@/hooks/use-message-notifications';
import { useMentionNotifications } from '@/hooks/use-mention-notifications';
import { useEffect } from 'react';

function AppLayoutContent() {
  const location = useLocation();
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
    queryClient.prefetchInfiniteQuery({
      queryKey: ['feed-posts', user.id],
      initialPageParam: 0 as number,
      queryFn: async ({ pageParam = 0 }) => {
        const { data: posts } = await supabase
          .from('feed_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!posts || posts.length === 0) return { posts: [], nextPage: undefined };

        const userIds = [...new Set(posts.map(p => p.user_id))];
        const catchIds = posts.map(p => p.catch_id).filter(Boolean) as string[];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, photos, id_verified, live_verified')
          .in('id', userIds);

        let catches: any[] = [];
        if (catchIds.length > 0) {
          const { data: catchData } = await supabase
            .from('catches')
            .select('id, species_name, weight_lbs, length_in, photos')
            .in('id', catchIds);
          catches = catchData || [];
        }

        const { data: likes } = await supabase
          .from('feed_likes')
          .select('post_id')
          .eq('user_id', user.id);
        
        const userLikes = likes?.map(l => l.post_id) || [];

        const profileMap = new Map(
          profiles?.filter(p => p.id !== null).map(p => [p.id, p]) || []
        );
        const catchMap = new Map(catches.map(c => [c.id, c]));

        return {
          posts: posts.map(post => ({
            ...post,
            profile: profileMap.get(post.user_id) || null,
            catch_data: post.catch_id ? catchMap.get(post.catch_id) || null : null,
            user_has_liked: userLikes.includes(post.id)
          })),
          nextPage: posts.length === 20 ? 1 : undefined
        };
      },
      getNextPageParam: (lastPage: any) => lastPage?.nextPage ?? undefined,
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

    // Prefetch buddy conversations
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
  
  // Chat pages hide the bottom nav for Instagram-like experience
  const isChatPage = location.pathname.includes('/buddy-chat/') || location.pathname.includes('/messages/');

  // Dating routes use their own sidebar layout (no FishingHeader)
  const datingRoutes = ['/app/discover', '/app/matches', '/app/likes', '/app/messages'];
  const isDatingRoute = datingRoutes.some(route => location.pathname.startsWith(route));

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header - show FishingHeader for non-dating routes */}
      <div className="hidden lg:block">
        {!isDatingRoute && <FishingHeader />}
      </div>

      {/* Mobile Header - hide on chat pages which have their own header */}
      {!isChatPage && (
        <div className="lg:hidden">
          <AppHeader />
        </div>
      )}
      
      <main className={`${isChatPage ? 'pb-0' : 'pb-16'} lg:pb-0`}>
        <PageTransition>
          <Outlet context={{ accountMode: 'fishing' }} />
        </PageTransition>
      </main>

      {/* Mobile Bottom Nav - hide on chat pages */}
      {!isChatPage && (
        <div className="lg:hidden">
          <BottomNav accountMode="fishing" />
        </div>
      )}
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
    staleTime: 60000,
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
    staleTime: 60000,
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

  // Check premium access for fishing/both users (admins exempt)
  const isAdmin = !!adminRole;
  const requiresPremium = profile?.account_mode === 'fishing' || profile?.account_mode === 'both';
  const gracePeriodMs = 3 * 24 * 60 * 60 * 1000;
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

  // Always treat as fishing mode — dating is a separate add-on
  const baseAccountMode = profile?.account_mode || 'fishing';

  return (
    <ActiveModeProvider 
      baseAccountMode={baseAccountMode === 'both' ? 'fishing' : baseAccountMode}
      isPremium={profile?.is_premium || false}
      premiumExpiresAt={profile?.premium_expires_at || null}
    >
      <AppLayoutContent />
    </ActiveModeProvider>
  );
}
