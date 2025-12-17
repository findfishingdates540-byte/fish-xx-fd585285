import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DiscoverSidebar,
  ProfileCard,
  SwipeActions,
  RightSidebar,
  ProfileDetailView,
  type ProfileData,
  type ProfileDetailData,
} from '@/components/discover';
import coupleFishing from '@/assets/couple-fishing.jpg';
import datingCouple1 from '@/assets/dating-couple-1.jpg';
import datingCouple2 from '@/assets/dating-couple-2.jpg';

type DiscoveryMode = 'fishing' | 'dating' | 'combo';

// Mock data for demo
const mockProfile: ProfileData = {
  id: '1',
  name: 'Jessica',
  age: 28,
  location: 'Orlando, FL',
  distance: '5 miles away',
  bio: "Loves early morning casts and coffee. Looking for a first mate who knows how to tie a knot and...",
  photos: [coupleFishing, datingCouple1, datingCouple2],
  fishingType: 'Freshwater',
  tags: [
    { icon: '🎣', label: 'Bass Fishing' },
    { icon: '🚤', label: 'Boat Owner' },
    { icon: '📅', label: 'Weekend Angler' },
  ],
};

// Extended mock data for detail view
const mockProfileDetail: ProfileDetailData = {
  id: '1',
  name: 'Jessica',
  age: 28,
  location: 'Orlando, FL',
  distance: '15 miles away',
  bio: "Love early mornings on the lake. Looking for someone who knows how to bait a hook but isn't afraid to get their hands dirty. I spend most weekends on my kayak or hiking up to hidden streams. Let's trade fish stories! 🎣",
  photos: [coupleFishing, datingCouple1, datingCouple2],
  isVerified: true,
  isActive: true,
  height: "5'7\"",
  smoker: 'No',
  drinker: 'Socially',
  targetSpecies: 'Bass & Trout',
  bestCatch: '12lb Largemouth',
  ride: 'Ocean Kayak',
  interests: ['Fly Fishing', 'Camping', 'Morning Person', 'Sushi Lover', 'Hiking', 'Dogs'],
};

const mockMatches = [
  { id: '1', name: 'Sarah', photo: datingCouple1 },
  { id: '2', name: 'Jake', photo: coupleFishing },
  { id: '3', name: 'Emily', photo: datingCouple2 },
];

const mockConversations = [
  {
    id: '1',
    name: 'David W.',
    photo: coupleFishing,
    lastMessage: 'Did you catch anything on...',
    time: '12m',
  },
  {
    id: '2',
    name: 'Amanda K.',
    photo: datingCouple1,
    lastMessage: 'Nice catch! I usually go to...',
    time: '2h',
  },
  {
    id: '3',
    name: 'Robert T.',
    photo: datingCouple2,
    lastMessage: 'Lets go fishing this weekend?',
    time: '1d',
  },
];

export default function Discover() {
  const { accountMode } = useOutletContext<{ accountMode: 'dating' | 'fishing' | 'both' }>();
  const { user } = useAuth();
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>(
    accountMode === 'both' ? 'combo' : accountMode
  );
  const [showDetailView, setShowDetailView] = useState(false);

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

  const handlePass = () => {
    console.log('Passed');
    setShowDetailView(false);
  };

  const handleLike = () => {
    console.log('Liked');
    setShowDetailView(false);
  };

  const handleSuperLike = () => {
    console.log('Super liked');
    setShowDetailView(false);
  };

  const handleRewind = () => {
    console.log('Rewound');
  };

  const handleProfileClick = () => {
    setShowDetailView(true);
  };

  // Show detail view
  if (showDetailView) {
    return (
      <ProfileDetailView
        profile={mockProfileDetail}
        onClose={() => setShowDetailView(false)}
        onPass={handlePass}
        onSuperLike={handleSuperLike}
        onLike={handleLike}
      />
    );
  }

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
          <div onClick={handleProfileClick} className="cursor-pointer">
            <ProfileCard profile={mockProfile} />
          </div>

          {/* Swipe Actions */}
          <div className="mt-6">
            <SwipeActions
              onRewind={handleRewind}
              onPass={handlePass}
              onSuperLike={handleSuperLike}
              onLike={handleLike}
              canRewind={profile?.is_premium}
            />
          </div>

          {/* Keyboard hint - Desktop */}
          <p className="hidden lg:block text-center text-sm text-muted-foreground mt-4">
            Use <kbd className="px-1.5 py-0.5 bg-accent rounded text-xs">←</kbd> and{' '}
            <kbd className="px-1.5 py-0.5 bg-accent rounded text-xs">→</kbd> to navigate
          </p>
        </div>
      </main>

      {/* Right Sidebar - Desktop Only */}
      <RightSidebar
        newMatches={mockMatches}
        newMatchCount={4}
        conversations={mockConversations}
        isPremium={profile?.is_premium || false}
      />
    </div>
  );
}
