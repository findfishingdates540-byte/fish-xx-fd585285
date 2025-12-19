import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDiscoverProfiles } from '@/hooks/use-discover-profiles';
import {
  DiscoverSidebar,
  ProfileCard,
  SwipeActions,
  RightSidebar,
  ProfileDetailView,
} from '@/components/discover';
import { RefreshCw, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DiscoveryMode = 'fishing' | 'dating' | 'combo';

export default function Discover() {
  const { accountMode } = useOutletContext<{ accountMode: 'dating' | 'fishing' | 'both' }>();
  const { user } = useAuth();
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>(
    accountMode === 'both' ? 'combo' : accountMode
  );
  const [showDetailView, setShowDetailView] = useState(false);

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

  // Mock data for sidebar (will be wired up in Phase 2 & 3)
  const mockMatches = [
    { id: '1', name: 'Sarah', photo: '' },
    { id: '2', name: 'Jake', photo: '' },
  ];
  const mockConversations = [
    { id: '1', name: 'David W.', photo: '', lastMessage: 'Hey!', time: '12m' },
  ];

  const onPass = async () => {
    await handlePass();
    setShowDetailView(false);
  };

  const onLike = async () => {
    await handleLike();
    setShowDetailView(false);
  };

  const onSuperLike = async () => {
    await handleSuperLike();
    setShowDetailView(false);
  };

  const handleProfileClick = () => {
    if (currentProfile) {
      setShowDetailView(true);
    }
  };

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
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <Heart className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">No more profiles</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        You've seen all available profiles in your area. Check back later or adjust your preferences to see more people.
      </p>
      <Button onClick={loadMoreProfiles} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Refresh Profiles
      </Button>
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
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
      {/* Left Sidebar - Desktop Only */}
      <DiscoverSidebar
        accountMode={accountMode}
        discoveryMode={discoveryMode}
        onDiscoveryModeChange={setDiscoveryMode}
        userName={profile?.display_name || 'User'}
        userPhoto={profile?.photos?.[0]}
        isPremium={profile?.is_premium || false}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden lg:ml-60">
        <div className="w-full max-w-sm">
          {isLoading ? (
            renderLoading()
          ) : noMoreProfiles || !currentProfile ? (
            renderEmptyState()
          ) : (
            <>
              <div onClick={handleProfileClick} className="cursor-pointer">
                <ProfileCard profile={currentProfile} />
              </div>

              {/* Swipe Actions */}
              <div className="mt-6">
                <SwipeActions
                  onRewind={() => {}} // Rewind requires storing history - future enhancement
                  onPass={onPass}
                  onSuperLike={onSuperLike}
                  onLike={onLike}
                  canRewind={false}
                />
              </div>

              {/* Keyboard hint - Desktop */}
              <p className="hidden lg:block text-center text-sm text-muted-foreground mt-4">
                Use <kbd className="px-1.5 py-0.5 bg-accent rounded text-xs">←</kbd> and{' '}
                <kbd className="px-1.5 py-0.5 bg-accent rounded text-xs">→</kbd> to navigate
              </p>
            </>
          )}
        </div>
      </main>

      {/* Right Sidebar - Desktop Only */}
      <RightSidebar
        newMatches={mockMatches}
        newMatchCount={0}
        conversations={mockConversations}
        isPremium={profile?.is_premium || false}
      />
    </div>
  );
}
