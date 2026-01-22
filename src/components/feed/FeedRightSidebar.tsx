import { Link } from 'react-router-dom';
import { Star, UserPlus, Cake, Circle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, isToday, parseISO } from 'date-fns';

export function FeedRightSidebar() {
  const { user } = useAuth();

  // Fetch trending spots
  const { data: trendingSpots = [] } = useQuery({
    queryKey: ['trending-spots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fishing_spots')
        .select('id, name, photos, rating_avg, rating_count')
        .eq('is_public', true)
        .order('rating_avg', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch pending buddy requests
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pending-requests-sidebar', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: requests } = await supabase
        .from('fishing_buddies')
        .select('id, requester_id')
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .limit(2);

      if (!requests || requests.length === 0) return [];

      const requesterIds = requests.map(r => r.requester_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photos')
        .in('id', requesterIds);

      return requests.map(r => ({
        ...r,
        profile: profiles?.find(p => p.id === r.requester_id)
      }));
    },
    enabled: !!user?.id,
  });

  // Fetch birthdays today
  const { data: birthdays = [] } = useQuery({
    queryKey: ['birthdays-today', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get buddies first
      const { data: relationships } = await supabase
        .from('fishing_buddies')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (!relationships || relationships.length === 0) return [];

      const buddyIds = relationships.map(r => 
        r.requester_id === user.id ? r.recipient_id : r.requester_id
      );

      // Get profiles with birthdays
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photos, date_of_birth')
        .in('id', buddyIds)
        .not('date_of_birth', 'is', null);

      if (!profiles) return [];

      // Filter for today's birthdays
      const today = new Date();
      return profiles.filter(p => {
        if (!p.date_of_birth) return false;
        const dob = parseISO(p.date_of_birth);
        return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
      });
    },
    enabled: !!user?.id,
  });

  // Fetch online contacts
  const { data: onlineContacts = [] } = useQuery({
    queryKey: ['online-contacts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: relationships } = await supabase
        .from('fishing_buddies')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (!relationships || relationships.length === 0) return [];

      const buddyIds = relationships.map(r => 
        r.requester_id === user.id ? r.recipient_id : r.requester_id
      );

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photos, last_active_at')
        .in('id', buddyIds)
        .gte('last_active_at', fiveMinutesAgo)
        .limit(8);

      return profiles || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleAcceptRequest = async (requestId: string) => {
    await supabase
      .from('fishing_buddies')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', requestId);
  };

  const handleDeclineRequest = async (requestId: string) => {
    await supabase
      .from('fishing_buddies')
      .update({ status: 'declined' })
      .eq('id', requestId);
  };

  return (
    <div className="sticky top-20 space-y-4">
      {/* Buddy Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Buddy Requests</h3>
            <Link to="/app/buddies" className="text-xs text-primary hover:underline">
              See All
            </Link>
          </div>
          
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={request.profile?.photos?.[0]} />
                  <AvatarFallback>
                    {request.profile?.display_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {request.profile?.display_name || 'Someone'}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Button 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-xs"
                      onClick={() => handleDeclineRequest(request.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Birthdays */}
      {birthdays.length > 0 && (
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="h-4 w-4 text-pink-500" />
            <h3 className="font-semibold text-sm">Birthdays</h3>
          </div>
          
          <div className="space-y-2">
            {birthdays.map((buddy) => (
              <Link
                key={buddy.id}
                to={`/app/u/${buddy.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={buddy.photos?.[0]} />
                  <AvatarFallback>
                    {buddy.display_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {buddy.display_name}'s birthday is today!
                  </p>
                </div>
                <span className="text-lg">🎂</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending Spots */}
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Trending Spots</h3>
          <Link to="/app/spots" className="text-xs text-primary hover:underline">
            View All
          </Link>
        </div>

        <div className="space-y-3">
          {trendingSpots.length > 0 ? (
            trendingSpots.map((spot) => (
              <Link
                key={spot.id}
                to={`/app/spots/${spot.id}`}
                className="flex items-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {spot.photos?.[0] ? (
                    <img
                      src={spot.photos[0]}
                      alt={spot.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {spot.name}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{spot.rating_avg?.toFixed(1) || '0.0'}</span>
                    <span>•</span>
                    <span>{spot.rating_count || 0} reviews</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No trending spots yet</p>
          )}
        </div>
      </div>

      {/* Online Contacts */}
      {onlineContacts.length > 0 && (
        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Contacts</h3>
          
          <div className="space-y-1">
            {onlineContacts.map((contact) => (
              <Link
                key={contact.id}
                to={`/app/buddy-messages`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={contact.photos?.[0]} />
                    <AvatarFallback className="text-xs">
                      {contact.display_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border-2 border-card" />
                </div>
                <span className="text-sm truncate">{contact.display_name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer Links */}
      <div className="text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
          <Link to="/about" className="hover:underline">About</Link>
          <Link to="/safety" className="hover:underline">Safety</Link>
          <Link to="/help" className="hover:underline">Help</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          <Link to="/terms" className="hover:underline">Terms</Link>
        </div>
        <p>© 2025 Find Fishing Date LLC.</p>
      </div>
    </div>
  );
}
