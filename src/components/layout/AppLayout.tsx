import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { FishingHeader } from './FishingHeader';
import { DatingHeader } from './DatingHeader';
import { BothHeader } from './BothHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useOnlinePresence } from '@/hooks/use-online-presence';
import { useTripInvitationNotifications } from '@/hooks/use-trip-notifications';

export function AppLayout() {
  const { user, loading: authLoading } = useAuth();
  
  // Track online presence for the current user
  useOnlinePresence();
  
  // Listen for trip invitation responses (real-time notifications)
  useTripInvitationNotifications();

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

  const accountMode = profile?.account_mode || 'both';

  // Determine which desktop header to show
  const renderDesktopHeader = () => {
    if (accountMode === 'dating') {
      return null; // No header for dating mode
    }
    if (accountMode === 'fishing') {
      return <FishingHeader />;
    }
    // Both mode
    return <BothHeader />;
  };

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
        <Outlet context={{ accountMode }} />
      </main>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden">
        <BottomNav accountMode={accountMode} />
      </div>
    </div>
  );
}
