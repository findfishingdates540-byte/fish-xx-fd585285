import { Link, useLocation } from 'react-router-dom';
import { Heart, Fish, Users, Eye, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const modeItems = [
  { to: '/app/discover', icon: Heart, label: 'Dating Mode', color: 'text-pink-500' },
  { to: '/app/spots', icon: Fish, label: 'Fishing Spots', color: 'text-foreground' },
  { to: '/app/dashboard', icon: Users, label: 'Combo Mode', color: 'text-cyan-500', active: true },
];

export function FeedLeftSidebar() {
  const location = useLocation();
  const { user } = useAuth();

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
        profileViews: Math.floor(Math.random() * 200) + 50, // Placeholder - would need actual tracking
        catchesLogged: catchesCount || 0,
      };
    },
    enabled: !!user?.id,
  });

  return (
    <div className="sticky top-20 space-y-4">
      {/* Mode Switcher */}
      <div className="bg-background rounded-xl border p-2 space-y-1">
        {modeItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium",
              item.active 
                ? "bg-cyan-50 text-cyan-600 border border-cyan-200" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5", item.active ? "text-cyan-500" : item.color)} />
            {item.label}
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
    </div>
  );
}
