import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
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
  MatchCelebrationModal,
} from '@/components/discover';
import { RefreshCw, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

type DiscoveryMode = 'fishing' | 'dating' | 'combo';

export default function Discover() {
  const { accountMode } = useOutletContext<{ accountMode: 'dating' | 'fishing' | 'both' }>();
  const { user } = useAuth();
  const navigate = useNavigate();
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
          user1:profiles!matches_user1_id_fkey(display_name, photos),
          user2:profiles!matches_user2_id_fkey(display_name, photos)
        `)
        .eq('is_match', true)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .gte('matched_at', sevenDaysAgo.toISOString())
        .order('matched_at', { ascending: false })
        .limit(10);
      
      return (data || []).map((match: any) => {
        const otherUser = match.user1_id === user.id ? match.user2 : match.user1;
        return {
          id: match.id,
          name: otherUser?.display_name || 'Someone',
          photo: otherUser?.photos?.[0] || '',
        };
      });
    },
    enabled: !!user?.id,
  });

  // Fetch recent conversations with last message
  const { data: conversations } = useQuery({
    queryKey: ['recent-conversations-sidebar', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get all matches
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          user1:profiles!matches_user1_id_fkey(display_name, photos),
          user2:profiles!matches_user2_id_fkey(display_name, photos)
        `)
        .eq('is_match', true)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      
      if (!matchesData || matchesData.length === 0) return [];

      // Get latest message for each match
      const conversationsWithMessages = await Promise.all(
        matchesData.map(async (match: any) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1);
          
          const lastMessage = messages?.[0];
          if (!lastMessage) return null;

          const otherUser = match.user1_id === user.id ? match.user2 : match.user1;
          
          return {
            id: match.id,
            name: otherUser?.display_name || 'Someone',
            photo: otherUser?.photos?.[0] || '',
            lastMessage: lastMessage.content.slice(0, 30) + (lastMessage.content.length > 30 ? '...' : ''),
            time: formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: false }),
          };
        })
      );

      return conversationsWithMessages
        .filter(Boolean)
        .slice(0, 5);
    },
    enabled: !!user?.id,
  });

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
    <>
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
          newMatches={recentMatches || []}
          newMatchCount={recentMatches?.length || 0}
          conversations={conversations || []}
          isPremium={profile?.is_premium || false}
          onMatchClick={(matchId) => navigate(`/app/chat/${matchId}`)}
          onConversationClick={(matchId) => navigate(`/app/chat/${matchId}`)}
        />
      </div>

      {/* Match Celebration Modal */}
      <MatchCelebrationModal
        open={!!matchedProfile}
        onClose={clearMatchedProfile}
        matchProfile={matchedProfile}
        currentUserPhoto={profile?.photos?.[0]}
      />
    </>
  );
}
