import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Calendar, MapPin, Fish } from 'lucide-react';
import { FishXIcon, type FishXIconName } from '@/components/ui/fishx-icon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UpgradeModal } from '@/components/upgrade/UpgradeModal';
import { format } from 'date-fns';

export function FeedLeftSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [upgradeType, setUpgradeType] = useState<'dating' | 'combo' | 'fishing'>('fishing');

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['user-profile-sidebar', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, photos')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['user-feed-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { catchesLogged: 0, tripsPlanned: 0, spotsVisited: 0 };

      const [catchesResult, tripsResult, spotsResult] = await Promise.all([
        supabase
          .from('catches')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('fishing_trips')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('user_saved_spots')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      return {
        catchesLogged: catchesResult.count || 0,
        tripsPlanned: tripsResult.count || 0,
        spotsVisited: spotsResult.count || 0,
      };
    },
    enabled: !!user?.id,
  });

  // Fetch upcoming trip
  const { data: upcomingTrip } = useQuery({
    queryKey: ['upcoming-trip-sidebar', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('fishing_trips')
        .select('id, title, trip_date, location_name, start_time')
        .eq('user_id', user.id)
        .gte('trip_date', today)
        .eq('status', 'planned')
        .order('trip_date', { ascending: true })
        .limit(1)
        .single();

      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch pending buddy requests count for nav badge
  const { data: pendingCount } = useQuery({
    queryKey: ['pending-buddy-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count } = await supabase
        .from('fishing_buddies')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('status', 'pending');

      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Navigation items (themed FishX icons)
  const navItems: Array<{ to: string; icon: FishXIconName; label: string; badge?: number }> = [
    { to: '/app/buddies', icon: 'social', label: 'Friends', badge: pendingCount || undefined },
    { to: '/app/catches', icon: 'catchlog', label: 'My Catches' },
    { to: '/app/trips', icon: 'events', label: 'Trips' },
    { to: '/app/spots', icon: 'map', label: 'Saved Spots' },
    { to: '/app/challenges', icon: 'achievement', label: 'Challenges' },
    { to: '/app/photo-challenges', icon: 'photo', label: 'Photo Challenges' },
    { to: '/app/tournaments', icon: 'tournament', label: 'Tournaments' },
  ];

  return (
    <>
      <div className="sticky top-20 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide">
        {/* User Profile Card */}
        {user && (
          <div className="bg-card rounded-xl border overflow-hidden">
            {/* Cover gradient */}
            <div className="h-12 bg-gradient-to-r from-primary/20 to-primary/10" />
            
            {/* Profile info */}
            <div className="px-3 pb-3 -mt-6">
              <Link to="/app/profile" className="block">
                <Avatar className="h-12 w-12 border-2 border-card">
                  <AvatarImage src={profile?.photos?.[0]} alt={profile?.display_name || ''} />
                  <AvatarFallback className="text-sm">{profile?.display_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </Link>
              
              <Link to="/app/profile" className="mt-1.5 block hover:underline">
                <h3 className="font-semibold text-sm">{profile?.display_name || 'Angler'}</h3>
              </Link>
              
              {/* Quick stats */}
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                <div className="p-1.5 rounded-lg bg-muted/50">
                  <p className="text-sm font-semibold">{stats?.catchesLogged || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Catches</p>
                </div>
                <div className="p-1.5 rounded-lg bg-muted/50">
                  <p className="text-sm font-semibold">{stats?.tripsPlanned || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Trips</p>
                </div>
                <div className="p-1.5 rounded-lg bg-muted/50">
                  <p className="text-sm font-semibold">{stats?.spotsVisited || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Spots</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="bg-card rounded-xl border p-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium",
                location.pathname === item.to
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <FishXIcon name={item.icon} size={20} />
                {item.label}
              </div>
              {item.badge && item.badge > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Upcoming Trip */}
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Upcoming Trip</h3>
            <Link 
              to="/app/trips" 
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            >
              See All
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {upcomingTrip ? (
            <Link
              to={`/app/trips/${upcomingTrip.id}`}
              className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <p className="font-medium text-sm truncate">{upcomingTrip.title}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(new Date(upcomingTrip.trip_date), 'MMM d, yyyy')}</span>
              </div>
              {upcomingTrip.location_name && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{upcomingTrip.location_name}</span>
                </div>
              )}
            </Link>
          ) : (
            <div className="text-center py-3">
              <p className="text-xs text-muted-foreground mb-2">No upcoming trips</p>
              <Link 
                to="/app/trips/new" 
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Calendar className="h-3 w-3" />
                Plan a Trip
              </Link>
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Quick Links</h3>
          <div className="space-y-1">
            <Link
              to="/app/catches"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Fish className="h-4 w-4" />
              Log a Catch
            </Link>
            <Link
              to="/app/trips/new"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Plan a Trip
            </Link>
          </div>
        </div>
      </div>

      <UpgradeModal 
        isOpen={upgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)} 
        featureName={upgradeFeature}
        upgradeType={upgradeType}
      />
    </>
  );
}
