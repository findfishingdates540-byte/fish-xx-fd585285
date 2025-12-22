import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ActiveModeProvider, useActiveMode } from '@/contexts/ActiveModeContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { FishingHeader } from './FishingHeader';
import { DatingHeader } from './DatingHeader';
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

  // Combo dashboard has its own full layout with sidebar
  if (isComboDashboard) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet context={{ accountMode: effectiveMode, isComboUser }} />
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
      
      <main className="pb-16 lg:pb-0">
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
        .select('account_mode, onboarding_completed')
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

  if (authLoading || (profileLoading && user)) {
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

  const baseAccountMode = profile?.account_mode || 'both';

  return (
    <ActiveModeProvider baseAccountMode={baseAccountMode}>
      <AppLayoutContent />
    </ActiveModeProvider>
  );
}
