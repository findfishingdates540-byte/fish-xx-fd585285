import { LayoutDashboard, Users, MapPin, Heart, AlertTriangle, Settings, LogOut, User, Fish, MessageSquare, MessageCircle, Anchor, History, Megaphone, BarChart3, Menu, ShieldCheck, Ticket, ChevronDown, Camera, Swords, Flag, Award } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
  children?: NavItem[];
}

const navItems: NavItem[] = [{
  to: '/admin',
  icon: LayoutDashboard,
  label: 'Dashboard',
  end: true
}, {
  to: '/admin/users',
  icon: Users,
  label: 'User Management'
}, {
  to: '/admin/verifications',
  icon: ShieldCheck,
  label: 'Verifications'
}, {
  to: '/admin/spots',
  icon: MapPin,
  label: 'Fishing Spots',
  children: [{
    to: '/admin/spots',
    icon: MapPin,
    label: 'All Spots',
    end: true
  }, {
    to: '/admin/fish-species',
    icon: Fish,
    label: 'Fish Species'
  }, {
    to: '/admin/scoring',
    icon: Award,
    label: 'Scoring Settings'
  }]
}, {
  to: '/admin/catches',
  icon: Fish,
  label: 'Catches'
}, {
  to: '/admin/posts',
  icon: MessageSquare,
  label: 'Feed Posts'
}, {
  to: '/admin/comments',
  icon: MessageCircle,
  label: 'Comments'
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
}, {
  to: '/admin/photo-challenges',
  icon: Camera,
  label: 'Photo Challenges'
}, {
  to: '/admin/tournaments',
  icon: Swords,
  label: 'Tournaments'
}, {
  to: '/admin/competition-catches',
  icon: Fish,
  label: 'Competition Catches'
}, {
  to: '/admin/team-posts',
  icon: Flag,
  label: 'Team Posts'
}, {
  to: '/admin/support',
  icon: Ticket,
  label: 'Support Tickets'
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

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: profile } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('display_name, photos').eq('id', user.id).single();
      return data;
    },
    enabled: !!user
  });

  const { data: role } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).in('role', ['admin', 'moderator']).maybeSingle();
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

  const handleNavItemClick = () => {
    onNavClick?.();
  };

  return (
    <div className="flex flex-col h-full">
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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          // Check if this item has children (dropdown)
          if (item.children && item.children.length > 0) {
            const isChildActive = item.children.some(child => location.pathname === child.to);
            return (
              <Collapsible key={item.to} defaultOpen={isChildActive}>
                <CollapsibleTrigger className={cn(
                  'flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isChildActive ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                )}>
                  <span className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </span>
                  <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 mt-1 space-y-1">
                  {item.children.map(child => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      end={child.end}
                      onClick={handleNavItemClick}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive ? 'bg-slate-800/70 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      )}
                    >
                      <child.icon className="w-4 h-4" />
                      {child.label}
                    </NavLink>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          }
          
          // Regular nav item without children
          return (
            <NavLink 
              key={item.to} 
              to={item.to} 
              end={item.end} 
              onClick={handleNavItemClick}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}

        <div className="pt-4 border-t border-slate-800 mt-4">
          {bottomItems.map(item => (
            <NavLink 
              key={item.to} 
              to={item.to} 
              onClick={handleNavItemClick}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Back to App Button */}
      <div className="p-4 border-t border-slate-800">
        <Button 
          variant="outline" 
          className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" 
          onClick={handleBackToApp}
        >
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
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-400 hover:text-white hover:bg-slate-800" 
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile/tablet */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-slate-900 flex-col border-r border-slate-800">
        <SidebarContent />
      </aside>

      {/* Mobile/Tablet - Hamburger button and Sheet overlay */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-slate-900 border-slate-800">
            <SidebarContent onNavClick={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>
        <h1 className="font-bold text-white">Fishing Dates Admin</h1>
      </div>
    </>
  );
}