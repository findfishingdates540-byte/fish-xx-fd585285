import { useState, useMemo } from 'react';
import { Bell, Settings, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchCard } from '@/components/matches/MatchCard';
import { MatchFilters } from '@/components/matches/MatchFilters';
import { DiscoverSidebar } from '@/components/discover/DiscoverSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { useOnlineStatus, formatLastSeen } from '@/hooks/use-online-presence';
import { useMatches } from '@/hooks/use-matches';
import { Skeleton } from '@/components/ui/skeleton';

export default function Matches() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  // Fetch real matches
  const { matches, isLoading } = useMatches();

  // Get all match user IDs for online status tracking
  const matchUserIds = useMemo(() => matches.map(m => m.id), [matches]);
  const { isOnline, getLastSeen } = useOnlineStatus(matchUserIds);

  // Filter matches by search query and active filter
  const filteredMatches = useMemo(() => {
    let filtered = matches.filter((match) =>
      match.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeFilter === 'new') {
      filtered = filtered.filter(m => m.isNew);
    } else if (activeFilter === 'online') {
      filtered = filtered.filter(m => isOnline(m.id));
    }

    return filtered;
  }, [matches, searchQuery, activeFilter, isOnline]);

  const handleStartChat = (matchId: string) => {
    navigate(`/app/messages/${matchId}`);
  };

  const handleSayHi = (matchId: string) => {
    // Navigate to chat - could pre-fill with "Hi!" message in future
    navigate(`/app/messages/${matchId}`);
  };

  const handleWave = (matchId: string) => {
    // Navigate to chat - could send a wave emoji in future
    navigate(`/app/messages/${matchId}`);
  };

  // Loading skeleton
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-background border border-border rounded-2xl p-6 flex flex-col items-center">
          <Skeleton className="h-24 w-24 rounded-full mb-4" />
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-3 w-16 mb-3" />
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      ))}
    </div>
  );

  // Empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Heart className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No matches yet</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-4">
        Keep swiping in Discover to find your perfect fishing partner!
      </p>
      <Button asChild>
        <Link to="/app/discover">Go to Discover</Link>
      </Button>
    </div>
  );

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
              {matches.length > 0 
                ? `You have ${matches.length} match${matches.length === 1 ? '' : 'es'}. Start a conversation!`
                : 'Reel in a conversation with your latest matches.'}
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
        {isLoading ? (
          renderSkeleton()
        ) : filteredMatches.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMatches.map((match) => {
                const online = isOnline(match.id);
                const lastSeen = getLastSeen(match.id);
                
                return (
                  <MatchCard
                    key={match.id}
                    id={match.id}
                    name={match.name}
                    age={match.age || 0}
                    photo={match.photo}
                    bio={match.bio}
                    isVerified={match.isVerified}
                    isNew={match.isNew}
                    status={online ? 'online' : 'offline'}
                    lastSeen={!online ? formatLastSeen(lastSeen) || undefined : undefined}
                    onSayHi={() => handleSayHi(match.matchId)}
                    onStartChat={() => handleStartChat(match.matchId)}
                    onWave={() => handleWave(match.matchId)}
                  />
                );
              })}
            </div>
            <p className="text-center text-muted-foreground mt-8">
              That's all your matches for now!
            </p>
          </>
        ) : matches.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">No matches found for "{searchQuery}"</p>
          </div>
        )}
      </main>
    </div>
  );
}
