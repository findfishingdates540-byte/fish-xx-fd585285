import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Heart, Fish, Users, Eye, Target, ChevronRight, UserPlus, Lock,
  Bookmark, Calendar, Clock, MapPin, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UpgradeModal } from '@/components/upgrade/UpgradeModal';
import { Separator } from '@/components/ui/separator';

export function FeedLeftSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { baseAccountMode } = useActiveMode();
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

  // Fetch accepted fishing buddies
  const { data: buddies } = useQuery({
    queryKey: ['sidebar-buddies', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: relationships } = await supabase
        .from('fishing_buddies')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .limit(6);

      if (!relationships || relationships.length === 0) return [];

      const buddyIds = relationships.map(r => 
        r.requester_id === user.id ? r.recipient_id : r.requester_id
      );

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photos, last_active_at')
        .in('id', buddyIds);

      return profiles || [];
    },
    enabled: !!user?.id,
  });

  // Fetch pending buddy requests count
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

  const isOnline = (lastActive: string | null) => {
    if (!lastActive) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastActive) > fiveMinutesAgo;
  };

  // Navigation items
  const navItems = [
    { to: '/app/buddies', icon: Users, label: 'Friends', badge: pendingCount || undefined },
    { to: '/app/catches', icon: Target, label: 'My Catches' },
    { to: '/app/trips', icon: Calendar, label: 'Trips' },
    { to: '/app/spots', icon: MapPin, label: 'Saved Spots' },
  ];

  return (
    <>
      <div className="sticky top-20 space-y-4">
        {/* User Profile Card */}
        {user && (
          <div className="bg-card rounded-xl border overflow-hidden">
            {/* Cover gradient */}
            <div className="h-16 bg-gradient-to-r from-primary/20 to-primary/10" />
            
            {/* Profile info */}
            <div className="px-4 pb-4 -mt-8">
              <Link to="/app/profile" className="block">
                <Avatar className="h-16 w-16 border-4 border-card">
                  <AvatarImage src={profile?.photos?.[0]} alt={profile?.display_name || ''} />
                  <AvatarFallback className="text-lg">{profile?.display_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </Link>
              
              <Link to="/app/profile" className="mt-2 block hover:underline">
                <h3 className="font-semibold">{profile?.display_name || 'Angler'}</h3>
              </Link>
              
              {/* Quick stats */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-semibold">{stats?.catchesLogged || 0}</p>
                  <p className="text-xs text-muted-foreground">Catches</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-semibold">{stats?.tripsPlanned || 0}</p>
                  <p className="text-xs text-muted-foreground">Trips</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-semibold">{stats?.spotsVisited || 0}</p>
                  <p className="text-xs text-muted-foreground">Spots</p>
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
                <item.icon className="h-5 w-5" />
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

        {/* Your Buddies */}
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Your Buddies</h3>
            <Link 
              to="/app/buddies" 
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            >
              See All
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {buddies && buddies.length > 0 ? (
            <div className="space-y-2">
              {buddies.slice(0, 5).map((buddy) => (
                <Link
                  key={buddy.id}
                  to={`/app/u/${buddy.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={buddy.photos?.[0]} alt={buddy.display_name || ''} />
                      <AvatarFallback className="text-xs">
                        {buddy.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline(buddy.last_active_at) && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-card" />
                    )}
                  </div>
                  <span className="text-sm font-medium truncate flex-1">
                    {buddy.display_name || 'Buddy'}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-xs text-muted-foreground mb-2">No buddies yet</p>
              <Link 
                to="/app/buddies" 
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <UserPlus className="h-3 w-3" />
                Find Buddies
              </Link>
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <div className="bg-card rounded-xl border p-4">
          <h3 className="font-semibold text-sm mb-3">Quick Links</h3>
          <div className="space-y-1">
            <Link
              to="/app/catches/log"
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
