import { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDiscoverProfiles } from '@/hooks/use-discover-profiles';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDatingTutorial } from '@/hooks/use-dating-tutorial';
import {
  DiscoverLeftSidebar,
  BumbleProfileCard,
  BumbleSwipeActions,
  ProfileInfoPanel,
  ProfileCard,
  SwipeActions,
  ProfileDetailView,
  MatchCelebrationModal,
  DatingTutorial,
} from '@/components/discover';
import { RefreshCw, Heart, SlidersHorizontal, Flag, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/logo.png';

type DiscoveryMode = 'fishing' | 'dating' | 'combo';

export default function Discover() {
  const { accountMode } = useOutletContext<{ accountMode: 'dating' | 'fishing' | 'both' }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>(
    accountMode === 'both' ? 'combo' : accountMode
  );
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
        .select('display_name, photos, is_premium, occupation')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Prevent vertical scrolling on mobile
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
    <div className="flex flex-col items-center justify-center text-center p-8 h-full">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <Heart className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">No more profiles</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        You've seen all available profiles in your area. Check back later or adjust your preferences.
      </p>
      <div className="flex gap-3">
        <Button 
          onClick={async () => {
            setIsRefreshing(true);
            await loadMoreProfiles();
            setTimeout(() => setIsRefreshing(false), 1000);
          }} 
          variant="outline" 
          className="gap-2"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
        <Button onClick={startTutorial} variant="ghost" className="gap-2" disabled>
          <HelpCircle className="h-4 w-4" />
          Tutorial
        </Button>
      </div>
    </div>
  );

  // Loading state
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center p-8 h-full">
      <div className="w-20 h-20 rounded-full bg-muted animate-pulse mb-4" />
      <div className="h-4 w-32 bg-muted animate-pulse rounded mb-2" />
      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
    </div>
  );

  // Mobile Layout - Single column card
  if (isMobile) {
    return (
      <>
        <div className="h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-bottom))] flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center p-2 min-h-0">
            {isLoading ? (
              renderLoading()
            ) : noMoreProfiles || !currentProfile ? (
              renderEmptyState()
            ) : (
              <>
                <div className="w-full max-w-sm flex-1 flex items-center justify-center min-h-0">
                  <ProfileCard
                    profile={currentProfile}
                    onInfoClick={handleProfileClick}
                    onSwipeLeft={onPass}
                    onSwipeRight={onLike}
                    className="w-full h-full"
                  />
                </div>
                <div className="w-full pt-2 pb-1">
                  <div className="mx-auto w-fit">
                    <SwipeActions
                      onRewind={() => {}}
                      onPass={onPass}
                      onSuperLike={onSuperLike}
                      onLike={onLike}
                      canRewind={false}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <MatchCelebrationModal
          open={!!matchedProfile}
          onClose={clearMatchedProfile}
          matchProfile={matchedProfile}
          currentUserPhoto={profile?.photos?.[0]}
        />

        <DatingTutorial
          isRunning={isRunning}
          onComplete={completeTutorial}
          onStop={stopTutorial}
        />
      </>
    );
  }

  // Desktop Layout - Bumble-style 2-column
  return (
    <>
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar - Match Queue & Conversations */}
        <DiscoverLeftSidebar
          userName={profile?.display_name || 'User'}
          userPhoto={profile?.photos?.[0]}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-80 flex flex-col">
          {/* Top Bar */}
          <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-background">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Logo" className="h-8 w-8 rounded" />
              <span className="font-bold text-lg text-primary">Find Fishing Dates</span>
            </div>
            
            <div className="w-20" /> {/* Spacer for balance */}
          </div>

          {/* Profile Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
            {isLoading ? (
              renderLoading()
            ) : noMoreProfiles || !currentProfile ? (
              renderEmptyState()
            ) : (
              <div className="relative flex flex-col items-center max-w-4xl w-full">
                {/* Combined Profile Card */}
                <div className="flex gap-0 w-full h-[600px] max-h-[75vh] rounded-3xl overflow-hidden shadow-lg">
                  {/* Profile Card - Left Side (~60%) */}
                  <div className="w-[60%] h-full">
                    <BumbleProfileCard
                      profile={currentProfile}
                      onSwipeLeft={onPass}
                      onSwipeRight={onLike}
                      onExpandClick={handleProfileClick}
                      className="h-full rounded-none"
                    />
                  </div>

                  {/* Profile Info Panel - Right Side (~40%) */}
                  <div className="w-[40%] h-full">
                    <ProfileInfoPanel
                      name={currentProfile.name}
                      age={currentProfile.age}
                      occupation={(currentProfile as any).occupation}
                      idVerified={currentProfile.idVerified}
                      liveVerified={currentProfile.liveVerified}
                      onMoreClick={handleProfileClick}
                    />
                  </div>
                </div>

                {/* Overlapping Action Buttons - Centered on bottom of card */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20">
                  <BumbleSwipeActions
                    onPass={onPass}
                    onSuperLike={onSuperLike}
                    onLike={onLike}
                  />
                </div>

                {/* Bottom Row - Block/Report and Keyboard Hints */}
                <div className="w-full flex items-center justify-between px-4 mt-14">
                  {/* Block and Report - Left */}
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Flag className="h-4 w-4" />
                    Block and report
                  </button>

                  {/* Spacer */}
                  <div />

                  {/* Keyboard Hints - Right */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs">←</kbd>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs">↓</kbd>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs">→</kbd>
                  </div>
                </div>
              </div>
            )}
          </div>
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
