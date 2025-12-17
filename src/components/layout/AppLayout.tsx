import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { Skeleton } from '@/components/ui/skeleton';

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
    staleTime: 0, // Always refetch on mount
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

  // If profile fetch failed or profile doesn't exist yet, retry or redirect
  if (profileError) {
    console.error('Profile error:', profileError);
    return <Navigate to="/auth" replace />;
  }

  if (!profile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  const accountMode = profile?.account_mode || 'both';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header - Hidden on desktop when sidebar is visible */}
      <div className="lg:hidden">
        <AppHeader />
      </div>
      
      <main className="pb-16 lg:pb-0">
        <Outlet context={{ accountMode }} />
      </main>

      {/* Mobile Bottom Nav - Hidden on desktop */}
      <div className="lg:hidden">
        <BottomNav accountMode={accountMode} />
      </div>
    </div>
  );
}
