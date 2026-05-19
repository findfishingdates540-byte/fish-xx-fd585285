import { useState, useEffect, useCallback, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDiscoverProfiles } from '@/hooks/use-discover-profiles';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDatingTutorial } from '@/hooks/use-dating-tutorial';
import { useProfileCompletionGuide } from '@/hooks/use-profile-completion-guide';
import {
  DiscoverLeftSidebar,
  BumbleSwipeActions,
  ProfileCardStack,
  ProfileCard,
  SwipeActions,
  MatchCelebrationModal,
  DatingTutorial,
  DiscoverFiltersPopover,
  MobileProfileDetail,
  type DiscoverFilters,
} from '@/components/discover';
import { RefreshCw, Heart, Flag, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileCompletionBanner } from '@/components/profile';
import { AdBanner } from '@/components/ads/AdBanner';

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
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const hasAutoNavigated = useRef(false);

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

  const { data: profile, isLoading: isProfileLoading, isFetching: isProfileFetching } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, photos, is_premium, occupation, bio, height_cm, smoking, drinking, zodiac_sign, city, state')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30000, // Cache for 30 seconds to prevent unnecessary refetches
  });

  // Profile completion guide - for auto-navigation
  const {
    shouldAutoNavigate,
    markGuideShown,
  } = useProfileCompletionGuide(isProfileLoading || isProfileFetching ? null : profile);

  // Auto-navigate to profile edit on first detection of incomplete profile
  useEffect(() => {
    if (
      !isProfileLoading && 
      !isProfileFetching && 
      shouldAutoNavigate && 
      !hasAutoNavigated.current
    ) {
      hasAutoNavigated.current = true;
      markGuideShown();
      navigate('/app/profile/edit?guide=true');
    }
  }, [isProfileLoading, isProfileFetching, shouldAutoNavigate, markGuideShown, navigate]);

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

  // Mobile Layout - Bumble-style card with bio/tags visible
  if (isMobile) {
    return (
      <>
        <div className="h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-bottom))] flex flex-col overflow-hidden bg-background">
          {/* Profile Completion Banner */}
          <ProfileCompletionBanner profile={profile} isLoading={isProfileLoading || isProfileFetching} />
          
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 min-h-0">
            {isLoading ? (
              renderLoading()
            ) : noMoreProfiles || !currentProfile ? (
              renderEmptyState()
            ) : (
              <div className="w-full max-w-sm h-full flex flex-col min-h-0">
                {/* Profile Card Container - Full height, no action buttons */}
                <div className="flex-1 min-h-0 bg-background rounded-3xl overflow-hidden shadow-lg">
                  <ProfileCard
                    profile={{
                      ...currentProfile,
                      occupation: currentDetailProfile?.occupation,
                    }}
                    onSwipeLeft={onPass}
                    onSwipeRight={onLike}
                    onSuperLike={onSuperLike}
                    onInfoClick={() => setShowMobileDetail(true)}
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <MatchCelebrationModal
          open={!!matchedProfile}
          onClose={clearMatchedProfile}
          matchProfile={matchedProfile}
          currentUserPhoto={profile?.photos?.[0]}
        />

        {currentProfile && currentDetailProfile && (
          <MobileProfileDetail
            open={showMobileDetail}
            onClose={() => setShowMobileDetail(false)}
            profile={{
              name: currentProfile.name,
              age: currentProfile.age,
              location: currentProfile.location,
              distance: currentProfile.distance,
              bio: currentDetailProfile.bio,
              occupation: currentDetailProfile.occupation,
              idVerified: currentProfile.idVerified,
              liveVerified: currentProfile.liveVerified,
              photos: currentProfile.photos,
              interests: currentDetailProfile.interests,
              heightCm: currentDetailProfile.heightCm,
              smoker: currentDetailProfile.smoker,
              drinker: currentDetailProfile.drinker,
              zodiacSign: currentDetailProfile.zodiacSign,
              personalityType: currentDetailProfile.personalityType,
              promptResponses: currentDetailProfile.promptResponses,
              tags: currentProfile.tags,
            }}
          />
        )}

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
          {/* Profile Completion Banner - Desktop */}
          <ProfileCompletionBanner profile={profile} isLoading={isProfileLoading || isProfileFetching} />
          
          {/* Top Bar - Only show on desktop when sidebar is visible */}
          <div className="hidden lg:flex h-14 flex-shrink-0 border-b border-border items-center justify-between px-6 bg-background">
            <DiscoverFiltersPopover
              filters={filters}
              onFiltersChange={setFilters}
              defaultFilters={defaultFilters}
            />
            
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-primary">Fish-X</span>
            </div>
            
            <div className="w-20" /> {/* Spacer for balance */}
          </div>

          {/* Sponsored banner above the swipe area — auto-hidden for premium users */}
          <div className="hidden lg:block px-6 pt-3">
            <AdBanner variant="compact" />
          </div>

          {/* Profile Content */}
          <div className="relative flex-1 flex flex-col items-center justify-center p-4 lg:p-6 min-h-0 overflow-hidden">
            {/* Filter - Tablet only, top-left floating */}
            <div className="hidden md:block lg:hidden absolute top-4 left-4 z-30">
              <DiscoverFiltersPopover
                filters={filters}
                onFiltersChange={setFilters}
                defaultFilters={defaultFilters}
              />
            </div>

            {isLoading ? (
              renderLoading()
            ) : noMoreProfiles || !currentProfile ? (
              renderEmptyState()
            ) : (
              <div className="relative flex flex-col items-center max-w-4xl w-full h-full max-h-full min-h-0">
                {/* Full Card Stack - Entire card swaps between different views */}
                <div className="relative w-full max-w-md lg:max-w-full flex-1 min-h-0 max-h-[calc(100%-8rem)] lg:max-h-[calc(100%-6rem)] rounded-3xl overflow-hidden shadow-lg">
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
                <div className="-mt-10 z-20 flex-shrink-0">
                  <BumbleSwipeActions
                    onPass={onPass}
                    onSuperLike={onSuperLike}
                    onLike={onLike}
                  />
                </div>

                {/* Bottom Row - Block/Report, Filter (tablet), and Keyboard Hints */}
                <div className="w-full flex items-center justify-between px-4 mt-auto pt-4 flex-shrink-0">
                  {/* Block and Report - Left */}
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Flag className="h-4 w-4" />
                    Block and report
                  </button>


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
