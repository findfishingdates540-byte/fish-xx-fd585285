import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Fish, Users, Eye, Target, ChevronRight, UserPlus, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InviteFriendsCard } from './InviteFriendsCard';
import { UpgradeModal } from '@/components/upgrade/UpgradeModal';

export function FeedLeftSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { baseAccountMode } = useActiveMode();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [upgradeType, setUpgradeType] = useState<'dating' | 'combo' | 'fishing'>('fishing');

  // Determine which mode items to show based on account type
  const getModeItems = () => {
    const items = [];
    
    if (baseAccountMode === 'dating') {
      items.push({ to: '/app/discover', icon: Heart, label: 'Dating Mode', color: 'text-pink-500', active: true, upgradeType: undefined as 'dating' | 'combo' | 'fishing' | undefined });
      items.push({ to: '/app/spots', icon: Fish, label: 'Fishing Spots', color: 'text-foreground', locked: true, upgradeType: 'fishing' as const });
      items.push({ to: '/app/dashboard', icon: Users, label: 'Combo Mode', color: 'text-cyan-500', locked: true, upgradeType: 'combo' as const });
    } else if (baseAccountMode === 'fishing') {
      items.push({ to: '/app/discover', icon: Heart, label: 'Dating Mode', color: 'text-pink-500', locked: true, upgradeType: 'dating' as const });
      items.push({ to: '/app/spots', icon: Fish, label: 'Fishing Spots', color: 'text-foreground', active: true, upgradeType: undefined as 'dating' | 'combo' | 'fishing' | undefined });
      items.push({ to: '/app/dashboard', icon: Users, label: 'Combo Mode', color: 'text-cyan-500', locked: true, upgradeType: 'combo' as const });
    } else {
      // Combo/both users
      items.push({ to: '/app/discover', icon: Heart, label: 'Dating Mode', color: 'text-pink-500', upgradeType: undefined as 'dating' | 'combo' | 'fishing' | undefined });
      items.push({ to: '/app/spots', icon: Fish, label: 'Fishing Spots', color: 'text-foreground', upgradeType: undefined as 'dating' | 'combo' | 'fishing' | undefined });
      items.push({ to: '/app/dashboard', icon: Users, label: 'Combo Mode', color: 'text-cyan-500', active: true, upgradeType: undefined as 'dating' | 'combo' | 'fishing' | undefined });
    }
    
    return items;
  };

  const modeItems = getModeItems();

  const handleModeClick = (item: typeof modeItems[0], e: React.MouseEvent) => {
    if (item.locked) {
      e.preventDefault();
      setUpgradeFeature(item.label);
      setUpgradeType(item.upgradeType || 'fishing');
      setUpgradeModalOpen(true);
    }
  };

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['user-feed-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { profileViews: 0, catchesLogged: 0 };

      const { count: catchesCount } = await supabase
        .from('catches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
        profileViews: Math.floor(Math.random() * 200) + 50,
        catchesLogged: catchesCount || 0,
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

  return (
    <>
      <div className="sticky top-20 space-y-4">
        {/* Mode Switcher */}
        <div className="bg-background rounded-xl border p-2 space-y-1">
          {modeItems.map((item) => (
            <Link
              key={item.to}
              to={item.locked ? '#' : item.to}
              onClick={(e) => handleModeClick(item, e)}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium",
                item.active 
                  ? "bg-cyan-50 text-cyan-600 border border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800" 
                  : item.locked
                  ? "text-muted-foreground/60 hover:bg-muted/50 cursor-pointer"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("h-5 w-5", item.active ? "text-cyan-500" : item.locked ? "text-muted-foreground/50" : item.color)} />
                {item.label}
              </div>
              {item.locked && <Lock className="h-4 w-4 text-muted-foreground/50" />}
            </Link>
          ))}
        </div>

        {/* Your Activity */}
        <div className="bg-background rounded-xl border p-4">
          <h3 className="font-semibold mb-4">Your Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                Profile Views
              </div>
              <span className="text-sm font-semibold text-cyan-600">
                {stats?.profileViews || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Catches Logged
              </div>
              <span className="text-sm font-semibold text-cyan-600">
                {stats?.catchesLogged || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Your Buddies */}
        <div className="bg-background rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-500" />
              <h3 className="font-semibold text-sm">Your Buddies</h3>
              {pendingCount && pendingCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </div>
            <Link 
              to="/app/buddies" 
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            >
              View All
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {buddies && buddies.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {buddies.slice(0, 6).map((buddy) => (
                <Link
                  key={buddy.id}
                  to={`/app/u/${buddy.id}`}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={buddy.photos?.[0]} alt={buddy.display_name || ''} />
                      <AvatarFallback className="text-xs">
                        {buddy.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline(buddy.last_active_at) && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate w-full text-center">
                    {buddy.display_name?.split(' ')[0] || 'Buddy'}
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

        {/* Invite Friends */}
        <InviteFriendsCard />
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
