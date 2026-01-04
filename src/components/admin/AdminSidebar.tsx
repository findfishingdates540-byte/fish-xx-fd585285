import { LayoutDashboard, Users, MapPin, Heart, AlertTriangle, Settings, LogOut, Fish, MessageSquare, Anchor, History, Megaphone, BarChart3 } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const navItems = [{
  to: '/admin',
  icon: LayoutDashboard,
  label: 'Dashboard',
  end: true
}, {
  to: '/admin/users',
  icon: Users,
  label: 'User Management'
}, {
  to: '/admin/spots',
  icon: MapPin,
  label: 'Fishing Spots'
}, {
  to: '/admin/catches',
  icon: Fish,
  label: 'Catches'
}, {
  to: '/admin/posts',
  icon: MessageSquare,
  label: 'Feed Posts'
}, {
  to: '/admin/trips',
  icon: Anchor,
  label: 'Trips'
}, {
  to: '/admin/matches',
  icon: Heart,
  label: 'Matches'
}, {
  to: '/admin/reports',
  icon: AlertTriangle,
  label: 'Reports'
}, {
  to: '/admin/ads',
  icon: Megaphone,
  label: 'Advertisements'
}, {
  to: '/admin/ad-analytics',
  icon: BarChart3,
  label: 'Ad Analytics'
}];

const bottomItems = [{
  to: '/admin/audit-logs',
  icon: History,
  label: 'Audit Logs'
}, {
  to: '/admin/settings',
  icon: Settings,
  label: 'Settings'
}];
export function AdminSidebar() {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const {
    data: profile
  } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const {
        data
      } = await supabase.from('profiles').select('display_name, photos').eq('id', user.id).single();
      return data;
    },
    enabled: !!user
  });
  const {
    data: role
  } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const {
        data
      } = await supabase.from('user_roles').select('role').eq('user_id', user.id).in('role', ['admin', 'moderator']).maybeSingle();
      return data?.role || 'Admin';
    },
    enabled: !!user
  });
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  const handleBackToApp = () => {
    navigate('/app');
  };
  return <aside className="w-64 min-h-screen bg-slate-900 flex flex-col border-r border-slate-800">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          
          <div>
            <h1 className="font-bold text-white">Fishing Dates Admin</h1>
            <p className="text-xs text-slate-400">v2.4.0 (Stable)</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => <NavLink key={item.to} to={item.to} end={item.end} className={({
        isActive
      }) => cn('flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors', isActive ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50')}>
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>)}

        <div className="pt-4 border-t border-slate-800 mt-4">
          {bottomItems.map(item => <NavLink key={item.to} to={item.to} className={({
          isActive
        }) => cn('flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors', isActive ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50')}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>)}
        </div>
      </nav>

      {/* Back to App Button */}
      <div className="p-4 border-t border-slate-800">
        <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={handleBackToApp}>
          ← Back to App
        </Button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={profile?.photos?.[0]} />
            <AvatarFallback className="bg-slate-700 text-white">
              {profile?.display_name?.[0]?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.display_name || 'Admin'}
            </p>
            <p className="text-xs text-slate-400 capitalize">
              {role === 'admin' ? 'Super Admin' : role}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800" onClick={handleSignOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>;
}