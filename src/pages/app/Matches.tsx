import { useState, useMemo } from 'react';
import { Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchCard } from '@/components/matches/MatchCard';
import { MatchFilters } from '@/components/matches/MatchFilters';
import { DiscoverSidebar } from '@/components/discover/DiscoverSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useOnlineStatus, formatLastSeen } from '@/hooks/use-online-presence';

// Mock data for matches - will be replaced with real data
const mockMatches = [
  {
    id: '1',
    name: 'Sarah',
    age: 26,
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    bio: 'Love fly fishing on weekends. Looking for someone to share the adventure.',
    isVerified: true,
    isNew: false,
    status: 'online' as const,
  },
  {
    id: '2',
    name: 'Mike',
    age: 32,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    bio: 'Currently at Lake Tahoe. Bass fishing is great here!',
    isVerified: false,
    isNew: false,
    status: 'gone_fishing' as const,
  },
  {
    id: '3',
    name: 'Jessica',
    age: 29,
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    bio: 'Ask me about my biggest catch! Hint: It was a 12lb bass.',
    isVerified: false,
    isNew: false,
    status: 'offline' as const,
    lastSeen: '2h ago',
  },
  {
    id: '4',
    name: 'David',
    age: 35,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    bio: "Just got back from a trip to Alaska. Let's swap fishing stories!",
    isVerified: false,
    isNew: true,
    status: 'online' as const,
  },
  {
    id: '5',
    name: 'Emily',
    age: 24,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    bio: 'New to fishing, looking for someone to teach me the ropes.',
    isVerified: false,
    isNew: false,
    status: 'offline' as const,
    lastSeen: '15m ago',
  },
  {
    id: '6',
    name: 'Chris',
    age: 30,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    bio: "Saltwater enthusiast. Boat owner. Let's go!",
    isVerified: false,
    isNew: false,
    status: 'gone_fishing' as const,
  },
  {
    id: '7',
    name: 'Amanda',
    age: 27,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    bio: 'Strictly Catch & Release 🐟',
    isVerified: false,
    isNew: false,
    status: 'online' as const,
  },
  {
    id: '8',
    name: 'Tom',
    age: 33,
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    bio: 'Looking for a partner for the upcoming derby.',
    isVerified: false,
    isNew: false,
    status: 'offline' as const,
    lastSeen: '1d ago',
  },
];

export default function Matches() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const accountMode = profile?.account_mode || 'both';

  // Get all match user IDs for online status tracking
  const matchUserIds = useMemo(() => mockMatches.map(m => m.id), []);
  const { isOnline, getLastSeen } = useOnlineStatus(matchUserIds);

  const filteredMatches = mockMatches.filter((match) =>
    match.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSayHi = (id: string) => {
    console.log('Say Hi to:', id);
  };

  const handleStartChat = (id: string) => {
    console.log('Start Chat with:', id);
  };

  const handleWave = (id: string) => {
    console.log('Wave at:', id);
  };

  return (
    <div className="flex min-h-screen w-full bg-accent/30 overflow-hidden">
      <DiscoverSidebar
        accountMode={accountMode}
        discoveryMode="dating"
        onDiscoveryModeChange={() => {}}
        userName={profile?.display_name || 'User'}
        userPhoto={profile?.photos?.[0]}
        isPremium={profile?.is_premium}
      />

      <main className="flex-1 p-6 lg:p-8 overflow-auto lg:ml-60">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Your Catch</h1>
            <p className="text-muted-foreground mt-1">
              Reel in a conversation with your latest matches.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" asChild>
              <Link to="/app/profile">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <MatchFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>

        {/* Matches Grid */}
        {filteredMatches.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  {...match}
                  status={isOnline(match.id) ? 'online' : match.status}
                  lastSeen={!isOnline(match.id) ? formatLastSeen(getLastSeen(match.id)) || match.lastSeen : undefined}
                  onSayHi={() => handleSayHi(match.id)}
                  onStartChat={() => handleStartChat(match.id)}
                  onWave={() => handleWave(match.id)}
                />
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-8">
              That's all your matches for now!
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">No matches found.</p>
          </div>
        )}
      </main>
    </div>
  );
}
