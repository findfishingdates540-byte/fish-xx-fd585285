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
  BumbleSwipeActions,
  ProfileCardStack,
  ProfileCard,
  SwipeActions,
  MatchCelebrationModal,
  DatingTutorial,
  DiscoverFiltersPopover,
  type DiscoverFilters,
} from '@/components/discover';
import { RefreshCw, Heart, Flag, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DiscoveryMode = 'fishing' | 'dating' | 'combo';

export default function Discover() {
  const { accountMode } = useOutletContext<{ accountMode: 'dating' | 'fishing' | 'both' }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>(
    accountMode === 'both' ? 'combo' : accountMode
  );
  
  const isMobile = useIsMobile();
  const { isRunning, shouldShowTutorial, startTutorial, completeTutorial, stopTutorial } = useDatingTutorial();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cardStackState, setCardStackState] = useState({ currentIndex: 0, totalCards: 1 });

  // Default filter values
  const defaultFilters: DiscoverFilters = {
    minAge: 18,
    maxAge: 65,
    maxDistance: 500, // 500 = unlimited
  };

  const [filters, setFilters] = useState<DiscoverFilters>(defaultFilters);

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
  } = useDiscoverProfiles({
    minAge: filters.minAge,
    maxAge: filters.maxAge,
    maxDistance: filters.maxDistance,
  });

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
  }, [handlePass]);

  const onLike = useCallback(async () => {
    await handleLike();
  }, [handleLike]);

  const onSuperLike = useCallback(async () => {
    await handleSuperLike();
  }, [handleSuperLike]);

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
      <div className="flex h-[100dvh] overflow-hidden">
        {/* Left Sidebar - Match Queue & Conversations */}
        <DiscoverLeftSidebar
          userName={profile?.display_name || 'User'}
          userPhoto={profile?.photos?.[0]}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-80 flex flex-col h-full min-h-0 overflow-hidden">
          {/* Top Bar - Only show on desktop when sidebar is visible */}
          <div className="hidden lg:flex h-14 flex-shrink-0 border-b border-border items-center justify-between px-6 bg-background">
            <DiscoverFiltersPopover
              filters={filters}
              onFiltersChange={setFilters}
              defaultFilters={defaultFilters}
            />
            
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-primary">Find Fishing Dates</span>
            </div>
            
            <div className="w-20" /> {/* Spacer for balance */}
          </div>

          {/* Profile Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 min-h-0 overflow-hidden">
            {isLoading ? (
              renderLoading()
            ) : noMoreProfiles || !currentProfile ? (
              renderEmptyState()
            ) : (
              <div className="relative flex flex-col items-center max-w-4xl w-full h-full max-h-full min-h-0">
                {/* Full Card Stack - Entire card swaps between different views */}
                <div className="relative w-full max-w-md lg:max-w-full flex-1 min-h-0 max-h-[calc(100%-6rem)] rounded-3xl overflow-hidden shadow-lg">
                  {/* Progress Indicator - Outside the cards, top-right of container */}
                  {cardStackState.totalCards > 1 && (
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
                      {Array.from({ length: cardStackState.totalCards }).map((_, i) => (
                        <div 
                          key={i}
                          className={`w-1 h-4 rounded-full transition-colors duration-200 ${
                            i === cardStackState.currentIndex ? 'bg-foreground' : 'bg-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Single ProfileCardStack that handles all cards including photo */}
                  <ProfileCardStack
                    profile={{
                      name: currentProfile.name,
                      age: currentProfile.age,
                      bio: currentDetailProfile?.bio,
                      occupation: (currentProfile as any).occupation || currentDetailProfile?.occupation,
                      idVerified: currentProfile.idVerified,
                      liveVerified: currentProfile.liveVerified,
                      interests: currentDetailProfile?.interests,
                      heightCm: currentDetailProfile?.heightCm,
                      smoker: currentDetailProfile?.smoker,
                      drinker: currentDetailProfile?.drinker,
                      zodiacSign: currentDetailProfile?.zodiacSign,
                      personalityType: currentDetailProfile?.personalityType,
                      promptResponses: currentDetailProfile?.promptResponses,
                    }}
                    profileCardData={currentProfile}
                    profileId={currentProfile.id}
                    onSwipeLeft={onPass}
                    onSwipeRight={onLike}
                    onCardChange={(currentIndex, totalCards) => setCardStackState({ currentIndex, totalCards })}
                    className="h-full"
                  />
                </div>

                {/* Overlapping Action Buttons - Centered on bottom of card */}
                <div className="-mt-14 z-20 flex-shrink-0">
                  <BumbleSwipeActions
                    onPass={onPass}
                    onSuperLike={onSuperLike}
                    onLike={onLike}
                  />
                </div>

                {/* Bottom Row - Block/Report and Keyboard Hints */}
                <div className="w-full flex items-center justify-between px-4 flex-shrink-0">
                  {/* Block and Report - Left */}
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Flag className="h-4 w-4" />
                    Block and report
                  </button>

                  {/* Spacer */}
                  <div />

                  {/* Keyboard Hints - Right, smaller on tablet */}
                  <div className="flex items-center gap-2 lg:gap-4 text-muted-foreground text-[10px] lg:text-xs">
                    <div className="flex items-center gap-0.5 lg:gap-1">
                      <kbd className="px-1 lg:px-1.5 py-0.5 bg-muted rounded border text-[10px] lg:text-xs">←</kbd>
                      <span>Pass</span>
                    </div>
                    <div className="flex items-center gap-0.5 lg:gap-1">
                      <kbd className="px-1 lg:px-1.5 py-0.5 bg-muted rounded border text-[10px] lg:text-xs">↑</kbd>
                      <span>Super</span>
                    </div>
                    <div className="flex items-center gap-0.5 lg:gap-1">
                      <kbd className="px-1 lg:px-1.5 py-0.5 bg-muted rounded border text-[10px] lg:text-xs">→</kbd>
                      <span>Like</span>
                    </div>
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
