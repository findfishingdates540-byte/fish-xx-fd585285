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
  type ProfileData,
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
  };

  const handleLike = () => {
    console.log('Liked');
  };

  const handleSuperLike = () => {
    console.log('Super liked');
  };

  const handleRewind = () => {
    console.log('Rewound');
  };

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
      <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden">
        <div className="w-full max-w-sm">
          <ProfileCard profile={mockProfile} />

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
