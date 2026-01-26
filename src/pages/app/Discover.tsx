import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDiscoverProfiles } from '@/hooks/use-discover-profiles';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDatingTutorial } from '@/hooks/use-dating-tutorial';
import {
  DiscoverSidebar,
  ProfileCard,
  SwipeActions,
  ProfileDetailView,
  MatchCelebrationModal,
  DatingTutorial,
  ReportProfileSheet,
  QuickFiltersSheet,
} from '@/components/discover';
import { RefreshCw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Discover() {
  const { accountMode } = useOutletContext<{ accountMode: 'dating' | 'fishing' | 'both' }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDetailView, setShowDetailView] = useState(false);
  const isMobile = useIsMobile();
  const { isRunning, shouldShowTutorial, startTutorial, completeTutorial, stopTutorial } = useDatingTutorial();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    currentProfile,
    currentDetailProfile,
    isLoading,
    isSwiping,
    hasMoreProfiles,
    noMoreProfiles,
    handleLike,
    handlePass,
    handleSuperLike,
    loadMoreProfiles,
    matchedProfile,
    clearMatchedProfile,
  } = useDiscoverProfiles();

  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, photos, is_premium')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Prevent any vertical page scrolling on mobile Discover (swipe-only screen)
  useEffect(() => {
    if (!isMobile) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [isMobile]);

  // Auto-start tutorial for first-time users
  useEffect(() => {
    if (shouldShowTutorial && currentProfile && !isLoading) {
      const timer = setTimeout(() => startTutorial(), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShowTutorial, currentProfile, isLoading, startTutorial]);

  // Fetch pending likes (people who liked current user but no mutual match yet)
  const { data: pendingLikes } = useQuery({
    queryKey: ['pending-likes-sidebar', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user1_liked,
          user2_liked,
          user1:profiles!matches_user1_id_fkey(display_name, photos)
        `)
        .eq('user2_id', user.id)
        .eq('is_match', false)
        .eq('user1_liked', true)
        .eq('user2_liked', false)
        .order('created_at', { ascending: false })
        .limit(10);

      return (data || []).map((match: any) => ({
        id: match.id,
        name: match.user1?.display_name || 'Someone',
        photo: match.user1?.photos?.[0] || '',
      }));
    },
    enabled: !!user?.id,
  });

  // Fetch recent matches (last 7 days)
  const { data: recentMatches } = useQuery({
    queryKey: ['recent-matches-sidebar', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data } = await supabase
        .from('matches')
        .select(`
          id,
          matched_at,
          user1_id,
          user2_id,
          user1:profiles!matches_user1_id_fkey(display_name, photos, last_active_at),
          user2:profiles!matches_user2_id_fkey(display_name, photos, last_active_at)
        `)
        .eq('is_match', true)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .gte('matched_at', sevenDaysAgo.toISOString())
        .order('matched_at', { ascending: false })
        .limit(10);
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      return (data || []).map((match: any) => {
        const otherUser = match.user1_id === user.id ? match.user2 : match.user1;
        const lastActive = otherUser?.last_active_at ? new Date(otherUser.last_active_at) : null;
        const isOnline = lastActive ? lastActive > fiveMinutesAgo : false;
        
        return {
          id: match.id,
          name: otherUser?.display_name || 'Someone',
          photo: otherUser?.photos?.[0] || '',
          isOnline,
          lastActiveAt: otherUser?.last_active_at || null,
        };
      });
    },
    enabled: !!user?.id,
  });

  // Real-time subscriptions for sidebar updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('sidebar-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          const match = payload.new as any;
          if (match.user1_id === user.id || match.user2_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['pending-likes-sidebar', user.id] });
            if (match.is_match) {
              queryClient.invalidateQueries({ queryKey: ['recent-matches-sidebar', user.id] });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          const match = payload.new as any;
          if (match.user1_id === user.id || match.user2_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['pending-likes-sidebar', user.id] });

            if (match.is_match) {
              queryClient.invalidateQueries({ queryKey: ['recent-matches-sidebar', user.id] });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const onPass = useCallback(async () => {
    await handlePass();
    setShowDetailView(false);
  }, [handlePass]);

  const onLike = useCallback(async () => {
    await handleLike();
    setShowDetailView(false);
  }, [handleLike]);

  const onSuperLike = useCallback(async () => {
    await handleSuperLike();
    setShowDetailView(false);
  }, [handleSuperLike]);

  const handleProfileClick = () => {
    if (currentProfile) {
      setShowDetailView(true);
    }
  };

  // Keyboard navigation for desktop
  useEffect(() => {
    if (isMobile || isLoading || noMoreProfiles || !currentProfile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPass();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onLike();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onSuperLike();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isLoading, noMoreProfiles, currentProfile, onPass, onLike, onSuperLike]);

  // Show detail view
  if (showDetailView && currentDetailProfile) {
    return (
      <ProfileDetailView
        profile={currentDetailProfile}
        onClose={() => setShowDetailView(false)}
        onPass={onPass}
        onSuperLike={onSuperLike}
        onLike={onLike}
      />
    );
  }

  // Empty state when no more profiles
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 relative">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
        <span className="text-5xl">🎣</span>
      </div>
      <h2 className="text-2xl font-bold mb-2">That's everyone for now!</h2>
      <p className="text-muted-foreground mb-6 max-w-xs">
        You've seen all the anglers nearby. Widen your filters or check back soon for new catches.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <QuickFiltersSheet 
          trigger={
            <Button variant="default" className="flex-1 gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Adjust Filters
            </Button>
          }
        />
        <Button 
          onClick={async () => {
            setIsRefreshing(true);
            await loadMoreProfiles();
            setTimeout(() => setIsRefreshing(false), 1000);
          }} 
          variant="outline" 
          className="flex-1 gap-2"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
    </div>
  );

  // Loading state
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 rounded-full bg-muted animate-pulse mb-4" />
      <div className="h-4 w-32 bg-muted animate-pulse rounded mb-2" />
      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
    </div>
  );

  return (
    <>
      <div className="flex h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-bottom))] lg:h-screen overflow-hidden overscroll-none">
        {/* Left Sidebar - Bumble style with conversations */}
        <DiscoverSidebar
          userName={profile?.display_name || 'User'}
          userPhoto={profile?.photos?.[0]}
          isPremium={profile?.is_premium || false}
          pendingLikes={pendingLikes || []}
          newMatches={recentMatches || []}
          onMatchClick={(matchId) => navigate(`/app/messages/${matchId}`)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-center overflow-hidden lg:ml-80">
          {isMobile ? (
            /* Mobile: Single column card */
            <div className="flex-1 flex flex-col items-center justify-center p-0 overflow-hidden w-full">
              <div className="w-full max-w-[calc(100vw-1rem)] sm:max-w-sm h-full flex flex-col items-center justify-center overscroll-none px-2 pt-2">
                {isLoading ? (
                  renderLoading()
                ) : noMoreProfiles || !currentProfile ? (
                  renderEmptyState()
                ) : (
                  <>
                    <div className="w-full flex-1 flex items-center justify-center min-h-0">
                      <ProfileCard
                        profile={currentProfile}
                        onInfoClick={handleProfileClick}
                        onSwipeLeft={onPass}
                        onSwipeRight={onLike}
                        className="w-full"
                      />
                    </div>

                    {/* Swipe Actions */}
                    <div className="w-full pt-2 pb-1">
                      <div className="mx-auto w-fit flex flex-col items-center gap-2">
                        <SwipeActions
                          onRewind={() => {}}
                          onPass={onPass}
                          onSuperLike={onSuperLike}
                          onLike={onLike}
                          canRewind={false}
                        />
                        <ReportProfileSheet
                          profileId={currentProfile.id}
                          profileName={currentProfile.name}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Desktop: Unified Card with integrated Info Panel */
            <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8">
              {isLoading ? (
                renderLoading()
              ) : noMoreProfiles || !currentProfile ? (
                renderEmptyState()
              ) : (
                <>
                  {/* Unified Profile Card with info panel */}
                  <ProfileCard 
                    profile={currentProfile} 
                    onInfoClick={handleProfileClick}
                    onSwipeLeft={onPass}
                    onSwipeRight={onLike}
                    showInfoPanel={true}
                  />

                  {/* Swipe Actions */}
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <SwipeActions
                      onRewind={() => {}}
                      onPass={onPass}
                      onSuperLike={onSuperLike}
                      onLike={onLike}
                      canRewind={false}
                    />
                    <ReportProfileSheet
                      profileId={currentProfile.id}
                      profileName={currentProfile.name}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Match Celebration Modal */}
      <MatchCelebrationModal
        open={!!matchedProfile}
        onClose={clearMatchedProfile}
        matchProfile={matchedProfile}
        currentUserPhoto={profile?.photos?.[0]}
      />

      {/* Dating Tutorial */}
      <DatingTutorial
        isRunning={isRunning}
        onComplete={completeTutorial}
        onStop={stopTutorial}
      />
    </>
  );
}
