import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ActiveModeProvider, useActiveMode } from '@/contexts/ActiveModeContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { FishingHeader } from './FishingHeader';
import { BothHeader } from './BothHeader';
import { ComboSharedHeader } from './ComboSharedHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useOnlinePresence } from '@/hooks/use-online-presence';
import { useTripInvitationNotifications } from '@/hooks/use-trip-notifications';
import { useMessageNotifications } from '@/hooks/use-message-notifications';

function AppLayoutContent() {
  const location = useLocation();
  const { effectiveMode, isComboUser } = useActiveMode();
  
  // Track online presence for the current user
  useOnlinePresence();
  
  // Listen for trip invitation responses (real-time notifications)
  useTripInvitationNotifications();

  // Listen for new message notifications
  useMessageNotifications();
  
  // Check if we're on the combo dashboard - it has its own layout
  const isComboDashboard = location.pathname === '/app/dashboard';
  
  // Routes that have their own sidebars (dating pages) or special layouts
  const datingRoutes = ['/app/discover', '/app/matches', '/app/likes', '/app/messages'];
  const sharedRoutes = ['/app/settings', '/app/profile'];
  const isDatingRoute = datingRoutes.some(route => location.pathname.startsWith(route));
  const isSharedRoute = sharedRoutes.some(route => location.pathname.startsWith(route));

  // Discover should be a fixed, non-scroll viewport between header and bottom nav on mobile
  const isDiscoverNoScroll = location.pathname.startsWith('/app/discover');

  // Determine which desktop header to show based on effective mode
  const renderDesktopHeader = () => {
    // Dating mode (or combo user in dating-only mode) - no header, pages have sidebar
    if (effectiveMode === 'dating') {
      return null;
    }
    
    // Fishing mode
    if (effectiveMode === 'fishing') {
      return <FishingHeader />;
    }
    
    // Combo mode (unified view)
    if (effectiveMode === 'both') {
      // On shared routes, show ComboSharedHeader
      if (isSharedRoute) {
        return <ComboSharedHeader />;
      }
      // On dating routes, pages have their own sidebar (DiscoverSidebar)
      if (isDatingRoute) {
        return null;
      }
      // Default to BothHeader for combo dashboard and fishing routes
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
          <Outlet context={{ accountMode: effectiveMode, isComboUser }} />
        </main>

        {/* Mobile Bottom Nav for Dashboard */}
        <div className="lg:hidden">
          <BottomNav accountMode={effectiveMode} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <div className="hidden lg:block">
        {renderDesktopHeader()}
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <AppHeader />
      </div>
      
      <main className={`${isDiscoverNoScroll ? 'pb-0' : 'pb-16'} lg:pb-0`}>
        <Outlet context={{ accountMode: effectiveMode, isComboUser }} />
      </main>

      {/* Mobile Bottom Nav - uses effective mode */}
      <div className="lg:hidden">
        <BottomNav accountMode={effectiveMode} />
      </div>
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
    staleTime: 0,
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
    staleTime: 0,
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

  const baseAccountMode = profile?.account_mode || 'both';

  return (
    <ActiveModeProvider baseAccountMode={baseAccountMode}>
      <AppLayoutContent />
    </ActiveModeProvider>
  );
}
