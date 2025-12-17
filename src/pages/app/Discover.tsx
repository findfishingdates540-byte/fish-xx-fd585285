import { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DiscoverSidebar,
  CardStack,
  SwipeActions,
  RightSidebar,
  type ProfileData,
} from '@/components/discover';
import coupleFishing from '@/assets/couple-fishing.jpg';
import datingCouple1 from '@/assets/dating-couple-1.jpg';
import datingCouple2 from '@/assets/dating-couple-2.jpg';

type DiscoveryMode = 'fishing' | 'dating' | 'combo';

// Mock data for demo
const mockProfiles: ProfileData[] = [
  {
    id: '1',
    name: 'Jessica',
    age: 28,
    location: 'Orlando, FL',
    distance: '5 miles away',
    bio: "Loves early morning casts and coffee. Looking for a first mate who knows how to tie a knot and appreciate a good sunrise.",
    photos: [coupleFishing, datingCouple1, datingCouple2],
    fishingType: 'Freshwater',
    tags: [
      { icon: '🎣', label: 'Bass Fishing' },
      { icon: '🚤', label: 'Boat Owner' },
      { icon: '📅', label: 'Weekend Angler' },
    ],
  },
  {
    id: '2',
    name: 'Amanda',
    age: 26,
    location: 'Tampa, FL',
    distance: '12 miles away',
    bio: "Deep sea fishing enthusiast. Looking for someone to share the thrill of the catch and sunset views on the water.",
    photos: [datingCouple1, coupleFishing],
    fishingType: 'Saltwater',
    tags: [
      { icon: '🌊', label: 'Deep Sea' },
      { icon: '🐟', label: 'Tournament Fisher' },
      { icon: '☀️', label: 'Morning Person' },
    ],
  },
  {
    id: '3',
    name: 'Sarah',
    age: 30,
    location: 'Miami, FL',
    distance: '8 miles away',
    bio: "Kayak fishing fanatic. Let's paddle somewhere beautiful and see what we can catch together!",
    photos: [datingCouple2, datingCouple1],
    fishingType: 'Kayak Fishing',
    tags: [
      { icon: '🛶', label: 'Kayak Fisher' },
      { icon: '🏕️', label: 'Outdoorsy' },
      { icon: '📸', label: 'Catch & Release' },
    ],
  },
];

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
  
  // Store action refs for button controls
  const actionsRef = useRef<{ like: () => void; pass: () => void } | null>(null);

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

  const handleLike = (likedProfile: ProfileData) => {
    toast.success(`Liked ${likedProfile.name}!`, {
      description: 'If they like you back, it\'s a match!',
    });
  };

  const handlePass = (passedProfile: ProfileData) => {
    console.log('Passed on', passedProfile.name);
  };

  const handleSuperLike = () => {
    toast('Super Like sent!', {
      description: 'They\'ll know you really like them.',
    });
  };

  const handleRewind = () => {
    toast('Rewind used', {
      description: 'Go Premium for unlimited rewinds!',
    });
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
        <div className="w-full max-w-sm flex flex-col items-center">
          {/* Swipeable Card Stack */}
          <CardStack
            profiles={mockProfiles}
            onLike={handleLike}
            onPass={handlePass}
          />

          {/* Swipe Actions */}
          <div className="mt-6">
            <SwipeActions
              onRewind={handleRewind}
              onPass={() => {
                // Trigger keyboard event for pass
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
              }}
              onSuperLike={handleSuperLike}
              onLike={() => {
                // Trigger keyboard event for like
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
              }}
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
